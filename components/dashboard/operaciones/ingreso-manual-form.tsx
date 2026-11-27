'use client'

import { Loader2 } from 'lucide-react'
import { useClassificationCategories } from '@/features/declarations/hooks/useDeclarationQueries'
import type { ManualIncome, ManualIncomeIvaRate } from '@/features/declarations/types'
import { FieldLabel, inputStyle } from '../cancelaciones/parts'
import { money } from '../declaraciones/parts'
import { DatePicker } from '../date-picker'
import { MONO } from '../constants'
import { InlineNotice } from './parts-612'

export const TASAS: { value: ManualIncomeIvaRate; label: string }[] = [
  { value: '16', label: '16 %' },
  { value: '8', label: '8 %' },
  { value: '0', label: '0 %' },
  { value: 'EXENTO', label: 'Exento' },
]

export interface IngresoForm {
  fecha: string
  concepto: string
  subtotal: string
  tasa: ManualIncomeIvaRate
  classificationId: string
  contraparte: string
}

export const FORM_VACIO: IngresoForm = { fecha: '', concepto: '', subtotal: '', tasa: '16', classificationId: '', contraparte: '' }

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Mensual (periodValueId 101-112): primer y último día del mes; sin límites en otra periodicidad. */
export function rangoDelPeriodo(fiscalYear: number, periodValueId: number): { min?: string; max?: string } {
  if (periodValueId < 101 || periodValueId > 112) return {}
  const mes = periodValueId - 101
  return { min: iso(new Date(fiscalYear, mes, 1)), max: iso(new Date(fiscalYear, mes + 1, 0)) }
}

export const ivaDe = (subtotal: number, rate: ManualIncomeIvaRate) => {
  const factor = rate === '16' ? 0.16 : rate === '8' ? 0.08 : 0
  return Math.round(subtotal * factor * 100 + 1e-7) / 100
}

const field = 'w-full px-3 py-2.5 rounded-lg text-[13px] outline-none'

export function IngresoManualCampos({
  form,
  onChange,
  es625,
  open,
  rango,
  iva,
  total,
  error,
}: {
  form: IngresoForm
  onChange: (patch: Partial<IngresoForm>) => void
  es625: boolean
  open: boolean
  rango: { min?: string; max?: string }
  iva: number
  total: number
  error: string | null
}) {
  const categoriesQ = useClassificationCategories(es625 && open)
  const categorias = (categoriesQ.data ?? []).filter((c) => !c.isExpense)
  return (
    <div className="flex flex-col gap-3">
      <div>
        <FieldLabel>Fecha del cobro</FieldLabel>
        <DatePicker value={form.fecha} onChange={(fecha) => onChange({ fecha })} min={rango.min} max={rango.max} />
      </div>
      <div>
        <FieldLabel>Concepto</FieldLabel>
        <input value={form.concepto} maxLength={300} onChange={(e) => onChange({ concepto: e.target.value })} className={field} style={inputStyle} />
      </div>
      {es625 && (
        <div>
          <FieldLabel>Tipo de servicio</FieldLabel>
          {categoriesQ.isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : categoriesQ.isError ? (
            <InlineNotice kind="error">No se pudo cargar el catálogo de tipos de servicio.</InlineNotice>
          ) : (
            <select value={form.classificationId} onChange={(e) => onChange({ classificationId: e.target.value })} className={`${field} cursor-pointer`} style={inputStyle}>
              <option value="">Selecciona…</option>
              {categorias.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Subtotal (sin IVA)</FieldLabel>
          <input value={form.subtotal} inputMode="decimal" onChange={(e) => onChange({ subtotal: e.target.value })} className={field} style={{ ...inputStyle, ...MONO }} />
        </div>
        {!es625 && (
          <div>
            <FieldLabel>Tasa de IVA</FieldLabel>
            <select value={form.tasa} onChange={(e) => onChange({ tasa: e.target.value as ManualIncomeIvaRate })} className={`${field} cursor-pointer`} style={inputStyle}>
              {TASAS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        )}
      </div>
      {es625 && <p className="text-[12px]" style={{ color: 'var(--ink-500)' }}>En el 625 el IVA se calcula al 16 %</p>}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[13px]" style={{ color: 'var(--ink-700)' }}>
        <span>IVA</span>
        <span style={{ ...MONO, textAlign: 'right' }}>{money(iva)}</span>
        <span className="font-semibold">Total</span>
        <span className="font-semibold" style={{ ...MONO, textAlign: 'right' }}>{money(total)}</span>
      </div>
      <div>
        <FieldLabel hint="(opcional)">Contraparte</FieldLabel>
        <input value={form.contraparte} maxLength={300} onChange={(e) => onChange({ contraparte: e.target.value })} className={field} style={inputStyle} />
      </div>
      {error && <InlineNotice kind="error">{error}</InlineNotice>}
    </div>
  )
}

export function IngresoGuardado({ saved }: { saved: ManualIncome }) {
  return (
    <div className="flex flex-col gap-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Subtotal</span>
        <span style={{ ...MONO, textAlign: 'right' }}>{money(saved.subtotal)}</span>
        <span>IVA trasladado</span>
        <span style={{ ...MONO, textAlign: 'right' }}>{money(saved.transferredIva)}</span>
        <span className="font-semibold">Total</span>
        <span className="font-semibold" style={{ ...MONO, textAlign: 'right' }}>{money(saved.total)}</span>
      </div>
      <InlineNotice kind="success">{saved.message ?? 'Se agregó el ingreso. Recalcula la declaración para que entre al cálculo.'}</InlineNotice>
    </div>
  )
}
