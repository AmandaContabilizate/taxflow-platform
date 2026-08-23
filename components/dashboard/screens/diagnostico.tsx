'use client'

import { AlertCircle, Calendar, CheckCircle2, Loader2, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getIssuedInvoices, getMonthlyBills, getMonthlyIncome } from '@/features/dashboard/actions'
import { formatMoney, formatNumber } from '@/features/dashboard/tools/helpers'
import { getRegularizations } from '@/features/declarations/actions/getRegularizations.action'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import type { Regularizations } from '@/features/declarations/types'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { monthYear } from '../declaraciones/parts'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, Pill, SummaryStat, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

type PillKind = 'brand' | 'amber' | 'coral'

interface FiscalStatus {
  word: string
  accent: string
  pill: PillKind
  pillText: string
  positive: boolean
}

function fiscalStatus(score: number): FiscalStatus {
  if (score >= 75) return { word: 'excelente', accent: '#00AD87', pill: 'brand', pillText: 'Todo en orden', positive: true }
  if (score >= 50) return { word: 'buena', accent: '#00AD87', pill: 'brand', pillText: 'Vas bien', positive: true }
  if (score >= 25) return { word: 'regular', accent: 'var(--violet-ink)', pill: 'amber', pillText: 'Requiere atención', positive: false }
  return { word: 'crítica', accent: 'var(--violet-ink)', pill: 'coral', pillText: 'Requiere atención', positive: false }
}

interface Props {
  go: GoFn
}

export function DiagnosticoScreen({ go }: Props) {
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const { selectedRfc, selectedRfcInfo } = useRfcStore()
  const { score, loading, step } = useFiscalScore()

  const [income, setIncome] = useState<number | null>(null)
  const [bills, setBills] = useState<number | null>(null)
  const [invoices, setInvoices] = useState<number | null>(null)
  const [regs, setRegs] = useState<Regularizations | null>(null)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false

    void (async () => {
      const [incomeRes, billsRes, invoicesRes, regsRes] = await Promise.all([
        getMonthlyIncome(selectedRfc),
        getMonthlyBills(selectedRfc),
        getIssuedInvoices(selectedRfc),
        getRegularizations(selectedRfc),
      ])
      if (cancelled) return
      setIncome(incomeRes.success ? incomeRes.value : null)
      setBills(billsRes.success ? billsRes.value : null)
      setInvoices(invoicesRes.success ? invoicesRes.value : null)
      setRegs(regsRes.success ? regsRes.value : null)
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  if (loadingRfc) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />
  if (selectedRfcInfo?.ciecState !== 1) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />

  const status = score ? fiscalStatus(score.score) : null
  const money = (v: number | null) => (loading ? '…' : v == null ? '—' : formatMoney(v))
  const num = (v: number | null) => (loading ? '…' : v == null ? '—' : formatNumber(v))
  const expensePct =
    income && income > 0 && bills != null ? `${Math.round((bills / income) * 100)}% de tus ingresos` : 'Gastos recientes'

  const months = regs?.months ?? []

  return (
    <div className="flex flex-col gap-6">
      <HelpBox>
        <strong>¿Qué es un diagnóstico fiscal?</strong> Es un análisis de tu situación con el SAT. Te decimos qué está
        bien, qué hay que arreglar y dónde puedes ahorrar.
      </HelpBox>

      <div
        className="rounded-3xl p-7 lg:p-8"
        style={{
          background:
            step === 'ready' && status
              ? status.positive
                ? 'var(--hero-brand-soft)'
                : 'var(--hero-coral-soft-bg)'
              : 'var(--hero-amber)',
          border: `1px solid ${
            step === 'ready' && status
              ? status.positive
                ? 'var(--brand-200)'
                : 'var(--coral-soft)'
              : 'var(--hero-amber-border)'
          }`,
        }}
      >
        {step === 'loading' ? (
          <div className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Analizando tu situación fiscal…
          </div>
        ) : step === 'connecting' ? (
          <>
            <Pill kind="amber">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7339FD' }} /> Conectando
              con el SAT
            </Pill>
            <div
              className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Nos estamos conectando con el SAT
            </div>
            <div className="text-[13.5px] mt-2 max-w-[560px]" style={{ color: 'var(--ink-500)' }}>
              Estamos descargando tu constancia de situación fiscal. En cuanto la tengamos, calculamos qué
              declaraciones te corresponden.
            </div>
          </>
        ) : step === 'checking' ? (
          <>
            <Pill kind="amber">
              <Loader2 size={13} className="animate-spin" /> Comprobando con el SAT
            </Pill>
            <div
              className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Estamos comprobando tus declaraciones
            </div>
            <div className="text-[13.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Ya revisamos {score!.total} de {score!.total + score!.pendingVerificationCount} · Faltan{' '}
              {score!.pendingVerificationCount} por confirmar con el SAT.
            </div>
          </>
        ) : status && score ? (
          <>
            <Pill kind={status.pill}>
              {status.positive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {status.pillText}
            </Pill>
            <div
              className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Tu situación fiscal está <span style={{ color: status.accent }}>{status.word}</span>
            </div>
            <div className="text-[13.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Score fiscal: <strong>{Math.round(score.score)}/100</strong> · {score.presented} de {score.total}{' '}
              declaraciones presentadas
            </div>
            {score.pending > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                <Btn kind="brand" size="lg" onClick={() => go('plan')}>
                  <Zap size={18} /> Empezar a regularizar
                </Btn>
              </div>
            )}
          </>
        ) : null}
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tus números
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Ingresos, gastos y facturación recientes.
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStat label="Ingresos" value={money(income)} hint="Lo que has reportado" />
          <SummaryStat label="Gastos" value={money(bills)} hint={expensePct} />
          <SummaryStat label="Facturas emitidas" value={num(invoices)} hint="Facturas que has emitido" />
          <SummaryStat
            label="Pendientes"
            value={loading ? '…' : score ? String(score.pending) : '—'}
            hint="Declaraciones por presentar"
            tone={score && score.pending > 0 ? 'warn' : undefined}
          />
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Lo que debes al SAT
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          {loading
            ? 'Revisando tus declaraciones…'
            : months.length === 0
              ? 'No tienes meses pendientes por regularizar.'
              : `${months.length} ${months.length === 1 ? 'mes pendiente' : 'meses pendientes'} por regularizar. Te ayudamos mes por mes.`}
        </div>
        {months.length > 0 && (
          <Card>
            <div>
              {months.map((m, i) => (
                <div key={m.declarationId}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                    >
                      <Calendar size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14.5px]">{monthYear(m.fiscalYear, m.month)}</div>
                      <div className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--ink-500)' }}>
                        {m.statusLabel}
                      </div>
                    </div>
                    <Badge kind="amber">Pendiente</Badge>
                  </div>
                  {i < months.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <VideoSlot title="¿Cómo se calcula mi diagnóstico fiscal?" duration="3 min" />
    </div>
  )
}
