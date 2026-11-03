'use client'

import { Coins } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DISPLAY } from './constants'
import type { GoFn } from './types'

/** Se marca cuando el cliente abre Referidos: el badge "NUEVO" deja de llamar la atención. */
export const REFERIDOS_VISTO_KEY = 'referidos-visto'
const SESSION_KEY = 'referidos-flotante-animado'

/*
 * Reglas de movimiento: el botón está en todas las pantallas (se ve decenas de veces al día), así
 * que la entrada corre UNA vez por sesión (desliza 12 px desde la derecha, 280 ms, ease-out fuerte).
 * El anillo del badge "NUEVO" late 3 veces y se detiene: nada queda en bucle. Hover gated a puntero
 * fino, presión con escala. Con reduced-motion queda solo el fade.
 */
const CSS = `
@keyframes rf-entrar { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
@keyframes rf-anillo { 0% { transform: scale(1); opacity: 0.7; } 100% { transform: scale(2.2); opacity: 0; } }
.rf-wrap[data-animar="1"] { animation: rf-entrar 280ms cubic-bezier(0.23, 1, 0.32, 1) 400ms both; }
.rf-anillo { animation: rf-anillo 1.1s cubic-bezier(0.23, 1, 0.32, 1) 900ms 3; }
.rf-btn { transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms ease; }
@media (hover: hover) and (pointer: fine) {
  .rf-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 30px -4px rgba(115,57,253,0.45), 0 0 16px 2px rgba(0,211,161,0.25); }
  .rf-btn:hover .rf-icono { transform: rotate(-8deg); }
}
.rf-btn:active { transform: scale(0.96); }
.rf-icono { transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1); }
@media (prefers-reduced-motion: reduce) {
  .rf-wrap[data-animar="1"] { animation: rf-entrar 200ms ease 200ms both; transform: none; }
  .rf-anillo { animation: none; opacity: 0; }
  .rf-btn:hover { transform: none; }
  .rf-btn:hover .rf-icono { transform: none; }
}
`

/**
 * Botón flotante "Referidos · NUEVO", apilado sobre Conta Vic en la esquina inferior derecha.
 * Lleva a Mi cuenta → Referidos. Se oculta en la propia pantalla de Referidos.
 */
export function FloatingReferidosButton({ go, hidden }: { go: GoFn; hidden?: boolean }) {
  const [animar, setAnimar] = useState(false)
  const [visto, setVisto] = useState(true)
  const wrapRef = useRef<HTMLElement | null>(null)
  // Posición: siempre encima de Conta Vic, alineado a su borde derecho, con 32 px de aire. Conta Vic se
  // puede arrastrar y recuerda su posición, así que se sigue su rect real (MutationObserver sobre su
  // style) en vez de adivinar. Si no está, esquina inferior derecha.
  const [pos, setPos] = useState<{ left: number; top: number; transition: string } | null>(null)

  useEffect(() => {
    if (hidden) return
    const GAP = 32
    let raf = 0
    // Conta Vic se pinta un render después (espera su posición guardada): si se busca una sola vez al
    // montar no existe todavía y este botón se quedaba en la esquina, encima de él. Se busca hasta que aparece.
    let vic: HTMLElement | null = null
    let vicObserver: MutationObserver | null = null
    const findVic = () => {
      if (vic?.isConnected) return vic
      vicObserver?.disconnect()
      vic = document.querySelector<HTMLElement>('aside[aria-label="Asistencia virtual Conta Vic"]')
      if (vic) {
        vicObserver = new MutationObserver(schedule)
        vicObserver.observe(vic, { attributes: true, attributeFilter: ['style'] })
      }
      return vic
    }
    const recalc = () => {
      raf = 0
      const me = wrapRef.current
      if (!me) return
      const myRect = me.getBoundingClientRect()
      const vic = findVic()
      if (!vic) {
        setPos({ left: window.innerWidth - myRect.width - 20, top: window.innerHeight - myRect.height - 150, transition: 'none' })
        return
      }
      const r = vic.getBoundingClientRect()
      const arrastrando = vic.style.transition === 'none'
      const left = Math.max(8, Math.min(r.right - myRect.width, window.innerWidth - myRect.width - 8))
      const top = Math.max(8, r.top - myRect.height - GAP)
      setPos({ left, top, transition: arrastrando ? 'none' : 'left 0.35s cubic-bezier(0.16, 1, 0.3, 1), top 0.2s ease-out' })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(recalc)
    }
    schedule()
    // Altas/bajas en el body: detecta cuándo aparece (o se vuelve a montar) Conta Vic.
    const bodyObserver = new MutationObserver(() => {
      if (!vic?.isConnected) schedule()
    })
    bodyObserver.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', schedule)
    return () => {
      bodyObserver.disconnect()
      vicObserver?.disconnect()
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [hidden])

  useEffect(() => {
    try {
      setVisto(localStorage.getItem(REFERIDOS_VISTO_KEY) === '1')
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setAnimar(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }
    } catch {
      setVisto(false)
    }
  }, [hidden])

  if (hidden) return null

  return (
    <>
      <style>{CSS}</style>
      <aside
        ref={wrapRef}
        aria-label="Programa de referidos"
        className="rf-wrap fixed z-40 select-none"
        data-animar={animar ? '1' : '0'}
        style={
          pos
            ? { left: pos.left, top: pos.top, transition: pos.transition }
            // Primer render (aún sin medir): fuera de vista para que no parpadee en la esquina.
            : { right: 20, bottom: 150, visibility: 'hidden' }
        }
      >
        {/* Pastilla compacta y clara, para que no se funda con la de Conta Vic (oscura). */}
        <button
          type="button"
          onClick={() => go('referidos')}
          aria-label="Abrir programa de referidos"
          className="rf-btn cursor-pointer group relative flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          style={{
            background: '#fff',
            border: '1.5px solid rgba(115, 57, 253, 0.35)',
            boxShadow: '0 8px 24px -6px rgba(34, 17, 88, 0.30)',
          }}
        >
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div
              className="rf-icono w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #7339FD 0%, #4B21B8 100%)',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(115, 57, 253, 0.45)',
              }}
            >
              <Coins size={14} className="stroke-[2.2]" />
            </div>
            {!visto && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="rf-anillo absolute inline-flex h-full w-full rounded-full" style={{ background: '#00D3A1' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 border-2 border-white" style={{ background: '#00D3A1' }} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 leading-none whitespace-nowrap select-none">
            <span className="text-[13px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: '#221158' }}>
              Referidos
            </span>
            <span
              className="text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-full leading-none"
              style={{ background: '#E6FCF6', color: '#00876B', border: '1px solid #93F1D6' }}
            >
              {visto ? '5 %' : 'Nuevo · 5 %'}
            </span>
          </div>
        </button>
      </aside>
    </>
  )
}
