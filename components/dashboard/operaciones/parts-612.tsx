'use client'

import type { ReactNode } from 'react'
import { DISPLAY, MONO } from '../constants'
import { money, percent } from './calc-read'

/** Piezas compartidas por las pantallas del 612 (Cálculos, Gastos y Saldos a favor). */

export const REGIMEN_612 = '612'

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

export const MES_OPCIONES: [string, string][] = MESES.map((m, i) => [String(i + 1), m])

export function periodoLabel(year: number | null | undefined, month: number | null | undefined): string {
  if (!year || !month || month < 1 || month > 12) return '—'
  return `${MESES[month - 1]} ${year}`
}

export function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return '—'
  // "2026-04-15" sin hora se lee como fecha local, no como medianoche UTC (que en México
  // pintaba el día anterior).
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtMoney = (n: number | null | undefined) => (n == null ? '—' : money(n))
export const fmtPercent = (n: number | null | undefined) => (n == null ? '—' : percent(n))

export function PanelHeader612({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div
      className="px-5 py-3.5 flex items-start justify-between gap-3"
      style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
    >
      <div>
        <h3 className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          {title}
        </h3>
        {subtitle && (
          <div className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {subtitle}
          </div>
        )}
      </div>
      {right}
    </div>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="px-5 pt-3.5 pb-1.5 text-[10.5px] font-extrabold uppercase tracking-wider"
      style={{ color: 'var(--ink-500)', borderBottom: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

export function AmountRow({
  label,
  value,
  hint,
  total,
  last,
}: {
  label: ReactNode
  value: string
  hint?: ReactNode
  total?: boolean
  last?: boolean
}) {
  return (
    <div
      className="flex items-start gap-4 px-5 py-3"
      style={{
        ...(last ? {} : { borderBottom: '1px solid var(--border)' }),
        ...(total ? { background: 'var(--muted)' } : {}),
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`text-[13px] leading-snug ${total ? 'font-extrabold' : ''}`}
          style={{ color: total ? 'var(--ink-900)' : 'var(--ink-700)' }}
        >
          {label}
        </div>
        {hint && (
          <div className="text-[11.5px] mt-0.5 leading-snug" style={{ color: 'var(--ink-500)' }}>
            {hint}
          </div>
        )}
      </div>
      <div
        className="text-[13.5px] font-bold text-right flex-shrink-0 min-w-[130px]"
        style={{ ...MONO, color: 'var(--ink-900)' }}
      >
        {value}
      </div>
    </div>
  )
}

export function InlineNotice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'success'; children: ReactNode }) {
  const style =
    kind === 'error'
      ? { background: 'var(--coral-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }
      : kind === 'success'
        ? { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)' }
        : { background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }
  return (
    <div className="rounded-2xl px-4 py-3 text-[13px]" style={style}>
      {children}
    </div>
  )
}

/** Tabla compacta con el mismo estilo que Comprobantes. */
export function SimpleTable({
  headers,
  children,
  align,
}: {
  headers: string[]
  children: ReactNode
  /** Columnas alineadas a la derecha (montos), por índice. */
  align?: Set<number>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map((h, i) => (
              <th
                key={h}
                className={`px-3 py-2.5 font-extrabold whitespace-nowrap ${align?.has(i) ? 'text-right' : 'text-left'}`}
                style={{ color: 'var(--ink-700)' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export const cellMoneyClass = 'px-3 py-2.5 whitespace-nowrap text-right align-top'
export const cellClass = 'px-3 py-2.5 align-top'
export const cellMoneyStyle = { ...MONO, color: 'var(--ink-900)' } as const
