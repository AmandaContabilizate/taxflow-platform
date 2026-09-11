'use client'

import { Bot, ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getDiagnosticoActividad } from '@/features/diagnostico/actions/getDiagnosticoActividad.action'
import type { DiagnosticoRobotIntento } from '@/features/diagnostico/types'
import { MONO } from '../constants'

/**
 * Actividad de robots SAT (constancia / evaluación / decl-*) de un contribuyente —
 * spec-diagnostico-actividad-robots.md. Complementa el historial de corridas: el
 * historial dice quién pidió; esto dice qué se ejecutó y en qué paso va (incluye
 * el trabajo del onboarding, que el historial viejo no registraba).
 *
 * Colapsada por default (fila-resumen); expandida automáticamente cuando hay una
 * corrida en curso, que es cuando ver el paso importa. Si no hay intentos, no se
 * pinta nada (ausencia, no un vacío). Solo lectura.
 */

/** 1 Completado · 2 Fallido · 3 Corriendo · 4 Abortado · 5 En espera · 6 Encolado */
const VIVO = new Set([3, 5, 6])

function EstadoRobotDot({ estatusId }: { estatusId: number }) {
  const color =
    estatusId === 1 ? 'var(--brand-700)'
    : estatusId === 2 ? 'var(--danger, #e5484d)'
    : estatusId === 4 ? 'var(--ink-400)'
    : 'var(--violet)'
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0">
      {VIVO.has(estatusId) && (
        <span
          className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
          style={{ background: color }}
        />
      )}
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: color }} />
    </span>
  )
}

/** "hace 2 h", "hace 3 min", "hace 5 d" — suficiente para una línea de tiempo operativa. */
function hace(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'hace instantes'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 48) return `hace ${h} h`
  return `hace ${Math.round(h / 24)} d`
}

function fechaCompleta(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

interface Props {
  taxpayerId: number
  /** true mientras hay corrida en curso: expande la sección y refresca cada 20s. */
  corriendo?: boolean
  /** Notifica cuántos intentos hay (el padre lo usa para la leyenda del historial vacío). */
  onCount?: (n: number) => void
}

export function ActividadRobots({ taxpayerId, corriendo = false, onCount }: Props) {
  const [intentos, setIntentos] = useState<DiagnosticoRobotIntento[] | null>(null)
  const [abierta, setAbierta] = useState(false)
  // El usuario manda: si él la abrió/cerró, el auto-expand por corrida ya no la toca.
  const tocadaPorUsuario = useRef(false)

  const load = useCallback(async () => {
    const res = await getDiagnosticoActividad(taxpayerId)
    if (res.success) {
      setIntentos(res.value.intentos)
      onCount?.(res.value.intentos.length)
    }
  }, [taxpayerId, onCount])

  useEffect(() => {
    setIntentos(null)
    setAbierta(false)
    tocadaPorUsuario.current = false
    void load()
  }, [load])

  // Con corrida en curso: refrescar al mismo ritmo que el resto de la vista (20s)
  // y abrir la sección — es el momento en que ver el paso importa.
  useEffect(() => {
    if (!corriendo) return
    if (!tocadaPorUsuario.current) setAbierta(true)
    const id = setInterval(() => void load(), 20000)
    return () => clearInterval(id)
  }, [corriendo, load])

  if (!intentos || intentos.length === 0) return null

  const ultimo = intentos[0]

  return (
    <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <style>{`
        @keyframes arx-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .arx-row { animation: none !important; }
        }
      `}</style>

      <button
        type="button"
        onClick={() => {
          tocadaPorUsuario.current = true
          setAbierta((v) => !v)
        }}
        aria-expanded={abierta}
        className="w-full flex items-center gap-2 text-left cursor-pointer group"
      >
        <Bot size={14} style={{ color: 'var(--ink-500)' }} />
        <span className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          Actividad de robots SAT
        </span>
        {!abierta && (
          <span className="flex items-center gap-2 text-[12.5px] truncate" style={{ color: 'var(--ink-500)' }}>
            · {intentos.length} {intentos.length === 1 ? 'intento' : 'intentos'} · último: {ultimo.robot}
            <EstadoRobotDot estatusId={ultimo.estatusId} />
            {hace(ultimo.lastAttemptDate)}
          </span>
        )}
        <ChevronDown
          size={15}
          className="ml-auto shrink-0"
          style={{
            color: 'var(--ink-400)',
            transform: abierta ? 'rotate(180deg)' : 'none',
            transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        />
      </button>

      {abierta && (
        <ul className="flex flex-col mt-3">
          {intentos.map((r, i) => (
            <li
              key={r.id}
              className="arx-row py-2 flex items-center gap-3 flex-wrap"
              title={r.observations ? `${r.scraperName} — ${r.observations}` : r.scraperName}
              style={{
                borderBottom: i < intentos.length - 1 ? '1px solid var(--border)' : 'none',
                animation: 'arx-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
                animationDelay: `${Math.min(i, 8) * 40}ms`,
              }}
            >
              <EstadoRobotDot estatusId={r.estatusId} />
              <span className="text-[13px] font-semibold min-w-[200px]" style={{ color: 'var(--ink-900)' }}>
                {r.robot}
              </span>
              <span className="text-[12.5px] min-w-[86px]" style={{
                color: r.estatusId === 2 ? 'var(--danger, #e5484d)' : 'var(--ink-500)',
                fontWeight: r.estatusId === 2 ? 700 : 500,
              }}>
                {r.estatus}
              </span>
              {r.attemptCount > 1 && (
                <span
                  className="text-[11px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ ...MONO, border: '1px solid var(--border)', color: 'var(--ink-500)' }}
                  title={`${r.attemptCount} intentos de este robot`}
                >
                  ×{r.attemptCount}
                </span>
              )}
              <span
                className="text-[11.5px] ml-auto shrink-0"
                style={{ color: 'var(--ink-400)', fontVariantNumeric: 'tabular-nums' }}
                title={fechaCompleta(r.lastAttemptDate)}
              >
                {hace(r.lastAttemptDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
