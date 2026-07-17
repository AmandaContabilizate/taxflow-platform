'use client'

import { ArrowUpRight, Loader2, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFiscalScore } from '@/features/declarations/actions/getFiscalScore.action'
import type { FiscalScore } from '@/features/declarations/types'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from './constants'
import type { GoFn } from './types'
import { Btn } from './ui'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: FiscalScore }
  | { status: 'empty' } // total === 0: el usuario no tiene declaraciones
  | { status: 'error'; message: string }

interface Props {
  go: GoFn
  /**
   * Nivel de plan (ej. "Platinum"). NO viene del endpoint de score fiscal:
   * su fuente es la suscripción (apiType "stripe" → active-plan). Se pasa como
   * prop para pintarlo cuando esté disponible; si no, la insignia se oculta.
   */
  planTier?: string
  /**
   * Texto de última sincronización con el SAT (ej. "hace 2 min"). Tampoco viene
   * de este endpoint. Se pasa como prop; si no, se muestra un texto neutro.
   */
  satSyncedLabel?: string
}

/** Etiqueta cualitativa a partir del score numérico. */
function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 75) return 'Muy bueno'
  if (score >= 50) return 'Vas bien'
  if (score >= 25) return 'A mejorar'
  return 'Necesita atención'
}

/** Color del arco según el score. */
function scoreColor(score: number): string {
  if (score >= 75) return '#0ED18A' // brand-500
  if (score >= 50) return '#F5B037' // amber
  return '#FF8862' // coral
}

