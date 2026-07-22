import {
  AlertCircle,
  PlayCircle,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from '../constants'
import { FiscalCredibility } from '../fiscal-credibility'
import { FiscalScore } from '../fiscal-score'
import { FinancialSummary } from '../financial-summary'
import type { GoFn } from '../types'
import { Btn, HelpBox, VideoSlot } from '../ui'
import { UpcomingDates } from '../upcoming-dates'

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
      <FiscalScore go={go} />

      <FiscalCredibility go={go} />

      <FinancialSummary />

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

      <UpcomingDates />
    </div>
  )
}
