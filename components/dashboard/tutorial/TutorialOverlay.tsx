'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'
import { DISPLAY } from '../constants'
import { clickableOf, findTourTarget } from './tutorial-dom'
import type { TutorialCtx, TutorialDef } from './tutorials'

const PAD = 6
const GAP = 12
const MARGIN = 12
const DEFAULT_WAIT_MS = 4000
const SHEET_BREAKPOINT = 640
const RADIUS = 12

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

interface Props {
  tutorial: TutorialDef
  index: number
  ctx: TutorialCtx
  onIndexChange: (index: number) => void
  onFinish: () => void
}

function sameRect(a: Rect | null, b: Rect | null) {
  if (!a || !b) return a === b
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height
}

export function TutorialOverlay({ tutorial, index, ctx, onIndexChange, onFinish }: Props) {
  const step = tutorial.steps[index]
  const last = tutorial.steps.length - 1
  const isLast = index === last

  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [searching, setSearching] = useState(true)
  const [rect, setRect] = useState<Rect | null>(null)
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [tipSize, setTipSize] = useState({ w: 0, h: 0 })
  const tipRef = useRef<HTMLDivElement>(null)
  const advancedRef = useRef(false)
  const simulatingRef = useRef(false)
  // El ctx cambia en cada render del provider; los efectos de paso deben leer el último sin reiniciarse.
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx

  const goTo = useCallback(
    (next: number) => {
      if (advancedRef.current) return
      advancedRef.current = true
      if (next > last) onFinish()
      else onIndexChange(next)
    },
    [last, onFinish, onIndexChange],
  )

  // 1) Entrar al paso: preparar la UI, navegar a su pantalla y esperar al ancla.
  useEffect(() => {
    advancedRef.current = false
    setTarget(null)
    setRect(null)
    setSearching(true)

    const c = ctxRef.current
    step.prepare?.(c)
    if (step.screen && c.screen !== step.screen) c.go(step.screen)

    if (!step.target) {
      setSearching(false)
      return
    }

    let done = false
    const found = (el: HTMLElement | null) => {
      if (done) return
      done = true
      observer.disconnect()
      clearTimeout(timer)
      if (!el && step.skipIfMissing) {
        goTo(index + 1)
        return
      }
      setTarget(el)
      setSearching(false)
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
    const tryFind = () => {
      const el = findTourTarget(step.target!)
      if (el) found(el)
    }
    const observer = new MutationObserver(tryFind)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'data-state'] })
    const timer = setTimeout(() => found(findTourTarget(step.target!)), step.waitMs ?? DEFAULT_WAIT_MS)
    // Un frame para que la navegación / el prepare pinten antes del primer intento.
    const raf = requestAnimationFrame(tryFind)

    return () => {
      done = true
      observer.disconnect()
      clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorial.id, index])

  // 2) Seguir la caja del ancla (scroll, resize, animaciones del layout).
  useEffect(() => {
    let raf = 0
    const tick = () => {
      setViewport((v) => (v.w === window.innerWidth && v.h === window.innerHeight ? v : { w: window.innerWidth, h: window.innerHeight }))
      if (target) {
        if (!target.isConnected) {
          // El ancla se desmontó (cambió la pantalla): buscar su reemplazo.
          const again = step.target ? findTourTarget(step.target) : null
          setTarget(again)
        } else {
          const r = target.getBoundingClientRect()
          const next = { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 }
          setRect((prev) => (sameRect(prev, next) ? prev : next))
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, step.target])

  // 3) Clic real en el ancla: dejar pasar el evento (lo atiende la app) y avanzar.
  useEffect(() => {
    if (!target || step.advanceOn !== 'click') return
    const onClick = (e: MouseEvent) => {
      if (simulatingRef.current) return
      if (e.target instanceof Node && target.contains(e.target)) {
        setTimeout(() => goTo(index + 1), 0)
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [target, step.advanceOn, goTo, index])

  // 4) Esc del usuario = Omitir. Los Escape sintéticos (closeDialogs) no son isTrusted.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !e.isTrusted) return
      if (isLast) onFinish()
      else goTo(last)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isLast, last, goTo, onFinish])

  useLayoutEffect(() => {
    const el = tipRef.current
    if (!el) return
    const measure = () => setTipSize((s) => (s.w === el.offsetWidth && s.h === el.offsetHeight ? s : { w: el.offsetWidth, h: el.offsetHeight }))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [index, tutorial.id])

  useEffect(() => {
    if (!searching) tipRef.current?.focus({ preventScroll: true })
  }, [searching, index])

  const next = () => {
    if (step.advanceOn === 'click') {
      if (target && target.isConnected) {
        // Mismo evento que el clic del usuario: el onClick de React del ancla corre igual.
        simulatingRef.current = true
        try {
          clickableOf(target).click()
        } finally {
          simulatingRef.current = false
        }
      } else {
        step.fallback?.(ctxRef.current)
      }
    }
    goTo(index + 1)
  }

  const back = () => {
    if (index > 0) goTo(index - 1)
  }

  const skip = () => (isLast ? onFinish() : goTo(last))

  if (typeof document === 'undefined') return null

  const body = typeof step.body === 'function' ? step.body(ctx) : step.body
  const hole = target ? rect : null
  const vw = viewport.w || (typeof window !== 'undefined' ? window.innerWidth : 0)
  const vh = viewport.h || (typeof window !== 'undefined' ? window.innerHeight : 0)
  const tip = placeTooltip(hole, step.placement, tipSize, vw, vh)

  const blocker: CSSProperties = { position: 'fixed', pointerEvents: 'auto' }

  return createPortal(
    <div data-tutorial-ui="" className="fixed inset-0 z-[100]" style={{ pointerEvents: 'none' }}>
      {hole ? (
        <>
          {/* Sombra con hueco redondeado (mismo radio que el borde) para que no se vea descuadrado. */}
          <svg
            width={vw}
            height={vh}
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              style={{ fill: 'var(--tutorial-backdrop)' }}
              d={`M0 0H${vw}V${vh}H0Z ${roundedRectPath(hole, RADIUS)}`}
            />
          </svg>
          {/* Bloqueadores transparentes alrededor del hueco: el clic en el ancla sí llega a la app. */}
          <div style={{ ...blocker, top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
          <div style={{ ...blocker, top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
          <div style={{ ...blocker, top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
          <div style={{ ...blocker, top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
          <div
            className="tutorial-ring"
            style={{
              position: 'fixed',
              top: hole.top,
              left: hole.left,
              width: hole.width,
              height: hole.height,
              borderRadius: RADIUS,
              pointerEvents: 'none',
            }}
          />
        </>
      ) : (
        <div style={{ ...blocker, inset: 0, background: 'var(--tutorial-backdrop)' }} />
      )}

      {searching && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ pointerEvents: 'none' }}>
          <Loader2 size={28} className="animate-spin" style={{ color: 'var(--tutorial-ring)' }} />
        </div>
      )}

      <div
        ref={tipRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby="tutorial-step-title"
        aria-describedby="tutorial-step-body"
        tabIndex={-1}
        className="rounded-2xl p-5 outline-none"
        style={{
          position: 'fixed',
          ...tip,
          pointerEvents: 'auto',
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--sh-3)',
          visibility: searching ? 'hidden' : 'visible',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>
              {tutorial.title} · {index + 1}/{tutorial.steps.length}
            </div>
            <div id="tutorial-step-title" className="text-[17px] font-extrabold leading-tight mt-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              {step.title}
            </div>
          </div>
          <button
            type="button"
            onClick={onFinish}
            aria-label="Cerrar tutorial"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:opacity-70"
            style={{ color: 'var(--ink-500)' }}
          >
            <X size={16} />
          </button>
        </div>

        <p id="tutorial-step-body" aria-live="polite" className="text-[13.5px] leading-snug mt-2" style={{ color: 'var(--ink-700)' }}>
          {body}
        </p>

        <div className="flex items-center gap-2 mt-4">
          {!isLast && (
            <button
              type="button"
              onClick={skip}
              className="text-[12.5px] font-bold px-2 py-1.5 rounded-lg transition hover:opacity-70"
              style={{ color: 'var(--ink-500)' }}
            >
              Omitir
            </button>
          )}
          <div className="flex-1" />
          {index > 0 && !isLast && (
            <button
              type="button"
              onClick={back}
              className="text-[13px] font-bold px-3.5 py-2 rounded-xl transition hover:opacity-80"
              style={{ background: 'var(--muted)', color: 'var(--ink-700)' }}
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? onFinish : next}
            className="text-[13px] font-bold px-4 py-2 rounded-xl transition hover:opacity-90"
            style={{ background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)' }}
          >
            {isLast ? 'Terminar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Subtrazo SVG de un rectángulo redondeado (se resta del fondo con fill-rule evenodd). */
function roundedRectPath({ top, left, width, height }: Rect, radius: number): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const right = left + width
  const bottom = top + height
  return [
    `M${left + r} ${top}`,
    `H${right - r}`,
    `A${r} ${r} 0 0 1 ${right} ${top + r}`,
    `V${bottom - r}`,
    `A${r} ${r} 0 0 1 ${right - r} ${bottom}`,
    `H${left + r}`,
    `A${r} ${r} 0 0 1 ${left} ${bottom - r}`,
    `V${top + r}`,
    `A${r} ${r} 0 0 1 ${left + r} ${top}`,
    'Z',
  ].join(' ')
}

/**
 * Posición del tooltip: en el lado pedido si cabe, si no el primero que quepa; sin ancla, centrado.
 * En pantallas angostas va como hoja abajo (o arriba si el ancla está en la mitad inferior).
 */
function placeTooltip(
  hole: Rect | null,
  placement: 'top' | 'bottom' | 'left' | 'right' | undefined,
  size: { w: number; h: number },
  vw: number,
  vh: number,
): CSSProperties {
  const width = Math.min(360, vw - MARGIN * 2)

  if (vw < SHEET_BREAKPOINT) {
    const anchorBelowMiddle = hole ? hole.top + hole.height / 2 > vh / 2 : false
    return anchorBelowMiddle
      ? { top: MARGIN, left: MARGIN, right: MARGIN }
      : { bottom: MARGIN, left: MARGIN, right: MARGIN }
  }

  if (!hole) {
    return { width, top: Math.max(MARGIN, (vh - size.h) / 2), left: Math.max(MARGIN, (vw - width) / 2) }
  }

  const h = size.h || 180
  const fits = {
    bottom: hole.top + hole.height + GAP + h <= vh - MARGIN,
    top: hole.top - GAP - h >= MARGIN,
    right: hole.left + hole.width + GAP + width <= vw - MARGIN,
    left: hole.left - GAP - width >= MARGIN,
  }
  const order = [placement ?? 'bottom', 'bottom', 'top', 'right', 'left'] as const
  const side = order.find((s) => fits[s]) ?? 'bottom'

  const clampX = (x: number) => Math.min(Math.max(MARGIN, x), vw - width - MARGIN)
  const clampY = (y: number) => Math.min(Math.max(MARGIN, y), vh - h - MARGIN)
  const centerX = hole.left + hole.width / 2 - width / 2
  const centerY = hole.top + hole.height / 2 - h / 2

  switch (side) {
    case 'top':
      return { width, top: clampY(hole.top - GAP - h), left: clampX(centerX) }
    case 'right':
      return { width, top: clampY(centerY), left: hole.left + hole.width + GAP }
    case 'left':
      return { width, top: clampY(centerY), left: hole.left - GAP - width }
    default:
      return { width, top: clampY(hole.top + hole.height + GAP), left: clampX(centerX) }
  }
}
