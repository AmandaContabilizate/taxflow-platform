'use client'

import {
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Loader2,
  Send,
  Table2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDeclarationCalculations } from '@/features/operations/actions/getDeclarationCalculations.action'
import { getDeclarationInvoices } from '@/features/operations/actions/getDeclarationInvoices.action'
import type { DeclarationCalculations, DeclarationGeneral, Money } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'
import { Card } from '../ui'
import { type Json, money, num, percent, subObject } from './calc-read'

/* -------------------------------------------------------------------------- */
/*  Lectura de los cálculos                                                    */
/* -------------------------------------------------------------------------- */

const ISR_SECTIONS = ['serviceGround', 'serviceLodging', 'serviceAlienation']

/** Suma la misma llave en los tres regímenes de ISR; null si ninguno la trae. */
function sumSections(isr: Json | null, keys: string[]): number | null {
  if (!isr) return null
  let total: number | null = null
  for (const section of ISR_SECTIONS) {
    const obj = subObject(isr, [section])
    if (!obj || obj === isr) continue
    const v = num(obj, keys)
    if (v != null) total = (total ?? 0) + v
  }
  return total
}

/** Tasa de ISR del primer régimen que declare ingresos; sirve de referencia. */
function isrRate(isr: Json | null): number | null {
  if (!isr) return null
  for (const section of ISR_SECTIONS) {
    const obj = subObject(isr, [section])
    if (!obj || obj === isr) continue
    const ingresos = num(obj, ['totalService'])
    if (ingresos != null && ingresos > 0) {
      const rate = num(obj, ['ISR.porcentage'])
      if (rate != null) return rate
    }
  }
  return null
}

interface Resumen {
  ingresos: number | null
  egresos: number | null
  ivaTrasladado: number | null
  ivaAcreditable: number | null
  isrCausado: number | null
  isrRetenciones: number | null
  isrCargo: number | null
  ivaPagar: number | null
  tasaIsr: number | null
  total: number | null
}

function readResumen(calc: DeclarationCalculations | null, generalTotal: Money): Resumen {
  const iva = (calc?.iva ?? null) as Json | null
  const isr = (calc?.isr ?? null) as Json | null

  const ingresos = num(isr, ['totalIncomes']) ?? num(iva, ['totalIncomes'])
  // El motor no expone la base de gastos, solo su IVA; se deduce con la tasa
  // del periodo cuando ambas existen.
  const ivaAcreditable = num(iva, ['ivaExpenseTotal'])
  const tasaIva = num(iva, ['optionIva.porcentage'])
  const egresos =
    num(iva, ['totalExpenses', 'expenseTotal', 'subtotalExpenses']) ??
    (ivaAcreditable != null && tasaIva != null && tasaIva > 0
      ? ivaAcreditable / (Math.abs(tasaIva) <= 1 ? tasaIva : tasaIva / 100)
      : null)

  const isrCargo = num(isr, ['totalIsr']) ?? sumSections(isr, ['totalIsr'])
  const ivaPagar = num(iva, ['totalIva'])
  const generalNumber =
    typeof generalTotal === 'string' ? Number(generalTotal) : typeof generalTotal === 'number' ? generalTotal : null

  return {
    ingresos,
    egresos,
    ivaTrasladado: num(iva, ['ivaCaused']),
    ivaAcreditable,
    isrCausado: sumSections(isr, ['ISR.isrCaused']),
    isrRetenciones: sumSections(isr, ['totalRetained']),
    isrCargo,
    ivaPagar,
    tasaIsr: isrRate(isr),
    total:
      generalNumber != null && Number.isFinite(generalNumber) && generalNumber > 0
        ? generalNumber
        : isrCargo != null || ivaPagar != null
          ? (isrCargo ?? 0) + (ivaPagar ?? 0)
          : null,
  }
}

/* -------------------------------------------------------------------------- */
/*  Estatus → línea de tiempo                                                  */
/* -------------------------------------------------------------------------- */

const PIPELINE = [
  { label: 'Cálculo', Icon: Calculator },
  { label: 'Pre al cliente', Icon: Send },
  { label: 'Aprobada', Icon: CheckCircle2 },
  { label: 'Presentada', Icon: FileCheck2 },
  { label: 'Pagada', Icon: CircleDollarSign },
] as const

type Tone = 'brand' | 'amber' | 'coral'

interface StatusInfo {
  /** Último paso alcanzado (índice en PIPELINE). */
  step: number
  label: string
  tone: Tone
}

