'use client'

import { useEffect, useState } from 'react'

/**
 * Nivel de efectos que aguanta el equipo. El navegador no expone CPU/GPU, así que se estima:
 *   1. pistas del hardware (núcleos, RAM en Chromium, ahorro de datos),
 *   2. ~60 frames medidos con requestAnimationFrame en reposo,
 *   3. en vivo: re-mide los FPS cada 20 s (pestaña visible); si DOS mediciones seguidas salen
 *      por debajo del nivel actual, baja uno, solo para la sesión. No usa "long tasks": esas las
 *      genera la propia app al cargar datos o cambiar de pantalla y castigaban al dashboard.
 * La medición inicial se cachea 7 días en localStorage. Mientras mide reporta 'low' (sin nieve ni
 * brillos) para no agregar jank a la carga. `?seasonal-tier=high|medium|low` lo fuerza (sin cache).
 */
export type PerformanceTier = 'low' | 'medium' | 'high'

const CACHE_KEY = 'seasonal-perf-tier'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const ORDER: PerformanceTier[] = ['low', 'medium', 'high']

const minTier = (a: PerformanceTier, b: PerformanceTier) =>
  ORDER[Math.min(ORDER.indexOf(a), ORDER.indexOf(b))]

const isTier = (v: unknown): v is PerformanceTier => v === 'low' || v === 'medium' || v === 'high'

function readCache(): PerformanceTier | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { tier, measuredAt } = JSON.parse(raw) as { tier?: unknown; measuredAt?: number }
    if (!isTier(tier) || typeof measuredAt !== 'number') return null
    if (Date.now() - measuredAt > CACHE_TTL_MS) return null
    return tier
  } catch {
    return null
  }
}

function writeCache(tier: PerformanceTier) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tier, measuredAt: Date.now() }))
  } catch {
    /* almacenamiento bloqueado: solo se pierde el cache */
  }
}

function hardwareCeiling(): PerformanceTier {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (nav.connection?.saveData) return 'low'
  const cores = nav.hardwareConcurrency
  const memory = nav.deviceMemory
  if ((cores && cores <= 2) || (memory && memory <= 2)) return 'low'
  if ((cores && cores <= 4) || (memory && memory <= 4)) return 'medium'
  return 'high'
}

function measureFrames(frames = 60): Promise<PerformanceTier> {
  return new Promise((resolve) => {
    const deltas: number[] = []
    let last = performance.now()
    const tick = (now: number) => {
      deltas.push(now - last)
      last = now
      if (deltas.length < frames) {
        requestAnimationFrame(tick)
        return
      }
      // El primer delta incluye la espera hasta el primer frame: se descarta.
      const sample = deltas.slice(1)
      const avg = sample.reduce((s, d) => s + d, 0) / sample.length
      const slowShare = sample.filter((d) => d > 50).length / sample.length
      if (avg > 25 || slowShare > 0.1) resolve('low')
      else if (avg > 18) resolve('medium')
      else resolve('high')
    }
    requestAnimationFrame(tick)
  })
}

function readOverride(): PerformanceTier | null {
  try {
    const v = new URLSearchParams(window.location.search).get('seasonal-tier')
    return isTier(v) ? v : null
  } catch {
    return null
  }
}

/** `enabled=false` no mide nada (sin temporada o decoración apagada). */
export function usePerformanceTier(enabled: boolean): PerformanceTier {
  const [tier, setTier] = useState<PerformanceTier>('low')

  // Detección inicial (cache, override o medición).
  useEffect(() => {
    if (!enabled) return
    const override = readOverride()
    if (override) {
      setTier(override)
      return
    }
    const cached = readCache()
    if (cached) {
      setTier(cached)
      return
    }

    let cancelled = false
    const ceiling = hardwareCeiling()
    const run = async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      let measured: PerformanceTier = ceiling === 'low' ? 'low' : await measureFrames()
      // Una muestra baja puede ser la propia carga de la página (datos, hidratación): se repite una
      // vez a los 3 s y se queda la mejor de las dos.
      if (!cancelled && ceiling !== 'low' && measured !== 'high') {
        await new Promise((r) => setTimeout(r, 3000))
        if (!cancelled && document.visibilityState === 'visible') {
          const retry = await measureFrames()
          if (ORDER.indexOf(retry) > ORDER.indexOf(measured)) measured = retry
        }
      }
      if (cancelled) return
      const result = minTier(ceiling, measured)
      writeCache(result)
      setTier(result)
    }

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    let idleId: number | undefined
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    if (w.requestIdleCallback) idleId = w.requestIdleCallback(run, { timeout: 2000 })
    else timeoutId = setTimeout(run, 500)

    return () => {
      cancelled = true
      if (idleId !== undefined) w.cancelIdleCallback?.(idleId)
      if (timeoutId !== undefined) clearTimeout(timeoutId)
    }
  }, [enabled])

  // Vigilancia en vivo: re-mide FPS cada 20 s; dos mediciones seguidas peores que el nivel actual
  // ⇒ baja uno, solo en esta sesión (sin escribir el cache: un mal rato no castiga 7 días).
  useEffect(() => {
    if (!enabled || tier === 'low' || readOverride()) return
    let cancelled = false
    let strikes = 0
    const interval = setInterval(async () => {
      if (cancelled || document.visibilityState !== 'visible') return
      const measured = await measureFrames()
      if (cancelled) return
      strikes = ORDER.indexOf(measured) < ORDER.indexOf(tier) ? strikes + 1 : 0
      if (strikes >= 2) setTier(ORDER[Math.max(0, ORDER.indexOf(tier) - 1)])
    }, 20_000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled, tier])

  return tier
}
