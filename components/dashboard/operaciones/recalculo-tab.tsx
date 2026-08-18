'use client'

import { AlertCircle, Check, Loader2, RotateCcw, Search, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getClassificationCategories } from '@/features/declarations/actions/getClassificationCategories.action'
import { getDeclarationPeriodInvoices } from '@/features/declarations/actions/getDeclarationPeriodInvoices.action'
import type { Recalculation } from '@/features/declarations/hooks/useRecalculation'
import { periodMonthRange } from '@/features/declarations/periods'
import type {
  ClassificationAdjustment,
  ClassificationCategory,
  DeclarationPeriodInvoice,
} from '@/features/declarations/types'
import { money } from './calc-read'
import { MONO } from '../constants'
import { Card } from '../ui'

interface Props {
  rfc: string
  fiscalYear: number
  /** Catalogs.Period (101-112 mensual, 201-206 bimestral, 501 anual). */
  periodValueId: number | null
  /** Id interno de Users.TaxRegimes; es lo que piden los EP de facturas del periodo. */
  taxRegimeId: number | null
  periodo: string
  recalc: Recalculation
  /** El contribuyente ve el resultado pero no reclasifica ni dispara el cálculo. */
  readOnly: boolean
}

type Deducible = '' | 'true' | 'false'

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const amount = (n: number | null | undefined) => (n == null ? '—' : money(n))

/** Solo se manda lo que cambió: un ajuste sin campos además del uuid no se envía. */
function hasChanges(adj: ClassificationAdjustment): boolean {
  return (
    adj.classification !== undefined ||
    adj.isDeductible !== undefined ||
    adj.isExpense !== undefined ||
    adj.reason !== undefined
  )
}

