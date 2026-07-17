'use client'

import { CheckCircle2, Sparkles } from 'lucide-react'
import { getAnnuals } from '@/features/declarations/actions/getAnnuals.action'
import { DISPLAY } from '../constants'
import { Card, Divider } from '../ui'
import { HeroTile, TabError, TabLoading, fmtDate, useRfcResource } from './parts'

export function AnualesTab() {
  const state = useRfcResource(getAnnuals)

  if (state.status === 'loading') return <TabLoading label="Cargando tus anuales…" />
  if (state.status === 'error') return <TabError message={state.message} />

  const { current, history } = state.data

  return (
    <>
      <div
        className="rounded-3xl p-6 lg:p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg,#5B4FE8 0%,#2A1F8F 80%)', boxShadow: 'var(--sh-1)' }}
      >
        <div
          className="absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,#FFD66B 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <Sparkles size={20} />
            </div>
            <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ejercicio {current.fiscalYear}
            </div>
          </div>
          <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-3" style={DISPLAY}>
            Tu declaración anual
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <HeroTile label="Se prepara desde" value={fmtDate(current.prepareFrom)} />
            <HeroTile label="Se presenta antes del" value={fmtDate(current.dueDate)} />
            <HeroTile label="Faltan" value={`${current.remainingDays} días`} highlight />
          </div>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4">
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Anuales anteriores
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            Tu historial fiscal, siempre a la mano
          </div>
        </div>
        <Divider />
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div style={{ color: 'var(--ink-500)' }}>Sin anuales anteriores</div>
          </div>
        ) : (
          <div>
            {history.map((a, i) => (
              <div key={`${a.fiscalYear}-${i}`}>
                <div className="flex items-center gap-3 px-5 py-4">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                      Ejercicio {a.fiscalYear}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {a.planName} · comprada el {fmtDate(a.saleDate)}
                    </div>
                  </div>
                </div>
                {i < history.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
