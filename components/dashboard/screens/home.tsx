import {
  PlayCircle,
  Sparkles,
} from 'lucide-react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY } from '../constants'
import { FiscalCredibility } from '../fiscal-credibility'
import { FiscalScore } from '../fiscal-score'
import { FinancialSummary } from '../financial-summary'
import type { GoFn } from '../types'
import { Btn, VideoSlot } from '../ui'
import { UpcomingDates } from '../upcoming-dates'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
  firstName: string
}

export function HomeScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const { selectedRfcInfo } = useRfcStore()

  if (loading) return null

  if (!hasRfc) {
    return <NeedsSatConnect go={go} feature="empezar a gestionar tus impuestos" />
  }

  if (selectedRfcInfo?.ciecState !== 1) {
    return <NeedsSatConnect go={go} feature="empezar a gestionar tus impuestos" />
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