export function FiscalScore({ go, planTier, satSyncedLabel }: Props) {
  const { selectedRfc } = useRfcStore()
  const [state, setState] = useState<State>({ status: 'idle' })

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false
    setState({ status: 'loading' })

    void (async () => {
      const res = await getFiscalScore(selectedRfc)
      if (cancelled) return
      if (!res.success) {
        setState({ status: 'error', message: res.error.message })
        return
      }
      // total === 0 con score === 100 significa "sin declaraciones", no "todo al día".
      if (res.value.total === 0) {
        setState({ status: 'empty' })
        return
      }
      setState({ status: 'ready', value: res.value })
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  return (
    <div
      className="rounded-3xl p-7 lg:p-8 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
    >
      {/* Encabezado: estado de sincronización + nivel de plan */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
          style={{
            background: 'rgba(14,209,138,0.18)',
            color: 'var(--brand-300)',
            border: '1px solid rgba(14,209,138,0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} />
          {satSyncedLabel ? `SAT sincronizado · ${satSyncedLabel}` : 'SAT sincronizado'}
        </div>
        {planTier && (
          <div className="text-[12px] font-extrabold tracking-wide" style={{ color: 'var(--brand-300)' }}>
            {planTier}
          </div>
        )}
      </div>

      {state.status === 'loading' || state.status === 'idle' ? (
        <div
          className="flex items-center gap-3 mt-7 text-[15px] font-bold"
          style={{ color: 'rgba(255,255,255,0.78)' }}
        >
          <Loader2 size={18} className="animate-spin" /> Calculando tu score fiscal…
        </div>
      ) : state.status === 'error' ? (
        <ErrorBody message={state.message} onRetry={() => go('declaraciones')} />
      ) : state.status === 'empty' ? (
        <EmptyBody onConnect={() => go('estatus-sat')} />
      ) : (
        <ReadyBody value={state.value} go={go} />
      )}
    </div>
  )
}

function ReadyBody({ value, go }: { value: FiscalScore; go: GoFn }) {
  const score = Math.round(value.score)
  const label = scoreLabel(value.score)
  const color = scoreColor(value.score)
  // Puntos que puede recuperar si regulariza lo pendiente (máximo alcanzable).
  const potential = Math.max(0, 100 - score)
  const atDate = value.pending > 0

  return (
    <>
      {/* Score + etiqueta */}
      <div className="flex items-center gap-6 lg:gap-8 mt-6 flex-wrap">
        <Gauge score={score} color={color} />
        <div className="flex-1 min-w-[220px]">
          <div
            className="text-[11px] tracking-[0.18em] uppercase font-extrabold"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Tu score fiscal
          </div>
          <div className="text-[30px] lg:text-[40px] font-extrabold tracking-tight leading-none mt-1" style={DISPLAY}>
            {label}
          </div>
          <div className="text-[14.5px] mt-3 leading-relaxed max-w-[440px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {atDate ? (
              <>
                Suma <strong style={{ color: 'var(--brand-300)' }}>+{potential} pts</strong> regularizando{' '}
                {value.pending}{' '}
                {value.pending === 1 ? 'declaración pendiente' : 'declaraciones pendientes'}.
              </>
            ) : (
              <>
                Estás al corriente: tus {value.presented}{' '}
                {value.presented === 1 ? 'declaración está presentada' : 'declaraciones están presentadas'}.
              </>
            )}
          </div>
        </div>
      </div>

      {/* Divisor */}
      <div className="h-px w-full my-6" style={{ background: 'rgba(255,255,255,0.12)' }} />

      {/* Acción de hoy (derivada de las declaraciones pendientes) */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-[220px]">
          <div
            className="text-[11px] tracking-[0.18em] uppercase font-extrabold"
            style={{ color: 'rgba(255,255,255,0.55)' }}
          >
            Tu acción de hoy
          </div>
          <div className="text-[18px] lg:text-[20px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
            {atDate ? 'Regulariza tus declaraciones pendientes' : 'No tienes acciones pendientes'}
          </div>
          <div className="text-[13.5px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.68)' }}>
            {atDate
              ? `Tienes ${value.pending} de ${value.total} declaraciones sin presentar.`
              : `Presentaste ${value.presented} de ${value.total} declaraciones. Todo en orden.`}
          </div>
        </div>
        <Btn
          size="lg"
          onClick={() => go('declaraciones')}
          style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}
        >
          Ver detalle <ArrowUpRight size={18} />
        </Btn>
      </div>
    </>
  )
}

function EmptyBody({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="mt-6">
      <div
        className="text-[11px] tracking-[0.18em] uppercase font-extrabold"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Tu score fiscal
      </div>
      <div className="text-[26px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-1" style={DISPLAY}>
        Aún no tienes declaraciones
      </div>
      <div className="text-[14.5px] mt-3 leading-relaxed max-w-[480px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
        En cuanto conectemos tu RFC con el SAT y empecemos a presentar tus declaraciones, aquí verás tu score fiscal en
        tiempo real.
      </div>
      <div className="mt-6">
        <Btn size="lg" onClick={onConnect} style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
          Conectar con el SAT <ArrowUpRight size={18} />
        </Btn>
      </div>
    </div>
  )
}

function ErrorBody({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="mt-6">
      <div
        className="text-[11px] tracking-[0.18em] uppercase font-extrabold"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        Tu score fiscal
      </div>
      <div className="text-[24px] lg:text-[30px] font-extrabold tracking-tight leading-tight mt-1" style={DISPLAY}>
        No pudimos calcular tu score
      </div>
      <div className="text-[14px] mt-3 leading-relaxed max-w-[480px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
        {message}
      </div>
      <div className="mt-6">
        <Btn
          size="lg"
          kind="ghost"
          onClick={onRetry}
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.18)',
          }}
        >
          <RefreshCw size={16} /> Ir a mis declaraciones
        </Btn>
      </div>
    </div>
  )
}

/** Medidor circular de 270° con el score al centro. */
function Gauge({ score, color }: { score: number; color: string }) {
  const size = 132
  const stroke = 12
  const r = (size - stroke) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const sweep = 0.75 // 270° visibles (gap de 90° abajo)
  const trackLen = circumference * sweep
  const progressLen = trackLen * (Math.min(100, Math.max(0, score)) / 100)
  // Rotamos para centrar el hueco en la parte inferior.
  const rotation = 90 + ((1 - sweep) * 360) / 2

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(${rotation} ${cx} ${cy})`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${trackLen} ${circumference}`}
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${progressLen} ${circumference}`}
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] leading-none font-extrabold" style={{ ...MONO, color: '#fff' }}>
          {score}
        </span>
        <span className="text-[12px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
          / 100
        </span>
      </div>
    </div>
  )
}
