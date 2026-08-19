'use client'

import { AlertTriangle, FileText, RotateCcw, ShoppingCart } from 'lucide-react'
import { getRegularizations } from '@/features/declarations/actions/getRegularizations.action'
import type { RegularizationBadge } from '@/features/declarations/types'
import { DISPLAY } from '../constants'
import { Badge, Card, Divider, Pill } from '../ui'
import { TabEmpty, TabError, TabLoading, monthYear, useRfcResource } from './parts'

const BADGE: Record<RegularizationBadge, { kind: 'brand' | 'amber' | 'coral'; label: string }> = {
  EnProceso: { kind: 'brand', label: 'En proceso' },
  NecesitaCorreccion: { kind: 'amber', label: 'Necesita corrección' },
  NoPresentada: { kind: 'coral', label: 'No presentada' },
}

export function RegularizacionesTab() {
  const state = useRfcResource(getRegularizations)

  if (state.status === 'loading') return <TabLoading label="Cargando regularizaciones…" />
  if (state.status === 'error') return <TabError message={state.message} />

  const { totalMonths, contractedCount, toContractCount, advancePercent, months } = state.data

  if (totalMonths === 0) {
    return <TabEmpty message="No tienes meses por regularizar. Estás al día." />
  }

  const percent = Math.round(advancePercent)

  return (
    <>
      <div
        className="rounded-3xl p-6 lg:p-7"
        style={{
          background: 'linear-gradient(155deg, #D9C8FE 0%, #7339FD 95%)',
          boxShadow: 'var(--sh-1)',
          color: '#332670',
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.55)', color: 'var(--violet-ink)' }}
              >
                <RotateCcw size={20} />
              </div>
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--violet-ink)' }}>
                Regularizar el pasado
              </div>
            </div>
            <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-3" style={DISPLAY}>
              {totalMonths} {totalMonths === 1 ? 'mes por resolver' : 'meses por resolver'}
            </div>
            <div className="text-[14px] mt-2 max-w-[460px]" style={{ color: 'var(--violet-ink)' }}>
              {contractedCount} contratadas en proceso. {toContractCount} sin presentar por regularizar.
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--violet-ink)' }}>
              Avance
            </div>
            <div className="text-[36px] font-extrabold tracking-tight" style={DISPLAY}>
              {percent}%
            </div>
            <div className="w-[140px] h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.55)' }}>
              <div className="h-full rounded-full" style={{ width: `${percent}%`, background: 'var(--violet)' }} />
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Meses a regularizar
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Resuelve uno a la vez, sin estrés
            </div>
          </div>
          <Pill kind="amber">
            <AlertTriangle size={12} /> {toContractCount} por contratar
          </Pill>
        </div>
        <Divider />
        <div>
          {months.map((m, i) => {
            const badge = BADGE[m.badge]
            const toContract = m.badge === 'NoPresentada'
            return (
              <div key={m.declarationId}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: toContract ? 'var(--coral-soft)' : 'var(--amber-soft)',
                      color: toContract ? 'var(--violet-ink)' : 'var(--violet-ink)',
                    }}
                  >
                    {toContract ? <ShoppingCart size={18} /> : <FileText size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                        {monthYear(m.fiscalYear, m.month)}
                      </div>
                      <Badge kind={badge.kind}>{badge.label}</Badge>
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {m.statusLabel}
                    </div>
                  </div>
                </div>
                {i < months.length - 1 && <Divider />}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
