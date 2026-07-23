import { Lightbulb, CirclePlay, ChevronRight, AlertCircle, Zap } from 'lucide-react'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Btn } from '../ui'

interface Props {
  go: GoFn
  feature: string
}

export function NeedsSatConnect({ go, feature }: Props) {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Hero principal */}
      <div
        className="rounded-3xl p-6 lg:p-8 w-full"
        style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
      >
        <div className="max-w-2xl">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--hero-info-icon-bg)' }}
          >
            <AlertCircle color="#fff" size={24} />
          </div>
          <div className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-3" style={DISPLAY}>
            Falta un paso para empezar
          </div>
          <div className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Para poder ayudarte con {feature}, necesitamos conectarnos al SAT con tu permiso. Solo lo haces <strong>una vez</strong> y nosotros nos encargamos del resto.
          </div>
          <div className="mt-5">
            <Btn kind="brand" size="lg" onClick={() => go('estatus-sat')}>
              <Zap size={18} /> Conectar con el SAT
            </Btn>
          </div>
        </div>
      </div>

      {/* Helpbox mejorado */}
      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{ background: 'var(--helpbox-bg)', border: '1px solid var(--helpbox-border)' }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--helpbox-accent-bg)', color: 'var(--helpbox-text)' }}
        >
          <Lightbulb size={16} />
        </div>
        <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--helpbox-text)' }}>
          <strong>¿Por qué necesitamos esto?</strong> Para descargar automáticamente tus facturas y constancia del SAT. No hacemos nada sin avisarte primero.
        </div>
      </div>

      {/* Video sugerido */}
      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          ¿Tienes dudas? Mira este video corto
        </div>
        <button
          className="rounded-2xl p-4 flex items-center gap-3 w-full text-left transition hover:translate-y-[-1px]"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
          >
            <CirclePlay size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-[14px] leading-tight">Cómo conectar tu cuenta al SAT</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>
              Video · 2 min
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--ink-300)' }} className="flex-shrink-0" />
        </button>
      </div>

      {/* Info seguridad */}
      <div className="rounded-2xl p-4 flex items-start gap-3 border" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[13px] leading-relaxed flex-1" style={{ color: 'var(--ink-500)' }}>
          🔒 <strong>Tus datos están seguros.</strong> Encriptamos todo y no compartimos tu información con nadie. Tu conexión al SAT es directa y privada.
        </div>
      </div>
    </div>
  )
}
