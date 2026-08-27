'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getDeclarationCalculations } from '@/features/operations/actions/getDeclarationCalculations.action'
import type { DeclarationCalculations } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'
import { Card } from '../ui'
import { type Json, money, percent, pick, subObject, toNumber } from './calc-read'

/* -------------------------------------------------------------------------- */
/*  Definición de filas                                                        */
/* -------------------------------------------------------------------------- */

interface RowSpec {
  /** Identificador estable para el estado de los campos editables. */
  id: string
  label: string
  /** Nombres posibles de la llave en el JSON del backend. */
  keys: string[]
  kind?: 'money' | 'percent'
  /** Se captura a mano (el cálculo no lo determina). */
  editable?: boolean
  /** Renglón de cierre del panel (se destaca). */
  total?: boolean
}

// Los ingresos no viven en el objeto `iva`: salen de la raíz de `isr`, que es
// donde el backend acumula los totales del periodo (ver mergeIvaData).
const IVA_ROWS: RowSpec[] = [
  { id: 'iva-int', label: 'Ingresos mediante intermediarios', keys: ['totalForIntermediaries'] },
  { id: 'iva-usr', label: 'Ingresos mediante usuario', keys: ['totalForUsers'] },
  { id: 'iva-tot', label: 'Ingresos totales', keys: ['totalIncomes'] },
  { id: 'iva-tasa', label: 'Tasa', keys: ['optionIva.porcentage'], kind: 'percent' },
  { id: 'iva-causado', label: 'IVA causado', keys: ['ivaCaused'] },
  { id: 'iva-gastos', label: 'IVA gastos (acreditable)', keys: ['ivaExpenseTotal'] },
  { id: 'iva-ret', label: 'Retenciones de IVA por plataforma tecnológica', keys: ['retentionPlataform'], editable: true },
  { id: 'iva-periodo', label: 'IVA del periodo a declarar', keys: ['ivaToDeclared'] },
  { id: 'iva-ant', label: 'IVA a acreditar de periodos anteriores', keys: ['ivaPeriodsPrevius'], editable: true },
  { id: 'iva-cargo', label: 'IVA a cargo', keys: ['totalIva'] },
]

interface IsrTab {
  label: string
  /** Nombres posibles del sub-objeto dentro del JSON de ISR. */
  section: string[]
  rows: RowSpec[]
}

/** Cierre común a los tres regímenes: totales, tasa, causado, retenciones. */
const TOTALS_ROWS: RowSpec[] = [
  { id: 'tot', label: 'Ingresos totales', keys: ['totalService'] },
  { id: 'tasa', label: 'Tasa', keys: ['ISR.porcentage'], kind: 'percent' },
  { id: 'causado', label: 'ISR causado', keys: ['ISR.isrCaused'] },
  { id: 'ret', label: 'Retenciones por plataformas tecnológicas', keys: ['totalRetained'], editable: true },
  { id: 'cargo', label: 'ISR a cargo', keys: ['totalIsr'] },
]