// statusCode del listado de declaraciones (`/declarations`, mismo catálogo que
// usa el detalle). Lo que no esté aquí se queda en "Cálculo".
const STATUS_MAP: Record<string, StatusInfo> = {
  PorCalcular: { step: 0, label: 'Por calcular', tone: 'amber' },
  PorRevisar: { step: 0, label: 'Por revisar', tone: 'amber' },
  Calculada: { step: 0, label: 'Calculada', tone: 'amber' },
  IntervencionManual: { step: 0, label: 'En revisión manual', tone: 'amber' },
  NoPresentada: { step: 0, label: 'No presentada', tone: 'coral' },
  EnRevisionCliente: { step: 1, label: 'En revisión del cliente', tone: 'amber' },
  RebotadaCliente: { step: 1, label: 'Rechazada por el cliente', tone: 'coral' },
  Aprobada: { step: 2, label: 'Aprobada', tone: 'brand' },
  AprobadaCliente: { step: 2, label: 'Aprobada por el cliente', tone: 'brand' },
  PorPresentar: { step: 2, label: 'Por presentar', tone: 'amber' },
  Enviando: { step: 2, label: 'Enviando al SAT', tone: 'amber' },
  Presentada: { step: 3, label: 'Presentada', tone: 'brand' },
  PresentadaManual: { step: 3, label: 'Presentada (manual)', tone: 'brand' },
  PresentadaPrevio: { step: 3, label: 'Presentada previamente', tone: 'brand' },
  PresentadaExterno: { step: 3, label: 'Presentada (SAT)', tone: 'brand' },
  PendientePago: { step: 3, label: 'Presentada no pagada', tone: 'amber' },
  PendienteConciliacion: { step: 3, label: 'En conciliación', tone: 'amber' },
  Pagada: { step: 4, label: 'Pagada', tone: 'brand' },
  Conciliada: { step: 4, label: 'Pagada y conciliada', tone: 'brand' },
}

function readStatus(general: DeclarationGeneral | null): StatusInfo | null {
  if (!general?.statusCode) return null
  const mapped = STATUS_MAP[general.statusCode]
  if (mapped) return mapped
  return { step: 0, label: general.statusDescription || general.statusCode, tone: 'amber' }
}

const TONE_CHIP: Record<Tone, { bg: string; fg: string }> = {
  brand: { bg: 'var(--brand-100)', fg: 'var(--brand-700)' },
  amber: { bg: 'var(--amber-soft)', fg: '#7B5312' },
  coral: { bg: 'var(--coral-soft)', fg: '#9E3A15' },
}

/* -------------------------------------------------------------------------- */
/*  Fechas                                                                     */
/* -------------------------------------------------------------------------- */

const fmtDate = (d: Date) => d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Ventana del periodo a partir de `periodValueId` (Catalogs.Period):
 * 101-112 mensual, 201-206 bimestral, 501 anual.
 */
function periodRange(periodValueId: number | null | undefined, year: number): [Date, Date] | null {
  if (!periodValueId || !year) return null
  if (periodValueId >= 101 && periodValueId <= 112) {
    const m = periodValueId - 101
    return [new Date(year, m, 1), new Date(year, m + 1, 0)]
  }
  if (periodValueId >= 201 && periodValueId <= 206) {
    const m = (periodValueId - 201) * 2
    return [new Date(year, m, 1), new Date(year, m + 2, 0)]
  }
  if (periodValueId === 501) return [new Date(year, 0, 1), new Date(year, 11, 31)]
  return null
}

function daysAgo(iso: string | null): number | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000))
}

/* -------------------------------------------------------------------------- */
/*  Piezas de UI                                                               */
/* -------------------------------------------------------------------------- */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      <span className="text-[14px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
        {value}
      </span>
    </div>
  )
}

