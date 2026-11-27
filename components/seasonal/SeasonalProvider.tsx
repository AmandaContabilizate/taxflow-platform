'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { saveUserPreferences } from '@/features/settings/actions/userPreferences.action'
import type { Season, SeasonalInit } from '@/lib/seasonal'
import { usePerformanceTier, type PerformanceTier } from './usePerformanceTier'

/**
 * Estado de la decoración de temporada.
 *
 * - `user` (dashboard): la preferencia vive en el backend (AspNetUsers.SeasonalThemeEnabled) y
 *   se espeja en localStorage para que el login de este dispositivo la respete.
 * - `anonymous` (login): solo localStorage. Si se cambia aquí queda `pendingSync` y el dashboard
 *   la sube al entrar (lo más reciente gana).
 * - easter egg (`?h=December` fuera de temporada): se muestra aunque esté apagada y nada se persiste.
 *
 * Las decoraciones solo se pintan tras montar (`ready`), así no hay hydration mismatch ni
 * parpadeo cuando localStorage dice otra cosa que el render del servidor.
 */

interface SeasonalContextValue {
  season: Season | null
  easterEgg: boolean
  enabled: boolean
  /** Hay temporada y el usuario no la apagó. */
  active: boolean
  /** Ya montó y resolvió localStorage: se pueden pintar decoraciones. */
  ready: boolean
  tier: PerformanceTier
  reducedMotion: boolean
  setEnabled: (value: boolean) => void
}

const SeasonalContext = createContext<SeasonalContextValue | null>(null)

const PREF_KEY = 'seasonal-theme'
const EGG_KEY = 'seasonal-egg'

interface StoredPref {
  enabled: boolean
  pendingSync: boolean
}

function readPref(): StoredPref | null {
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<StoredPref>
    return typeof v.enabled === 'boolean' ? { enabled: v.enabled, pendingSync: !!v.pendingSync } : null
  } catch {
    return null
  }
}

function writePref(pref: StoredPref) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(pref))
  } catch {
    /* almacenamiento bloqueado */
  }
}

function readEggSession(): boolean {
  try {
    return sessionStorage.getItem(EGG_KEY) === '1'
  } catch {
    return false
  }
}

export function SeasonalProvider({
  init,
  mode,
  children,
}: {
  init: SeasonalInit
  mode: 'user' | 'anonymous'
  children: ReactNode
}) {
  const [ready, setReady] = useState(false)
  const [season, setSeason] = useState<Season | null>(init.season)
  const [easterEgg, setEasterEgg] = useState(init.easterEgg)
  const [enabled, setEnabledState] = useState<boolean>(init.enabled ?? true)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Resolución inicial en el cliente: egg de la sesión + preferencia local.
  useEffect(() => {
    let resolvedSeason = init.season
    let egg = init.easterEgg
    if (init.easterEgg) {
      try {
        sessionStorage.setItem(EGG_KEY, '1')
      } catch {
        /* sin sessionStorage: el egg dura lo que dure el ?h= en la URL */
      }
    } else if (!init.season && init.eggAllowed && readEggSession()) {
      resolvedSeason = 'christmas'
      egg = true
    }
    setSeason(resolvedSeason)
    setEasterEgg(egg)

    if (egg) {
      // Lo pidió explícitamente con la URL: se muestra aunque la haya apagado.
      setEnabledState(true)
    } else {
      const local = readPref()
      if (mode === 'user') {
        if (local?.pendingSync) {
          // Cambio hecho en el login (o un PUT que falló): lo local es lo más reciente.
          setEnabledState(local.enabled)
          void saveUserPreferences({ seasonalThemeEnabled: local.enabled }).then((r) => {
            if (r.success) writePref({ enabled: local.enabled, pendingSync: false })
          })
        } else if (init.enabled !== null) {
          setEnabledState(init.enabled)
          writePref({ enabled: init.enabled, pendingSync: false })
        } else {
          setEnabledState(local?.enabled ?? true)
        }
      } else {
        setEnabledState(local?.enabled ?? true)
      }
    }
    setReady(true)
    // Solo al montar: init viene del servidor y no cambia sin recargar la página.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const active = ready && !!season && enabled
  const tier = usePerformanceTier(active)

  // Acentos de color: atributo en <html> que activa los tokens [data-season] de globals.css.
  useEffect(() => {
    const root = document.documentElement
    if (active && season) root.dataset.season = season
    else delete root.dataset.season
    return () => {
      delete root.dataset.season
    }
  }, [active, season])

  const setEnabled = useCallback(
    (value: boolean) => {
      setEnabledState(value)
      if (easterEgg) return // egg: solo estado de la sesión, sin persistir nada
      writePref({ enabled: value, pendingSync: true })
      if (mode !== 'user') return
      void saveUserPreferences({ seasonalThemeEnabled: value }).then((r) => {
        // Si falla, queda pendingSync y se reintenta en la siguiente carga del dashboard.
        if (r.success) writePref({ enabled: value, pendingSync: false })
      })
    },
    [easterEgg, mode],
  )

  const value = useMemo<SeasonalContextValue>(
    () => ({ season, easterEgg, enabled, active, ready, tier, reducedMotion, setEnabled }),
    [season, easterEgg, enabled, active, ready, tier, reducedMotion, setEnabled],
  )

  return <SeasonalContext.Provider value={value}>{children}</SeasonalContext.Provider>
}

const INACTIVE: SeasonalContextValue = {
  season: null,
  easterEgg: false,
  enabled: false,
  active: false,
  ready: false,
  tier: 'low',
  reducedMotion: true,
  setEnabled: () => {},
}

/** Fuera de un SeasonalProvider devuelve un estado inactivo (no truena). */
export function useSeasonal(): SeasonalContextValue {
  return useContext(SeasonalContext) ?? INACTIVE
}
