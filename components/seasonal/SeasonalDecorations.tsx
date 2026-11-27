'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { GiftSvg, TreeSvg } from './TreeSvg'
import { Snowfall } from './Snowfall'
import { useSeasonal } from './SeasonalProvider'

// Arbolito ⇄ regalo. Clic en el arbolito: se encoge y viaja a la esquina inferior derecha, donde
// queda guardado en un regalo discreto (y la preferencia se apaga). Clic en el regalo: el
// arbolito sale de ahí de regreso a su lugar. Sin animación con reduced-motion o nivel 'low'.

const ANIM_MS = 450
// Centro del regalo: fixed bottom-2 (8px) right-12 (48px), 22px de lado.
const GIFT_RIGHT = 48
const GIFT_BOTTOM = 8
const GIFT_SIZE = 22

type Phase = 'idle' | 'leaving' | 'entering'

interface Props {
  /** dashboard: arbolito chico a la izquierda del main. login: chico en móvil, grande en md+. */
  placement: 'dashboard' | 'login'
  /** Solo dashboard: ancho del sidebar para anclar el arbolito a la izquierda del main. */
  sidebarCollapsed?: boolean
  showSnow?: boolean
}

function vectorToGift(el: HTMLElement): { dx: string; dy: string } {
  const r = el.getBoundingClientRect()
  const giftX = window.innerWidth - GIFT_RIGHT - GIFT_SIZE / 2
  const giftY = window.innerHeight - GIFT_BOTTOM - GIFT_SIZE / 2
  return {
    dx: `${giftX - (r.left + r.width / 2)}px`,
    dy: `${giftY - (r.top + r.height / 2)}px`,
  }
}

export function SeasonalDecorations({ placement, sidebarCollapsed = false, showSnow = false }: Props) {
  const { season, ready, enabled, tier, reducedMotion, setEnabled } = useSeasonal()
  const [phase, setPhase] = useState<Phase>('idle')
  const [vector, setVector] = useState<{ dx: string; dy: string } | null>(null)
  const [giftPop, setGiftPop] = useState(false)
  const treeRef = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const animate = !reducedMotion && tier !== 'low'

  // Al "salir del regalo" el arbolito recién montado necesita su vector antes de pintarse.
  useLayoutEffect(() => {
    if (phase !== 'entering' || !treeRef.current) return
    setVector(vectorToGift(treeRef.current))
    timer.current = setTimeout(() => setPhase('idle'), ANIM_MS)
  }, [phase])

  useLayoutEffect(() => () => clearTimeout(timer.current), [])

  if (!ready || !season) return null

  const hideTree = () => {
    if (!animate || !treeRef.current) {
      setEnabled(false)
      return
    }
    setVector(vectorToGift(treeRef.current))
    setPhase('leaving')
    timer.current = setTimeout(() => {
      setPhase('idle')
      setGiftPop(true)
      setEnabled(false)
    }, ANIM_MS)
  }

  const showTree = () => {
    setGiftPop(false)
    setVector(null)
    setEnabled(true)
    if (animate) setPhase('entering')
  }

  const showTreeEl = enabled || phase === 'leaving'
  const showGift = !enabled && phase !== 'leaving'

  const treePosition =
    placement === 'dashboard'
      ? 'fixed bottom-4 left-4 lg:left-[calc(var(--seasonal-sidebar-w)+16px)] seasonal-tree--small'
      : // Login móvil: esquina superior izquierda de la tarjeta (abajo taparía el texto legal).
        'absolute top-6 left-6 md:top-auto md:bottom-6 seasonal-tree--login'

  const phaseClass =
    phase === 'leaving'
      ? 'seasonal-tree-leaving'
      : phase === 'entering'
        ? vector
          ? 'seasonal-tree-entering'
          : 'opacity-0'
        : ''

  const treeStyle = {
    ['--seasonal-sidebar-w' as string]: sidebarCollapsed ? '80px' : '260px',
    ...(vector ? { ['--dx' as string]: vector.dx, ['--dy' as string]: vector.dy } : {}),
  } as CSSProperties

  return (
    <>
      {showSnow && enabled && <Snowfall />}

      {showTreeEl && (
        <button
          ref={treeRef}
          type="button"
          onClick={phase === 'idle' ? hideTree : undefined}
          aria-label="Quitar decoración de temporada"
          title="Guardar la decoración"
          data-tier={reducedMotion ? 'low' : tier}
          className={`seasonal-tree z-30 cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--season-gold)] ${treePosition} ${phaseClass}`}
          style={treeStyle}
        >
          <TreeSvg />
        </button>
      )}

      {showGift && (
        <button
          type="button"
          onClick={showTree}
          aria-label="Volver a poner la decoración de temporada"
          title="Volver a poner la decoración"
          className={`seasonal-gift fixed bottom-2 right-12 z-[41] h-[22px] w-[22px] cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[var(--season-gold)] ${giftPop && animate ? 'seasonal-gift-pop' : ''}`}
        >
          <GiftSvg />
        </button>
      )}
    </>
  )
}
