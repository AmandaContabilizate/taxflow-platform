'use client'

import { HatSvg } from './TreeSvg'
import { useSeasonal } from './SeasonalProvider'

/**
 * Gorrito sobre el arco superior de la "C" del logo (36 px; la cima del arco cae ~40 % desde la
 * izquierda), no en la esquina del cuadro, que en este logo queda junto a la "z".
 * El contenedor del logo debe ser `relative`.
 */
export function LogoOrnament() {
  const { active } = useSeasonal()
  if (!active) return null
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -top-[11px] left-[5px] h-4 w-4 -rotate-[14deg]"
    >
      <HatSvg />
    </span>
  )
}
