'use client'

import { useMemo } from 'react'
import { useSeasonal } from './SeasonalProvider'

// Nieve ligera, solo CSS (translate3d en el compositor). Copos deterministas (LCG con semilla
// fija): mismo layout en cada render, sin Math.random. Cantidad según nivel de rendimiento;
// nada en 'low' ni con prefers-reduced-motion.

const COUNT = { high: 20, medium: 8, low: 0 } as const

function lcg(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

interface Flake {
  left: number
  size: number
  duration: number
  delay: number
  drift: number
  opacity: number
}

function buildFlakes(count: number, slow: boolean): Flake[] {
  const rnd = lcg(1225)
  return Array.from({ length: count }, () => {
    const duration = (slow ? 20 : 14) + rnd() * 10
    return {
      left: rnd() * 100,
      size: 2 + rnd() * 3,
      duration,
      // Retraso negativo: al montar ya están repartidos por la pantalla, no caen todos juntos.
      delay: -rnd() * duration,
      drift: (rnd() - 0.5) * 60,
      opacity: 0.35 + rnd() * 0.25,
    }
  })
}

export function Snowfall() {
  const { active, tier, reducedMotion } = useSeasonal()
  const count = active && !reducedMotion ? COUNT[tier] : 0
  const flakes = useMemo(() => buildFlakes(count, tier === 'medium'), [count, tier])
  if (count === 0) return null

  return (
    <div aria-hidden className="seasonal-snow pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="seasonal-flake"
          style={{
            left: `${f.left}%`,
            width: f.size,
            height: f.size,
            opacity: f.opacity,
            ['--dur' as string]: `${f.duration}s`,
            ['--delay' as string]: `${f.delay}s`,
            ['--drift' as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
