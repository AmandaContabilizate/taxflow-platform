'use client'

import { CalendarClock, CheckCircle2, ClipboardCheck, Lock } from 'lucide-react'
import { getFuturePlan } from '@/features/declarations/actions/getFuturePlan.action'
import type { FuturePlanBadge } from '@/features/declarations/types'
import { DISPLAY } from '../constants'
import { Badge, Card, Divider, Pill } from '../ui'
import { HeroTile, TabEmpty, TabError, TabLoading, monthYear, useRfcResource } from './parts'

const BADGE: Record<FuturePlanBadge, { kind: 'brand' | 'default'; label: string }> = {
  Siguiente: { kind: 'brand', label: 'Siguiente' },
  Programada: { kind: 'default', label: 'Programada' },
}

export function FuturoTab() {
  const state = useRfcResource(getFuturePlan)

  if (state.status === 'loading') return <TabLoading label="Cargando tu plan a futuro…" />
  if (state.status === 'error') return <TabError message={state.message} />

  const { presentedThisYear, remainingInPlan, upcoming } = state.data

  if (remainingInPlan === 0 && upcoming.length === 0) {
    return <TabEmpty message="No tienes un plan a futuro activo." />
  }

  return (
    <>
      <div
        className="rounded-3xl p-6 lg:p-7 text-white"
        style={{ background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)', boxShadow: 'var(--sh-brand)' }}
      >
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Plan a futuro
        </div>
        <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-2" style={DISPLAY}>
          Tus declaraciones mensuales, ya contratadas
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <HeroTile label="Presentadas este año" value={String(presentedThisYear)} />
          <HeroTile label="Restantes en tu plan" value={String(remainingInPlan)} highlight />
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Lo que viene en tu plan
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Próximas declaraciones mensuales · ya contratadas
            </div>
          </div>
          <Pill kind="brand">
            <CheckCircle2 size={12} /> Plan al corriente
          </Pill>
        </div>
        <Divider />
        {upcoming.length === 0 ? (
          <div className="text-center py-8">
            <div style={{ color: 'var(--ink-500)' }}>Sin próximas declaraciones programadas</div>
          </div>
        ) : (
          <div>
            {upcoming.map((f, i) => {
              const badge = BADGE[f.badge]
              const isNext = f.badge === 'Siguiente'
              return (
                <div key={f.declarationId}>
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isNext ? 'var(--brand-100)' : 'var(--ink-50)',
                        color: isNext ? 'var(--brand-700)' : 'var(--ink-500)',
                      }}
                    >
                      {isNext ? <ClipboardCheck size={18} /> : <CalendarClock size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                          {monthYear(f.fiscalYear, f.month)}
                        </div>
                        <Badge kind={badge.kind}>{badge.label}</Badge>
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                        {f.statusLabel}
                      </div>
                    </div>
                    {!isNext && (
                      <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--ink-500)' }}>
                        <Lock size={12} /> Aún no inicia
                      </span>
                    )}
                  </div>
                  {i < upcoming.length - 1 && <Divider />}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </>
  )
}
