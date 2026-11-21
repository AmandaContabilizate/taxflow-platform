'use client'

import { HatSvg } from './TreeSvg'
import { useSeasonal } from './SeasonalProvider'

/** Gorrito sobre la esquina del logo. El contenedor del logo debe ser `relative`. */
export function LogoOrnament() {
  const { active } = useSeasonal()
  if (!active) return null
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-2 -right-1.5 h-4 w-4 rotate-[18deg]"
    >
      <HatSvg />
    </span>
  )
}
