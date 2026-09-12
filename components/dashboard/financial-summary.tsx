'use client'

import { FileText, Loader2, Receipt, TrendingDown, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  getActiveClients,
  getIssuedInvoices,
  getMonthlyBills,
  getMonthlyIncome,
} from '@/features/dashboard/actions'
import { formatMoney, formatNumber } from '@/features/dashboard/tools/helpers'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from './constants'

type CardState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: T }
  | { status: 'error'; message: string }

const idle = { status: 'idle' } as const
const loading = { status: 'loading' } as const

// Las mini-graficas iban con series fijas ([42,51,47,...]) debajo de cifras reales y
// con el pie "Comparado con tu actividad reciente". No hay endpoint de historico, asi
// que se quitan en vez de dibujar una tendencia inventada.

export function FinancialSummary() {
  const { selectedRfc } = useRfcStore()

  const [income, setIncome] = useState<CardState<number>>(idle)
  const [bills, setBills] = useState<CardState<number>>(idle)
  const [invoices, setInvoices] = useState<CardState<number>>(idle)
  const [clients, setClients] = useState<CardState<number>>(idle)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false
    const rfc = selectedRfc

    setIncome(loading)
    setBills(loading)
    setInvoices(loading)
    setClients(loading)

    void (async () => {
      const [incomeRes, billsRes, invoicesRes, clientsRes] = await Promise.all([
        getMonthlyIncome(rfc),
        getMonthlyBills(rfc),
        getIssuedInvoices(rfc),
        getActiveClients(rfc),
      ])
      if (cancelled) return

      setIncome(incomeRes.success
        ? { status: 'ready', value: incomeRes.value }
        : { status: 'error', message: incomeRes.error.message })
      setBills(billsRes.success
        ? { status: 'ready', value: billsRes.value }
        : { status: 'error', message: billsRes.error.message })
      setInvoices(invoicesRes.success
        ? { status: 'ready', value: invoicesRes.value }
        : { status: 'error', message: invoicesRes.error.message })
      setClients(clientsRes.success
        ? { status: 'ready', value: clientsRes.value }
        : { status: 'error', message: clientsRes.error.message })
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  return (
    <div>
      <div className="mb-4">
        <div className="text-[20px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tu mes en números
        </div>
        <div className="text-[13.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Un vistazo rápido a cómo va tu actividad
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          eyebrow="Ingresos del mes"
          icon={<TrendingUp size={20} />}
          iconBg="var(--brand-50)"
          iconColor="var(--brand-700)"
          state={income}
          format={formatMoney}
        />
        <MetricCard
          eyebrow="Gastos del mes"
          icon={<TrendingDown size={20} />}
          iconBg="var(--coral-soft)"
          iconColor="var(--violet-ink)"
          state={bills}
          format={formatMoney}
        />
        <MetricCard
          eyebrow="Facturas emitidas"
          icon={<FileText size={20} />}
          iconBg="var(--sky-soft)"
          iconColor="var(--violet-ink)"
          state={invoices}
          format={formatNumber}
          valueSuffix=" facturas"
        />
        <MetricCard
          eyebrow="Clientes facturados"
          icon={<Users size={20} />}
          iconBg="var(--violet-soft)"
          iconColor="#7339FD"
          state={clients}
          format={formatNumber}
          valueSuffix=" clientes"
        />
      </div>
    </div>
  )
}

interface MetricCardProps {
  eyebrow: string
  icon: ReactNode
  iconBg: string
  iconColor: string
  state: CardState<number>
  format: (value: number) => string
  valueSuffix?: string
  sparkline?: ReactNode
}

function MetricCard({
  eyebrow,
  icon,
  iconBg,
  iconColor,
  state,
  format,
  valueSuffix,
  sparkline,
}: MetricCardProps) {
  const errored = state.status === 'error'
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-1)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {errored && (
          <span
            className="text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
          >
            Sin datos
          </span>
        )}
      </div>

      <div>
        <div
          className="text-[11px] tracking-widest uppercase font-extrabold"
          style={{ color: 'var(--ink-500)' }}
        >
          {eyebrow}
        </div>

        <div
          className="text-[26px] leading-tight font-extrabold mt-1 flex items-baseline gap-1.5 min-h-[32px]"
          style={{ ...DISPLAY, color: 'var(--ink-900)' }}
        >
          {state.status === 'loading' || state.status === 'idle' ? (
            <span
              className="inline-flex items-center gap-2 text-[15px] font-bold"
              style={{ color: 'var(--ink-500)' }}
            >
              <Loader2 size={16} className="animate-spin" /> Cargando…
            </span>
          ) : state.status === 'ready' ? (
            <>
              <span style={MONO}>{format(state.value)}</span>
              {valueSuffix && (
                <span
                  className="text-[13px] font-bold"
                  style={{ color: 'var(--ink-500)', fontFamily: 'var(--font-display)' }}
                >
                  {valueSuffix}
                </span>
              )}
            </>
          ) : (
            <span
              className="text-[15px] font-bold leading-snug"
              style={{ color: 'var(--ink-500)' }}
            >
              No disponible
            </span>
          )}
        </div>

        <div className="text-[12.5px] mt-2 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          {errored ? state.message : 'Del periodo en curso'}
        </div>
      </div>

      {sparkline ? <div className="h-14 -mx-1">{sparkline}</div> : null}
    </div>
  )
}