const ISR_TABS: IsrTab[] = [
  {
    label: 'Servicio terrestre',
    section: ['serviceGround'],
    rows: [
      { id: 'ter-int-pas', label: 'Ingresos intermediarios servicio de pasajeros', keys: ['totalPassengerPlataform'], editable: true },
      { id: 'ter-int-bie', label: 'Ingresos intermediarios entrega bienes', keys: ['totalDealerPlataform'], editable: true },
      { id: 'ter-dir-pas', label: 'Ingresos directos servicio de pasajeros', keys: ['subtotalServicePassengersClasified'] },
      { id: 'ter-dir-bie', label: 'Ingresos directos entrega bienes', keys: ['subtotalServiceDealerClasified'] },
      ...TOTALS_ROWS.map((r) => ({ ...r, id: `ter-${r.id}` })),
    ],
  },
  {
    label: 'Servicio hospedaje',
    section: ['serviceLodging'],
    rows: [
      { id: 'hos-int', label: 'Ingresos mediante intermediarios', keys: ['totalLodgingPlataform'], editable: true },
      { id: 'hos-dir', label: 'Ingresos directos del usuario', keys: ['subtotalServiceLodgingClasified'] },
      ...TOTALS_ROWS.map((r) => ({ ...r, id: `hos-${r.id}` })),
    ],
  },
  {
    label: 'Enajenación y prestación servicios',
    section: ['serviceAlienation'],
    rows: [
      { id: 'ena-int-ena', label: 'Ingresos intermediarios por enajenación', keys: ['totalAlienationPlataform'], editable: true },
      { id: 'ena-int-ser', label: 'Ingresos intermediarios por servicios', keys: ['totalLendingPlataform'], editable: true },
      { id: 'ena-dir-ena', label: 'Ingresos directos por enajenación', keys: ['subtotalServiceAlineationClasified'] },
      { id: 'ena-dir-ser', label: 'Ingresos directos por servicios', keys: ['subtotalServiceLendingClasified'] },
      ...TOTALS_ROWS.map((r) => ({ ...r, id: `ena-${r.id}` })),
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Régimen 626 (RESICO) — forma propia del JSON, nada que ver con la del 625   */
/* -------------------------------------------------------------------------- */

const IVA_626_ROWS: RowSpec[] = [
  { id: 'r626-iva-16', label: 'Ingresos gravados al 16%', keys: ['subtotalIncome16'] },
  { id: 'r626-iva-0', label: 'Ingresos tasa 0%', keys: ['subtotalIncome0'] },
  { id: 'r626-iva-ex', label: 'Ingresos exentos', keys: ['subtotalIncomeExento'] },
  { id: 'r626-iva-tras', label: 'IVA trasladado', keys: ['totalTaxe16'] },
  { id: 'r626-iva-acr', label: 'IVA acreditable', keys: ['totalIvaCreditable'] },
  { id: 'r626-iva-ret', label: 'IVA retenido', keys: ['totalIvaRetained'] },
  { id: 'r626-iva-prev', label: 'IVA a acreditar de periodos anteriores', keys: ['IVAMonthsPrev'] },
  { id: 'r626-iva-sub', label: 'Subtotal de IVA', keys: ['subtotalIVA'] },
  { id: 'r626-iva-tot', label: 'IVA del periodo a cargo', keys: ['totalIVA'], total: true },
]

/** Ingresos y tarifa. Los gastos van aparte: en RESICO normalmente no existen. */
const ISR_626_INCOME_ROWS: RowSpec[] = [
  { id: 'r626-isr-ing', label: 'Ingresos del periodo', keys: ['incomesSubtotalAutorized'] },
  { id: 'r626-isr-acum', label: 'Ingresos acumulados', keys: ['incomesAccumulatedsTotal'] },
]

const ISR_626_EXPENSE_ROWS: RowSpec[] = [
  { id: 'r626-isr-gas', label: 'Gastos del periodo', keys: ['expensesSubtotalAutorized'] },
  { id: 'r626-isr-gas-acum', label: 'Gastos acumulados', keys: ['expensesAccumulatedsTotal'] },
]

const ISR_626_TAX_ROWS: RowSpec[] = [
  { id: 'r626-isr-li', label: 'Límite inferior', keys: ['ISR.lowerLimit'] },
  { id: 'r626-isr-ls', label: 'Límite superior', keys: ['ISR.upperLimit'] },
  { id: 'r626-isr-tasa', label: 'Tasa', keys: ['ISR.porcentage'], kind: 'percent' },
  { id: 'r626-isr-cau', label: 'ISR causado', keys: ['ISR.taxeBeforeRetentions'] },
  { id: 'r626-isr-ret', label: 'Retenciones de ISR', keys: ['ISR.isrRetentions'] },
  { id: 'r626-isr-cargo', label: 'ISR a cargo', keys: ['ISR.retentionToPay'], total: true },
]

/**
 * En RESICO no hay deducciones autorizadas por gasto: los renglones de gastos
 * solo se pintan si el motor devolvió algo distinto de cero, para no inventar
 * filas en ceros.
 */
function isr626Rows(isr: Json | null): RowSpec[] {
  const gastos =
    (toNumber(pick(isr, ['expensesSubtotalAutorized'])) ?? 0) +
    (toNumber(pick(isr, ['expensesAccumulatedsTotal'])) ?? 0)
  return [
    ...ISR_626_INCOME_ROWS,
    ...(gastos > 0 ? ISR_626_EXPENSE_ROWS : []),
    ...ISR_626_TAX_ROWS,
  ]
}

/* -------------------------------------------------------------------------- */
/*  Piezas de UI                                                               */
/* -------------------------------------------------------------------------- */

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string | null }) {
  return (
    <div
      className="px-5 py-3.5"
      style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
    >
      <h3 className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        {title}
      </h3>
      {subtitle && (
        <div className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}

function ValueRow({
  label,
  value,
  editable,
  draft,
  onDraftChange,
  last,
  total,
}: {
  label: string
  value: string
  editable?: boolean
  draft?: string
  onDraftChange?: (v: string) => void
  last: boolean
  total?: boolean
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={{
        ...(last ? {} : { borderBottom: '1px solid var(--border)' }),
        ...(total ? { background: 'var(--muted)' } : {}),
      }}
    >
      <div
        className={`flex-1 min-w-0 text-[13px] leading-snug ${total ? 'font-extrabold' : ''}`}
        style={{ color: total ? 'var(--ink-900)' : 'var(--ink-700)' }}
      >
        {label}
      </div>
      {editable ? (
        <div className="relative w-[190px] flex-shrink-0">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold"
            style={{ color: 'var(--ink-500)' }}
          >
            $
          </span>
          <input
            inputMode="decimal"
            value={draft ?? ''}
            onChange={(e) => onDraftChange?.(e.target.value)}
            placeholder="0"
            className="w-full pl-7 pr-3 py-2 rounded-lg text-[13px] text-right outline-none focus:ring-2"
            style={{
              ...MONO,
              background: 'var(--input)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>
      ) : (
        <div
          className="text-[13.5px] font-bold text-right flex-shrink-0 w-[190px]"
          style={{ ...MONO, color: 'var(--ink-900)' }}
        >
          {value}
        </div>
      )}
    </div>
  )
}

function RowList({
  rows,
  data,
  drafts,
  setDraft,
  readOnly,
}: {
  rows: RowSpec[]
  data: Json | null
  drafts: Record<string, string>
  setDraft: (id: string, v: string) => void
  readOnly?: boolean
}) {
  return (
    <div>
      {rows.map((row, i) => {
        const raw = toNumber(pick(data, row.keys))
        const value = raw == null ? '—' : row.kind === 'percent' ? percent(raw) : money(raw)
        return (
          <ValueRow
            key={row.id}
            label={row.label}
            value={value}
            editable={row.editable && !readOnly}
            draft={drafts[row.id] ?? (raw != null ? String(raw) : '')}
            onDraftChange={(v) => setDraft(row.id, v)}
            last={i === rows.length - 1}
            total={row.total}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab principal                                                              */
/* -------------------------------------------------------------------------- */

export function CalculosTab({
  declarationId,
  readOnly,
  regimeSatCode,
}: {
  declarationId: number
  readOnly?: boolean
  /** Fallback de `/general` mientras `/calculations` no responde. */
  regimeSatCode?: string | null
}) {
  const [calc, setCalc] = useState<DeclarationCalculations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isrTab, setIsrTab] = useState(0)
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDeclarationCalculations(declarationId)
      if (cancelled) return
      if (res.success) setCalc(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [declarationId])

  const setDraft = (id: string, v: string) => setDrafts((prev) => ({ ...prev, [id]: v }))

  const iva = (calc?.iva ?? null) as Json | null
  const isr = (calc?.isr ?? null) as Json | null
  // Fuente única del régimen: `/calculations` (E3). `general.regimeSatCode` solo
  // entra como fallback si el backend todavía no devuelve el campo.
  const satCode = calc?.regimeSatCode ?? regimeSatCode ?? null
  const is626 = satCode === '626'
  const rawMonth = pick(isr, ['nameMonth'])
  const nameMonth = typeof rawMonth === 'string' && rawMonth.trim() ? rawMonth : null
  const activeIsr = ISR_TABS[isrTab]
  const isrSection = subObject(isr, activeIsr.section)

  // El objeto `iva` no trae los ingresos del periodo; viven en la raíz de `isr`
  // (totalIncomes / totalForIntermediaries / totalForUsers). Se fusionan para
  // que la tarjeta de IVA pueda pintar sus tres primeras filas.
  const ivaData = useMemo<Json | null>(() => {
    if (!iva && !isr) return null
    return {
      totalIncomes: isr?.totalIncomes ?? null,
      totalForIntermediaries: isr?.totalForIntermediaries ?? null,
      totalForUsers: isr?.totalForUsers ?? null,
      ...(iva ?? {}),
    }
  }, [iva, isr])

  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 px-5 py-8 text-[14px]" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando cálculos…
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <div className="px-5 py-6">
          <div
            className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
          >
            {error}
          </div>
        </div>
      </Card>
    )
  }

  const sinDatos = !iva && !isr

  return (
    <div className="flex flex-col gap-4">
      {sinDatos && (
        <div
          className="rounded-2xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
        >
          Esta declaración todavía no tiene cálculos guardados. Las cifras aparecerán en cuanto el motor de
          cálculo los persista.
        </div>
      )}

      {is626 ? (
        <div className="grid gap-4 lg:grid-cols-2 items-start">
          {/* IVA · RESICO (626). Vista de solo lectura en esta iteración. */}
          <Card>
            <PanelHeader title="IVA" subtitle={nameMonth} />
            <RowList rows={IVA_626_ROWS} data={iva} drafts={drafts} setDraft={setDraft} readOnly />
          </Card>

          {/* ISR · RESICO (626): tarifa única, sin las sub-tabs del 625. */}
          <Card>
            <PanelHeader title="ISR" subtitle={nameMonth} />
            <RowList rows={isr626Rows(isr)} data={isr} drafts={drafts} setDraft={setDraft} readOnly />
          </Card>
        </div>
      ) : (
      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* IVA */}
        <Card>
          <PanelHeader title="IVA" />
          <RowList rows={IVA_ROWS} data={ivaData} drafts={drafts} setDraft={setDraft} readOnly={readOnly} />
        </Card>

        {/* ISR con pestañas por régimen */}
        <Card>
          <PanelHeader title="ISR" />
          <div
            className="flex gap-1 px-3 pt-3 pb-0 overflow-x-auto"
            style={{ borderBottom: '1px solid var(--border)' }}
          >
            {ISR_TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setIsrTab(i)}
                className="whitespace-nowrap px-3.5 py-2 rounded-t-lg text-[12.5px] font-bold transition"
                style={
                  i === isrTab
                    ? {
                        background: 'var(--card)',
                        color: 'var(--ink-900)',
                        border: '1px solid var(--border)',
                        borderBottom: '1px solid var(--card)',
                        marginBottom: '-1px',
                      }
                    : { background: 'transparent', color: 'var(--sky)' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <RowList rows={activeIsr.rows} data={isrSection} drafts={drafts} setDraft={setDraft} readOnly={readOnly} />
        </Card>
      </div>
      )}
    </div>
  )
}
