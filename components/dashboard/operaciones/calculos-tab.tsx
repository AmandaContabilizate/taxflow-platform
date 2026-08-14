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
/*  Piezas de UI                                                               */
/* -------------------------------------------------------------------------- */

function PanelHeader({ title }: { title: string }) {
  return (
    <div
      className="px-5 py-3.5"
      style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}
    >
      <h3 className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        {title}
      </h3>
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
}: {
  label: string
  value: string
  editable?: boolean
  draft?: string
  onDraftChange?: (v: string) => void
  last: boolean
}) {
  return (
    <div
      className="flex items-center gap-4 px-5 py-3"
      style={last ? undefined : { borderBottom: '1px solid var(--border)' }}
    >
      <div className="flex-1 min-w-0 text-[13px] leading-snug" style={{ color: 'var(--ink-700)' }}>
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
}: {
  rows: RowSpec[]
  data: Json | null
  drafts: Record<string, string>
  setDraft: (id: string, v: string) => void
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
            editable={row.editable}
            draft={drafts[row.id] ?? (raw != null ? String(raw) : '')}
            onDraftChange={(v) => setDraft(row.id, v)}
            last={i === rows.length - 1}
          />
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab principal                                                              */
/* -------------------------------------------------------------------------- */

export function CalculosTab({ declarationId }: { declarationId: number }) {
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
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
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
          style={{ background: 'var(--amber-soft)', color: '#7B5312', border: '1px solid var(--border)' }}
        >
          Esta declaración todavía no tiene cálculos guardados. Las cifras aparecerán en cuanto el motor de
          cálculo los persista.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2 items-start">
        {/* IVA */}
        <Card>
          <PanelHeader title="IVA" />
          <RowList rows={IVA_ROWS} data={ivaData} drafts={drafts} setDraft={setDraft} />
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
          <RowList rows={activeIsr.rows} data={isrSection} drafts={drafts} setDraft={setDraft} />
        </Card>
      </div>
    </div>
  )
}
