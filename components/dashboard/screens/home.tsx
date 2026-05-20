import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  PlayCircle,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, HelpBox, StatusDot, VideoSlot, Divider } from '../ui'

interface Props {
  go: GoFn
  firstName: string
}

export function HomeScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()

  if (loading) return null

  if (!hasRfc) {
    return (
      <div className="flex flex-col gap-5 max-w-[760px]">
        <div
          className="rounded-3xl p-7 lg:p-8"
          style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'var(--hero-info-icon-bg)' }}
          >
            <AlertCircle color="#fff" size={28} />
          </div>
          <div
            className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4"
            style={DISPLAY}
          >
            Falta un paso para empezar
          </div>
          <div className="text-[15px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Para poder ayudarte con tus impuestos, necesitamos conectarnos al SAT con tu permiso. Solo lo haces{' '}
            <strong>una vez</strong> y nosotros nos encargamos del resto.
          </div>
          <div className="mt-6">
            <Btn kind="brand" size="lg" onClick={() => go('estatus-sat')}>
              <Zap size={18} /> Conectar con el SAT
            </Btn>
          </div>
        </div>

        <HelpBox>
          <strong>¿Por qué necesitamos esto?</strong> Para descargar automáticamente tus facturas y constancia del SAT.
          No hacemos nada sin avisarte primero.
        </HelpBox>

        <div>
          <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
            ¿Tienes dudas? Mira este video corto
          </div>
          <VideoSlot title="Cómo conectar tu cuenta al SAT" duration="2 min" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div
        className="rounded-3xl p-7 lg:p-8 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold"
          style={{
            background: 'rgba(14,209,138,0.18)',
            color: 'var(--brand-300)',
            border: '1px solid rgba(14,209,138,0.3)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} /> Lo que importa hoy
        </div>
        <div
          className="text-[28px] lg:text-[36px] font-extrabold tracking-tight leading-tight mt-4 max-w-[640px]"
          style={DISPLAY}
        >
          Tu declaración de marzo vence en <span style={{ color: 'var(--brand-300)' }}>1 día</span>
        </div>
        <div className="text-[15px] mt-3 leading-relaxed max-w-[560px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          No te preocupes: tu contador ya la está preparando. Solo necesitas revisarla y autorizar el pago cuando esté
          lista.
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Btn
            size="lg"
            onClick={() => go('declaraciones')}
            style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}
          >
            Ver mi declaración <ArrowRight size={18} />
          </Btn>
          <Btn
            size="lg"
            kind="ghost"
            onClick={() => go('ayuda')}
            style={{
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <HelpCircle size={18} /> No entiendo qué hacer
          </Btn>
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          ¿Cómo vas con el SAT?
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Aquí te explicamos en palabras simples cómo estás ante Hacienda.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            ok
            title="Estás al corriente"
            desc="No apareces en listas negras del SAT y tu RFC está activo."
            cta="Ver detalle"
            onClick={() => go('documentos')}
          />
          <StatusCard
            ok={false}
            title="1 declaración pendiente"
            desc="La declaración de marzo está casi lista. Tu contador la revisa."
            cta="Ver declaración"
            onClick={() => go('declaraciones')}
          />
          <StatusCard
            ok
            title="Tus documentos al día"
            desc="Tu Constancia de Situación Fiscal está vigente y lista para usar."
            cta="Ver documentos"
            onClick={() => go('documentos')}
          />
        </div>
      </div>

      <div
        className="rounded-3xl p-6 lg:p-7"
        style={{ background: 'var(--hero-amber)', border: '1px solid var(--hero-amber-border)' }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--hero-amber-icon-bg)', color: '#7B5312' }}
          >
            <Sparkles size={22} />
          </div>
          <div className="flex-1 min-w-0 max-w-[560px]">
            <div className="text-[20px] font-extrabold tracking-tight" style={DISPLAY}>
              ¿Es tu primera vez aquí?
            </div>
            <div className="text-[14px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
              Te dejamos un video corto donde te explicamos qué es cada cosa y cómo usar tu panel sin perderte.
            </div>
            <div className="mt-4">
              <Btn kind="primary" onClick={() => go('ayuda')}>
                <PlayCircle size={18} /> Ver tutorial de bienvenida
              </Btn>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Próximas fechas
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Estas son las fechas importantes para que no se te pase nada.
        </div>
        <Card>
          <div className="p-2">
            <DateRow day="17" mo="Abr" title="Declaración mensual de marzo" sub="Mañana · tu contador la prepara" urgent />
            <Divider />
            <DateRow day="30" mo="Abr" title="Declaración anual 2025" sub="En 14 días · ya estamos trabajando en ella" />
            <Divider />
            <DateRow day="17" mo="May" title="Declaración mensual de abril" sub="En 25 días · todavía hay tiempo" muted />
          </div>
        </Card>
      </div>
    </div>
  )
}

interface StatusCardProps {
  ok: boolean
  title: string
  desc: string
  cta: string
  onClick: () => void
}

function StatusCard({ ok, title, desc, cta, onClick }: StatusCardProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-3xl p-5 text-left transition hover:translate-y-[-2px] flex flex-col gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: ok ? 'var(--brand-50)' : 'var(--amber-soft)',
            color: ok ? 'var(--brand-700)' : '#7B5312',
          }}
        >
          {ok ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <StatusDot ok={ok} />
      </div>
      <div>
        <div className="font-bold text-[15.5px] leading-tight" style={{ color: 'var(--ink-900)' }}>
          {title}
        </div>
        <div className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          {desc}
        </div>
      </div>
      <div
        className="text-[13px] font-bold flex items-center gap-1 mt-1"
        style={{ color: 'var(--brand-700)' }}
      >
        {cta} <ChevronRight size={14} />
      </div>
    </button>
  )
}

interface DateRowProps {
  day: string
  mo: string
  title: string
  sub: string
  urgent?: boolean
  muted?: boolean
}

function DateRow({ day, mo, title, sub, urgent, muted }: DateRowProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div
        className="w-14 text-center flex-shrink-0 rounded-xl py-2"
        style={{ background: urgent ? 'var(--coral-soft)' : 'var(--ink-50)' }}
      >
        <div
          className="text-[24px] font-extrabold leading-none"
          style={{
            ...DISPLAY,
            color: urgent ? '#9E3A15' : muted ? 'var(--ink-400)' : 'var(--ink-900)',
          }}
        >
          {day}
        </div>
        <div
          className="text-[10px] tracking-widest uppercase font-extrabold mt-1"
          style={{ color: urgent ? '#9E3A15' : 'var(--ink-400)' }}
        >
          {mo}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[14.5px] ${muted ? 'opacity-70' : ''}`}>{title}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          {sub}
        </div>
      </div>
    </div>
  )
}
