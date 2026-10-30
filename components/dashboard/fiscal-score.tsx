'use client'

import { ArrowUpRight, Loader2, RefreshCw } from 'lucide-react'
import { useRef, useState } from 'react'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import type { FiscalScore } from '@/features/declarations/types'
import { DISPLAY, MONO } from './constants'
import type { GoFn } from './types'
import { Btn } from './ui'
import { scoreLabel, scoreColor } from './fiscal-score.utils'

type State =
  | { status: 'loading' }
  | { status: 'ready'; value: FiscalScore }
  | { status: 'empty' } // sincronizado y sin declaraciones registradas
  | { status: 'processing' } // el robot del SAT sigue trabajando (CSF o reconciliación)
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

/**
 * Insignia del encabezado. El fondo del hero es púrpura constante, así que los
 * colores van literales (ver excepción de fondos de color fijo en CLAUDE.md).
 */
type BadgeTone = 'brand' | 'amber' | 'coral' | 'neutral'

const BADGE_TONES: Record<BadgeTone, { bg: string; fg: string; border: string; dot: string }> = {
  brand: {
    bg: 'rgba(0,211,161,0.18)',
    fg: '#93F1D6',
    border: '1px solid rgba(0,211,161,0.3)',
    dot: '#00AD87',
  },
  amber: {
    bg: 'rgba(115,57,253,0.18)',
    fg: '#D9C8FE',
    border: '1px solid rgba(115,57,253,0.32)',
    dot: '#7339FD',
  },
  coral: {
    bg: 'rgba(115,57,253,0.18)',
    fg: '#D9C8FE',
    border: '1px solid rgba(115,57,253,0.32)',
    dot: 'var(--violet-ink)',
  },
  neutral: {
    bg: 'rgba(255,255,255,0.08)',
    fg: 'rgba(255,255,255,0.72)',
    border: '1px solid rgba(255,255,255,0.16)',
    dot: 'rgba(255,255,255,0.5)',
  },
}

function headerBadge(
  status: State['status'],
  satSyncedLabel?: string,
): { label: string; tone: BadgeTone; pulse: boolean } {
  switch (status) {
    case 'ready':
      return {
        label: satSyncedLabel ? `SAT sincronizado · ${satSyncedLabel}` : 'SAT sincronizado',
        tone: 'brand',
        pulse: false,
      }
    case 'empty':
      return { label: 'Sin declaraciones registradas', tone: 'amber', pulse: false }
    case 'processing':
      return { label: 'Sincronizando con el SAT', tone: 'amber', pulse: true }
    case 'error':
      return { label: 'No pudimos consultar al SAT', tone: 'coral', pulse: false }
    default:
      return { label: 'Consultando al SAT', tone: 'neutral', pulse: true }
  }
}

export function FiscalScore({ go, planTier, satSyncedLabel }: Props) {
  // Lógica compartida de estatus del diagnóstico (docs/diagnostico-status.md):
  // pasos conectando→revisando→listo + polling de 20s — el hero deja de
  // quedarse pegado cuando el robot del SAT sigue trabajando.
  const { score, step, error } = useFiscalScore()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const state: State =
    error && !score
      ? { status: 'error', message: error }
      : step === 'loading'
        ? { status: 'loading' }
        : step === 'connecting' || step === 'checking'
          ? { status: 'processing' }
          : !score || score.total === 0
            ? { status: 'empty' }
            : { status: 'ready', value: score }

  const badgeInfo = headerBadge(state.status, satSyncedLabel)
  const badge = { ...BADGE_TONES[badgeInfo.tone], label: badgeInfo.label, pulse: badgeInfo.pulse }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="rounded-3xl p-7 lg:p-8 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(155deg,#2A1C64 0%,#221158 100%)' }}
    >
      {/* Light follow effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-100"
        style={{
          background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(0,211,161, 0.25), transparent 80%)`,
        }}
      />

      <div className="relative z-10">
      {/* Encabezado: estado de sincronización + nivel de plan */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
          style={{ background: badge.bg, color: badge.fg, border: badge.border }}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${badge.pulse ? 'animate-pulse' : ''}`}
            style={{ background: badge.dot }}
          />
          {badge.label}
        </div>
        {planTier && (
          <div className="text-[12px] font-extrabold tracking-wide" style={{ color: 'var(--brand-300)' }}>
            {planTier}
          </div>
        )}
      </div>

      {state.status === 'loading' ? (
        <div
          className="flex items-center gap-3 mt-7 text-[15px] font-bold"
          style={{ color: 'rgba(255,255,255,0.78)' }}
        >
          <Loader2 size={18} className="animate-spin" /> Calculando tu score fiscal…
        </div>
      ) : state.status === 'error' ? (
        <ErrorBody message={state.message} onRetry={() => go('declaraciones')} />
      ) : state.status === 'processing' ? (
        <ProcessingBody />
      ) : state.status === 'empty' ? (
        <EmptyBody onSeeDeclarations={() => go('declaraciones')} />
      ) : (
        <ReadyBody value={state.value} go={go} />
      )}
      </div>
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
          style={{ background: '#fff', color: '#221158', boxShadow: 'none' }}
        >
          Ver detalle <ArrowUpRight size={18} />
        </Btn>
      </div>
    </>
  )
}

function EmptyBody({ onSeeDeclarations }: { onSeeDeclarations: () => void }) {
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
        Tu RFC ya está conectado con el SAT, pero todavía no hay declaraciones registradas. En cuanto presentemos la
        primera, aquí verás tu score fiscal en tiempo real.
      </div>
      <div className="mt-6">
        <Btn
          size="lg"
          onClick={onSeeDeclarations}
          style={{ background: '#fff', color: '#221158', boxShadow: 'none' }}
        >
          Ver mis declaraciones <ArrowUpRight size={18} />
        </Btn>
      </div>
    </div>
  )
}

function ProcessingBody() {
  return (
    <div className="mt-6">
      <div
        className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase font-extrabold"
        style={{ color: 'rgba(255,255,255,0.55)' }}
      >
        <Loader2 size={13} className="animate-spin" /> Tu score fiscal
      </div>
      <div className="text-[26px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-1" style={DISPLAY}>
        Análisis fiscal en proceso
      </div>
      <div className="text-[14.5px] mt-3 leading-relaxed max-w-[480px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
        Estamos sincronizando tu información con el SAT. En cuanto terminemos, aquí verás tu score fiscal y tus
        declaraciones.
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