export function RecalculoTab({
  rfc,
  fiscalYear,
  periodValueId,
  taxRegimeId,
  periodo,
  recalc,
  readOnly,
}: Props) {
  const [invoices, setInvoices] = useState<DeclarationPeriodInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [categories, setCategories] = useState<ClassificationCategory[]>([])
  const [query, setQuery] = useState('')
  const [soloProblemas, setSoloProblemas] = useState(false)
  const [adjustments, setAdjustments] = useState<Record<string, ClassificationAdjustment>>({})

  const range = periodMonthRange(periodValueId)

  useEffect(() => {
    if (!rfc || !range || !taxRegimeId) {
      setLoading(false)
      setInvoices([])
      return
    }
    let cancelled = false
    setLoading(true)
    setListError(null)
    void (async () => {
      const res = await getDeclarationPeriodInvoices({
        rfc,
        year: fiscalYear,
        beginMonth: range.beginMonth,
        endMonth: range.endMonth,
        idRegime: taxRegimeId,
      })
      if (cancelled) return
      if (res.success) setInvoices(res.value)
      else {
        setListError(res.error.message)
        setInvoices([])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // `recalc.version` sube en cada recálculo exitoso: la clasificación por
    // comprobante cambió, así que la lista se vuelve a pedir.
  }, [rfc, fiscalYear, range?.beginMonth, range?.endMonth, taxRegimeId, recalc.version])

  useEffect(() => {
    if (readOnly) return
    let cancelled = false
    void (async () => {
      const res = await getClassificationCategories()
      if (!cancelled && res.success) setCategories(res.value)
    })()
    return () => {
      cancelled = true
    }
  }, [readOnly])

  // Los ajustes ya aplicados dejan de estar pendientes: el siguiente recálculo no
  // los debe volver a mandar.
  useEffect(() => {
    if (recalc.version === 0) return
    setAdjustments({})
  }, [recalc.version])

  const pending = useMemo(
    () => Object.values(adjustments).filter(hasChanges),
    [adjustments],
  )

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter((i) => {
        if (soloProblemas && i.isDeductible !== false && i.isDeductible != null) return false
        if (!q) return true
        return [
          i.uuid,
          i.folio,
          i.issuer?.rfc,
          i.issuer?.name,
          i.receiver?.rfc,
          i.receiver?.name,
          i.classification,
          ...i.productServiceKeys,
        ].some((f) => f?.toLowerCase().includes(q))
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
  }, [invoices, query, soloProblemas])

  const sinClasificar = useMemo(
    () => invoices.filter((i) => i.isDeductible == null).length,
    [invoices],
  )

  const patch = (uuid: string, change: Partial<ClassificationAdjustment>) =>
    setAdjustments((prev) => {
      const next = { ...prev[uuid], uuid, ...change }
      // Quitar la clave (no ponerla en null) es lo que el clasificador espera:
      // aplica los ajustes con `exclude_unset`.
      for (const key of Object.keys(next) as (keyof ClassificationAdjustment)[]) {
        if (next[key] === undefined) delete next[key]
      }
      return { ...prev, [uuid]: next }
    })

  const clearRow = (uuid: string) =>
    setAdjustments((prev) => {
      const { [uuid]: _drop, ...rest } = prev
      return rest
    })

  const gastos = useMemo(() => categories.filter((c) => c.isExpense), [categories])
  const ingresos = useMemo(() => categories.filter((c) => !c.isExpense), [categories])

  const disabled = readOnly || recalc.running

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Recálculo de la declaración
              </h3>
              <p className="text-[13px] mt-0.5 max-w-[62ch]" style={{ color: 'var(--ink-500)' }}>
                Recalcular vuelve a bajar y parsear los XML del período {periodo} y rehace ISR/IVA.
                Si corriges una clasificación aquí, el cálculo se repite con tus ajustes sin volver
                a pasar por la IA.
              </p>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-2 flex-wrap">
                {pending.length > 0 && (
                  <button
                    onClick={() => setAdjustments({})}
                    disabled={recalc.running}
                    className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold transition hover:opacity-90 disabled:opacity-50"
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--foreground)',
                    }}
                  >
                    <Undo2 size={15} /> Descartar {pending.length} ajuste
                    {pending.length === 1 ? '' : 's'}
                  </button>
                )}
                <button
                  onClick={() => void recalc.run(pending)}
                  disabled={recalc.running || !recalc.ready}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
                  style={{
                    background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)',
                    color: '#fff',
                    boxShadow: 'var(--sh-brand)',
                  }}
                >
                  {recalc.running ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Calculando… {recalc.seconds}s
                    </>
                  ) : (
                    <>
                      <RotateCcw size={15} />
                      {pending.length > 0
                        ? `Recalcular con ${pending.length} ajuste${pending.length === 1 ? '' : 's'}`
                        : 'Recalcular'}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {!recalc.ready && (
            <Note tone="warn">
              La declaración no tiene período o régimen asignado, así que no se puede recalcular.
            </Note>
          )}

          {recalc.error && <Note tone="error">{recalc.error}</Note>}

          {recalc.running && (
            <Note tone="info">
              El clasificador está procesando los comprobantes del período. Puede tardar varios
              minutos; no cierres la pantalla.
            </Note>
          )}

          {!recalc.running && sinClasificar === invoices.length && invoices.length > 0 && (
            <Note tone="info">
              Ningún comprobante de este período está clasificado todavía. Recalcula primero sin
              ajustes: el clasificador necesita esa primera corrida para poder aplicar correcciones
              manuales.
            </Note>
          )}
        </div>
      </Card>

      {recalc.result && <ResultadoRecalculo result={recalc.result} />}

      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Comprobantes del período y su clasificación
              </h3>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                {loading
                  ? 'Cargando comprobantes…'
                  : listError
                    ? 'No pudimos cargar los comprobantes del período.'
                    : `${invoices.length} comprobantes entran al cálculo${sinClasificar > 0 ? ` · ${sinClasificar} sin clasificar` : ''}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-500)',
                }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por UUID, folio, RFC, clasificación o clave prod/serv…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px]"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>
            <label
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[12.5px] font-bold cursor-pointer"
              style={{
                background: soloProblemas ? 'var(--nav-active-bg)' : 'var(--card)',
                border: '1px solid var(--border-strong)',
                color: soloProblemas ? 'var(--nav-active-fg)' : 'var(--foreground)',
              }}
            >
              <input
                type="checkbox"
                checked={soloProblemas}
                onChange={(e) => setSoloProblemas(e.target.checked)}
                className="accent-[var(--brand-700)]"
              />
              Solo no deducibles y sin clasificar
            </label>
          </div>

          {listError ? (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
              <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
                {listError}
              </div>
            </div>
          ) : loading ? (
            <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
              <Loader2 size={18} className="animate-spin" /> Cargando comprobantes…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
              {invoices.length === 0
                ? 'No hay comprobantes en este período para el régimen de la declaración.'
                : 'Ningún comprobante coincide con el filtro.'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      'Fecha',
                      'Folio / UUID',
                      'Origen',
                      'Contraparte',
                      'Total',
                      'Claves prod/serv',
                      'Clasificación actual',
                      readOnly ? 'Retenciones' : 'Corregir',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const adj = adjustments[inv.uuid]
                    const contraparte = inv.isIssued ? inv.receiver : inv.issuer
                    return (
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-3 whitespace-nowrap align-top" style={{ color: 'var(--ink-900)' }}>
                          {fmtDate(inv.invoiceDate)}
                        </td>
                        <td className="px-3 py-3 align-top min-w-[180px]">
                          <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                            {inv.folio || 'Sin folio'}
                          </div>
                          <code
                            className="text-[10.5px] leading-[1.45] break-all uppercase"
                            style={{ ...MONO, color: 'var(--ink-500)' }}
                          >
                            {inv.uuid}
                          </code>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Chip
                            bg={inv.isIssued ? 'var(--sky-soft)' : 'var(--ink-50)'}
                            fg={inv.isIssued ? 'var(--sky)' : 'var(--ink-700)'}
                          >
                            {inv.isIssued ? 'Emitida' : 'Recibida'}
                          </Chip>
                          <div className="text-[11px] mt-1" style={{ color: 'var(--ink-500)' }}>
                            {inv.typeId}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top min-w-[160px]">
                          <div style={{ color: 'var(--ink-900)' }}>{contraparte?.name ?? '—'}</div>
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>
                            {contraparte?.rfc ?? ''}
                          </code>
                        </td>
                        <td
                          className="px-3 py-3 whitespace-nowrap align-top font-semibold"
                          style={{ ...MONO, color: 'var(--ink-900)' }}
                        >
                          {amount(inv.total)}
                          {inv.withheldAmount != null && (
                            <div className="text-[11px] font-normal mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              Retenido {amount(inv.withheldAmount)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top min-w-[120px]">
                          {inv.productServiceKeys.length === 0 ? (
                            <span style={{ color: 'var(--ink-500)' }}>—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {inv.productServiceKeys.map((k) => (
                                <code
                                  key={k}
                                  className="px-1.5 py-0.5 rounded"
                                  style={{
                                    ...MONO,
                                    fontSize: '10.5px',
                                    background: 'var(--muted)',
                                    color: 'var(--ink-700)',
                                  }}
                                >
                                  {k}
                                </code>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top min-w-[170px]">
                          <ClasificacionActual inv={inv} />
                        </td>
                        <td className="px-3 py-3 align-top min-w-[230px]">
                          {readOnly ? (
                            <span style={{ ...MONO, color: 'var(--ink-900)' }}>
                              {amount(inv.withheldAmount)}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <select
                                value={adj?.classification ?? ''}
                                onChange={(e) =>
                                  patch(inv.uuid, {
                                    classification: e.target.value || undefined,
                                  })
                                }
                                disabled={disabled}
                                className="w-full px-2.5 py-2 rounded-lg text-[12.5px] disabled:opacity-60"
                                style={{
                                  background: 'var(--input)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                <option value="">Dejar clasificación</option>
                                <optgroup label="Gastos">
                                  {gastos.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="Ingresos">
                                  {ingresos.map((c) => (
                                    <option key={c.id} value={c.name}>
                                      {c.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </select>

                              <select
                                value={
                                  adj?.isDeductible === undefined
                                    ? ''
                                    : (String(adj.isDeductible) as Deducible)
                                }
                                onChange={(e) => {
                                  const v = e.target.value as Deducible
                                  patch(inv.uuid, {
                                    isDeductible: v === '' ? undefined : v === 'true',
                                  })
                                }}
                                disabled={disabled}
                                className="w-full px-2.5 py-2 rounded-lg text-[12.5px] disabled:opacity-60"
                                style={{
                                  background: 'var(--input)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--foreground)',
                                }}
                              >
                                <option value="">Dejar deducibilidad</option>
                                <option value="true">Marcar deducible</option>
                                <option value="false">Marcar no deducible</option>
                              </select>

                              {adj?.isDeductible === false && (
                                <input
                                  type="text"
                                  value={adj.reason ?? ''}
                                  onChange={(e) =>
                                    patch(inv.uuid, { reason: e.target.value || undefined })
                                  }
                                  disabled={disabled}
                                  placeholder="Motivo (opcional)"
                                  className="w-full px-2.5 py-2 rounded-lg text-[12.5px] disabled:opacity-60"
                                  style={{
                                    background: 'var(--input)',
                                    border: '1px solid var(--border)',
                                    color: 'var(--foreground)',
                                  }}
                                />
                              )}

                              {adj && hasChanges(adj) && (
                                <button
                                  onClick={() => clearRow(inv.uuid)}
                                  disabled={recalc.running}
                                  className="self-start text-[11.5px] font-bold underline disabled:opacity-50"
                                  style={{ color: 'var(--ink-500)' }}
                                >
                                  Quitar ajuste
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Resultado del último recálculo                                            */
/* -------------------------------------------------------------------------- */

function ResultadoRecalculo({ result }: { result: NonNullable<Recalculation['result']> }) {
  const totals: [string, number | null][] = [
    ['Ingresos', result.income],
    ['Ingreso acumulado', result.accumulatedIncome],
    ['ISR del período', result.annualTax],
    ['ISR retenido', result.isrRetenido],
    ['IVA a cargo', result.ivaCargo],
    ['IVA a favor', result.ivaFavor],
    ['IVA retenido', result.ivaRetenido],
    ['Total a pagar', result.totalDeclaration],
  ]

  return (
    <Card>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Check size={18} style={{ color: 'var(--brand-700)' }} />
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Resultado del recálculo
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip bg="var(--muted)" fg="var(--ink-700)">
              Régimen {result.regimeSatCode}
            </Chip>
            {result.reclassified && (
              <Chip bg="var(--brand-50)" fg="var(--brand-700)">
                {result.appliedAdjustments.length} ajuste
                {result.appliedAdjustments.length === 1 ? '' : 's'} aplicado
                {result.appliedAdjustments.length === 1 ? '' : 's'}
              </Chip>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {totals.map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl p-3.5"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <div className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                {label}
              </div>
              <div className="text-[16px] font-extrabold mt-1" style={{ ...MONO, color: 'var(--ink-900)' }}>
                {amount(value)}
              </div>
            </div>
          ))}
        </div>

        {/* `input` es la auditoría del cálculo: si aquí faltan XML, el problema
            está en el armado del payload, no en el clasificador. */}
        <div
          className="rounded-2xl p-3.5 text-[12.5px] flex flex-wrap gap-x-5 gap-y-1.5"
          style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
        >
          <span style={{ color: 'var(--ink-700)' }}>
            XML enviados al clasificador:{' '}
            <strong style={{ color: 'var(--ink-900)' }}>{result.input.totalXmlCount}</strong>
          </span>
          <span style={{ color: 'var(--ink-700)' }}>
            Emitidos: <strong style={{ color: 'var(--ink-900)' }}>{result.input.issuedXmlCount}</strong>
          </span>
          <span style={{ color: 'var(--ink-700)' }}>
            Recibidos:{' '}
            <strong style={{ color: 'var(--ink-900)' }}>{result.input.receivedXmlCount}</strong>
          </span>
          <span style={{ color: 'var(--ink-700)' }}>
            Deducciones manuales:{' '}
            <strong style={{ color: 'var(--ink-900)' }}>{amount(result.input.manualDeductions)}</strong>
          </span>
          {result.input.yearToDateIvaFavor != null && (
            <span style={{ color: 'var(--ink-700)' }}>
              IVA a favor acumulado:{' '}
              <strong style={{ color: 'var(--ink-900)' }}>{amount(result.input.yearToDateIvaFavor)}</strong>
            </span>
          )}
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Piezas chicas                                                             */
/* -------------------------------------------------------------------------- */

function ClasificacionActual({ inv }: { inv: DeclarationPeriodInvoice }) {
  if (inv.isDeductible == null) {
    return (
      <Chip bg="var(--muted)" fg="var(--ink-500)">
        Sin clasificar
      </Chip>
    )
  }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {inv.isDeductible ? (
          <Chip bg="var(--brand-50)" fg="var(--brand-700)">Deducible</Chip>
        ) : (
          <Chip bg="var(--coral-soft)" fg="var(--ink-900)">No deducible</Chip>
        )}
        {inv.isExpense != null && (
          <Chip bg="var(--ink-50)" fg="var(--ink-700)">{inv.isExpense ? 'Gasto' : 'Ingreso'}</Chip>
        )}
      </div>
      {inv.classification && (
        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-900)' }}>
          {inv.classification}
        </span>
      )}
      {inv.reason && (
        <span
          className="text-[11.5px] leading-snug"
          style={{ color: inv.isDeductible ? 'var(--ink-500)' : 'var(--ink-900)' }}
        >
          {inv.reason}
        </span>
      )}
    </div>
  )
}

function Chip({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  )
}

function Note({ tone, children }: { tone: 'info' | 'warn' | 'error'; children: React.ReactNode }) {
  const styles = {
    info: { background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)', color: 'var(--ink-700)' },
    warn: { background: 'var(--hero-amber)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' },
    error: { background: 'var(--coral-soft)', border: '1px solid var(--border-strong)', color: 'var(--ink-900)' },
  }[tone]

  return (
    <div className="rounded-2xl px-4 py-3 text-[13px] flex items-start gap-2" style={styles}>
      {tone !== 'info' && <AlertCircle size={16} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  )
}
