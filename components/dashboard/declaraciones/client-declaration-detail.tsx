'use client'

import { AlertCircle, ArrowLeft, Download, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getClientDeclarationInvoices } from '@/features/declarations/actions/getClientDeclarationInvoices.action'
import type { ClientDeclarationInvoice, ClientDeclarationSubject } from '@/features/declarations/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card } from '../ui'
import { DeclarationComments } from './declaration-comments'
import { declarationStatusBadge, fmtDate, resolvePdfUrl } from './parts'

interface CurrentUser {
  userId: string
  fullName: string
}

interface Props {
  declaration: ClientDeclarationSubject
  onBack: () => void
  currentUser: CurrentUser
}

type Origen = '' | 'true' | 'false'
type Deducible = '' | 'si' | 'no' | 'pendiente'

const money = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? '—'
    : n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

/**
 * Detalle de una declaración para el contribuyente.
 *
 * Es una pantalla aparte de la del contador a propósito: el cliente ve el listado
 * de sus CFDI del periodo y si cada uno quedó deducible, nunca la clasificación ni
 * las herramientas de recálculo.
 */
export function ClientDeclarationDetail({ declaration: d, onBack, currentUser }: Props) {
  const [invoices, setInvoices] = useState<ClientDeclarationInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [origen, setOrigen] = useState<Origen>('')
  const [deducible, setDeducible] = useState<Deducible>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getClientDeclarationInvoices({ declarationId: d.declarationId })
      if (cancelled) return
      if (res.success) setInvoices(res.value)
      else {
        setError(res.error.message)
        setInvoices([])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [d.declarationId])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return invoices
      .filter((i) => {
        if (origen !== '' && i.isIssued !== (origen === 'true')) return false
        if (deducible === 'si' && i.isDeductible !== true) return false
        if (deducible === 'no' && i.isDeductible !== false) return false
        if (deducible === 'pendiente' && i.isDeductible != null) return false
        if (!q) return true
        return [i.uuid, i.folio, i.issuer?.rfc, i.issuer?.name, i.receiver?.rfc, i.receiver?.name].some(
          (f) => f?.toLowerCase().includes(q),
        )
      })
      .sort((a, b) => b.invoiceDate.localeCompare(a.invoiceDate))
  }, [invoices, query, origen, deducible])

  const totalVisible = useMemo(
    () => rows.reduce((acc, i) => acc + (Number.isFinite(i.total) ? i.total : 0), 0),
    [rows],
  )

  const status = declarationStatusBadge(d.statusCode, d.statusLabel)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex items-start gap-3 flex-wrap">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div>
          <h2
            className="text-[24px] lg:text-[28px] font-extrabold tracking-tight leading-tight"
            style={{ ...DISPLAY, color: 'var(--ink-900)' }}
          >
            Declaración — {d.periodo}
          </h2>
          <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
            <code style={MONO}>{d.rfc}</code>
            {d.legalName ? ` • ${d.legalName}` : ''}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge kind={status.kind}>{status.label}</Badge>
            {d.regimeName && <Badge kind="default">{d.regimeName}</Badge>}
          </div>
        </div>
      </div>

      <Card>
        <div className="p-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Dato label="Periodo" value={d.periodo} />
          <Dato label="Ejercicio" value={String(d.fiscalYear)} />
          <Dato label="Periodicidad" value={d.periodicity ?? 'No definida'} />
          <Dato label="Presentada el" value={d.submittedAt ? fmtDate(d.submittedAt) : 'Aún no'} />
        </div>
        {(d.acknowledgmentPdfUrl || d.paymentLinePdfUrl || d.paymentAcknowledgmentPdfUrl) && (
          <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
            {d.acknowledgmentPdfUrl && (
              <a
                href={resolvePdfUrl(d.acknowledgmentPdfUrl) ?? d.acknowledgmentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <Download size={15} /> Descargar acuse
              </a>
            )}
            {d.paymentLinePdfUrl && (
              <a
                href={resolvePdfUrl(d.paymentLinePdfUrl) ?? d.paymentLinePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <Download size={15} /> Descargar línea de captura
              </a>
            )}
            {d.paymentAcknowledgmentPdfUrl && (
              <a
                href={resolvePdfUrl(d.paymentAcknowledgmentPdfUrl) ?? d.paymentAcknowledgmentPdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold transition hover:opacity-90"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                <Download size={15} /> Descargar comprobante de pago
              </a>
            )}
          </div>
        )}
      </Card>

      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Tus facturas de este periodo
            </h3>
            <p className="text-[13px] mt-0.5 max-w-[62ch]" style={{ color: 'var(--ink-500)' }}>
              {loading
                ? 'Cargando facturas…'
                : error
                  ? 'No pudimos cargar tus facturas.'
                  : `${invoices.length} comprobantes entraron a esta declaración. Aquí ves cuáles tu contador tomó como deducibles.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
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
                placeholder="Buscar por UUID, folio, RFC o nombre…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px]"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <Filtro
              label="Emitidas / Recibidas"
              value={origen}
              onChange={setOrigen}
              options={[
                ['', 'Todas'],
                ['true', 'Emitidas'],
                ['false', 'Recibidas'],
              ]}
            />
            <Filtro
              label="Deducibilidad"
              value={deducible}
              onChange={setDeducible}
              options={[
                ['', 'Todas'],
                ['si', 'Deducibles'],
                ['no', 'No deducibles'],
                ['pendiente', 'Por revisar'],
              ]}
            />
          </div>

          {error ? (
            <div className="py-8 text-center flex flex-col items-center gap-2">
              <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
              <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
                {error}
              </div>
            </div>
          ) : loading ? (
            <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
              <Loader2 size={18} className="animate-spin" /> Cargando facturas…
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
              {invoices.length === 0
                ? 'Esta declaración todavía no tiene facturas asociadas.'
                : 'Ninguna factura coincide con el filtro.'}
            </div>
          ) : (
            <>
              <div
                className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <span
                  className="text-[11.5px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--ink-500)' }}
                >
                  {rows.length} facturas en pantalla
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                    Total
                  </span>
                  <span
                    className="text-[15px] font-extrabold"
                    style={{ ...MONO, color: 'var(--ink-900)' }}
                  >
                    {money(totalVisible)}
                  </span>
                </span>
              </div>

              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Fecha', 'Folio / UUID', 'Origen', 'Contraparte', 'Total', 'Estatus SAT', 'Deducible'].map(
                        (h) => (
                          <th
                            key={h}
                            className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap"
                            style={{ color: 'var(--ink-700)' }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((inv) => {
                      const contraparte = inv.isIssued ? inv.receiver : inv.issuer
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td
                            className="px-3 py-3 whitespace-nowrap align-top"
                            style={{ color: 'var(--ink-900)' }}
                          >
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
                            {money(inv.total)}
                          </td>
                          <td className="px-3 py-3 align-top">
                            <Chip
                              bg={inv.status === 'Cancelado' ? 'var(--coral-soft)' : 'var(--muted)'}
                              fg={inv.status === 'Cancelado' ? 'var(--violet-ink)' : 'var(--ink-700)'}
                            >
                              {inv.status || 'Sin estatus'}
                            </Chip>
                          </td>
                          <td className="px-3 py-3 align-top">
                            {inv.isDeductible == null ? (
                              <Chip bg="var(--muted)" fg="var(--ink-500)">
                                Por revisar
                              </Chip>
                            ) : inv.isDeductible ? (
                              <Chip bg="var(--brand-50)" fg="var(--brand-700)">
                                Deducible
                              </Chip>
                            ) : (
                              <Chip bg="var(--coral-soft)" fg="var(--violet-ink)">
                                No deducible
                              </Chip>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Comentarios para tu contador
            </h3>
            <p className="text-[13px] mt-0.5 max-w-[62ch]" style={{ color: 'var(--ink-500)' }}>
              Si algo no cuadra en esta declaración, escríbelo aquí: tu contador lo ve junto con el
              periodo y te responde en este mismo hilo.
            </p>
          </div>
          <DeclarationComments declarationId={d.declarationId} currentUser={currentUser} />
        </div>
      </Card>
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
      <div className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
        {label}
      </div>
      <div className="text-[14.5px] font-extrabold mt-1" style={{ color: 'var(--ink-900)' }}>
        {value}
      </div>
    </div>
  )
}

function Filtro<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <label className="flex flex-col gap-1 min-w-[160px]">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
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