function Timeline({ step }: { step: number }) {
  return (
    <div
      className="flex items-center gap-1 px-4 py-3 rounded-2xl overflow-x-auto"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {PIPELINE.map(({ label, Icon }, i) => {
        const done = i <= step
        return (
          <div key={label} className="flex items-center gap-1 flex-shrink-0">
            {i > 0 && (
              <span
                className="w-6 h-[2px] rounded-full"
                style={{ background: i <= step ? 'var(--brand-500)' : 'var(--border)' }}
              />
            )}
            <div className="flex items-center gap-1.5 pr-1">
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? 'var(--brand-100)' : 'var(--muted)',
                  color: done ? 'var(--brand-700)' : 'var(--ink-500)',
                  border: `1px solid ${done ? 'var(--brand-200)' : 'var(--border)'}`,
                }}
              >
                <Icon size={13} />
              </span>
              <span
                className="text-[12px] font-bold whitespace-nowrap"
                style={{ color: done ? 'var(--ink-900)' : 'var(--ink-500)' }}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StepRow({
  index,
  title,
  formula,
  operands,
  value,
  last,
}: {
  index: number
  title: string
  formula: string
  operands: string
  value: string
  last: boolean
}) {
  return (
    <div
      className="flex items-start gap-3 px-5 py-4"
      style={last ? undefined : { borderBottom: '1px solid var(--border)' }}
    >
      <span
        className="w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold flex-shrink-0 mt-0.5"
        style={{ background: 'var(--muted)', color: 'var(--ink-500)' }}
      >
        {index}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>
          {title}
        </div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          {formula}
        </div>
        <div className="text-[12px] mt-0.5" style={{ ...MONO, color: 'var(--ink-500)' }}>
          {operands}
        </div>
      </div>
      <div className="text-[14px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--sky)' }}>
        {value}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tarjeta de resumen                                                         */
/* -------------------------------------------------------------------------- */

interface Props {
  declarationId: number
  general: DeclarationGeneral | null
  periodo: string
  fiscalYear: number
}

export function ResumenDeclaracion({ declarationId, general, periodo, fiscalYear }: Props) {
  const [calc, setCalc] = useState<DeclarationCalculations | null>(null)
  const [cfdis, setCfdis] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detalle, setDetalle] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const [calcRes, invRes] = await Promise.all([
        getDeclarationCalculations(declarationId),
        getDeclarationInvoices({ declarationId, skip: 0, take: 1 }),
      ])
      if (cancelled) return
      if (calcRes.success) setCalc(calcRes.value)
      else setError(calcRes.error.message)
      setCfdis(invRes.success ? invRes.value.total : null)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [declarationId])

  const r = readResumen(calc, general?.totalDeclaration ?? null)
  const status = readStatus(general)
  const range = periodRange(general?.periodValueId, general?.fiscalYear ?? fiscalYear)
  const presentadaHace = daysAgo(general?.submittedAt ?? null)
  const fmt = (n: number | null) => (n == null ? '—' : money(n))

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 px-5 py-8 text-[14px]" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando resumen…
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="p-5 flex flex-col gap-4">
        {/* Encabezado */}
        <div>
          <h3 className="text-[17px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            Declaración · {periodo} {general?.fiscalYear ?? fiscalYear}
          </h3>
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {cfdis == null ? 'CFDIs del periodo no disponibles' : `${cfdis} CFDIs en el periodo`}
            {range ? ` · ${fmtDate(range[0])} al ${fmtDate(range[1])}` : ''}
          </div>
          {status && (
            <span
              className="inline-flex mt-2 px-3 py-1 rounded-full text-[12px] font-bold"
              style={{ background: TONE_CHIP[status.tone].bg, color: TONE_CHIP[status.tone].fg }}
            >
              {status.label}
            </span>
          )}
        </div>

        {error && (
          <div
            className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
          >
            {error}
          </div>
        )}

        {/* Cifras del periodo */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Metric label="Ingresos del periodo" value={fmt(r.ingresos)} />
          <Metric label="Egresos deducibles" value={fmt(r.egresos)} />
          <Metric label="IVA trasladado" value={fmt(r.ivaTrasladado)} />
          <Metric label="IVA acreditable" value={fmt(r.ivaAcreditable)} />
          <Metric label="ISR calculado" value={fmt(r.isrCargo)} />
          <Metric label="IVA a pagar" value={fmt(r.ivaPagar)} />
        </div>

        {/* Total */}
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
            Total a pagar
          </div>
          <div className="text-[30px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            {fmt(r.total)}
          </div>
        </div>

        {/* Avance */}
        {status && <Timeline step={status.step} />}

        {(presentadaHace != null || general?.acknowledgmentPdfUrl || general?.paymentLinePdfUrl) && (
          <div className="flex items-center gap-3 flex-wrap">
            {presentadaHace != null && (
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--brand-700)' }}>
                <CheckCircle2 size={15} />
                {presentadaHace === 0 ? 'Presentada hoy' : `Presentada hace ${presentadaHace} día${presentadaHace === 1 ? '' : 's'}`}
              </span>
            )}
            {general?.acknowledgmentPdfUrl && (
              <a
                href={general.acknowledgmentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <FileText size={14} /> Descargar acuse
              </a>
            )}
            {general?.paymentLinePdfUrl && (
              <a
                href={general.paymentLinePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <FileText size={14} /> Línea de captura
              </a>
            )}
          </div>
        )}

        {/* Cálculo detallado */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <button
            onClick={() => setDetalle((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-5 py-3"
            style={{ background: 'var(--muted)' }}
          >
            <span className="inline-flex items-center gap-2 text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>
              <Table2 size={15} /> Cálculo detallado
            </span>
            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--sky)' }}>
              {detalle ? 'Ocultar' : 'Ver'}
            </span>
          </button>

          {detalle && (
            <div style={{ background: 'var(--card)' }}>
              <StepRow
                index={1}
                title="Base gravable"
                formula="Ingresos − Egresos deducibles"
                operands={`${fmt(r.ingresos)} − ${fmt(r.egresos)}`}
                value={r.ingresos == null && r.egresos == null ? '—' : fmt((r.ingresos ?? 0) - (r.egresos ?? 0))}
                last={false}
              />
              <StepRow
                index={2}
                title="ISR a cargo"
                formula={`ISR causado − retenciones${r.tasaIsr != null ? ` · tasa ${percent(r.tasaIsr)}` : ''}`}
                operands={`${fmt(r.isrCausado)} − ${fmt(r.isrRetenciones)}`}
                value={fmt(r.isrCargo)}
                last={false}
              />
              <StepRow
                index={3}
                title="IVA neto"
                formula="IVA trasladado − IVA acreditable"
                operands={`${fmt(r.ivaTrasladado)} − ${fmt(r.ivaAcreditable)}`}
                value={fmt(r.ivaPagar)}
                last={false}
              />
              <StepRow
                index={4}
                title="Total a pagar"
                formula="ISR a cargo + IVA a pagar"
                operands={`${fmt(r.isrCargo)} + ${fmt(r.ivaPagar)}`}
                value={fmt(r.total)}
                last
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
