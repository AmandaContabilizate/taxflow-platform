'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Download, FileDown, Search, Sliders, ChevronDown } from 'lucide-react'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import {
  getIssuedInvoices,
  getReceivedInvoices,
  getVaultStats,
} from '@/features/vault/actions'
import type { InvoiceFilters } from '@/features/vault/actions/getIssuedInvoices.action'
import { isCfdiCancelled, isCfdiDeducible, type VaultInvoice, type VaultStats } from '@/features/vault/types'
import { MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, CiecWarningBanner, Divider, SummaryStat, Tabs } from '../ui'
import { DatePicker } from '../date-picker'
import { getCiecBlockStatus, isConnectedByEfirmaOnly, isSatConnected } from '../sat-connection.utils'
import { CiecBlockedScreen } from './ciec-blocked'
import { NeedsSatConnect } from './needs-sat-connect'

// Mismos filtros, opciones y etiquetas que la Bóveda SAT de la app móvil.
interface Filters {
  search: string
  rfcSearch: string
  from: string
  to: string
  minTotal: string
  maxTotal: string
  cfdiUse: string
  statusCfdi: string
  typeCfdi: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  rfcSearch: '',
  from: '',
  to: '',
  minTotal: '',
  maxTotal: '',
  cfdiUse: '',
  statusCfdi: '',
  typeCfdi: '',
}

// Enum StatusCFDI del back: el filtro solo reconoce Vigente = 1 y Cancelado = 2.
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: '1', label: 'Vigentes' },
  { value: '2', label: 'Cancelados' },
]

// Códigos que acepta MapTypeCfdiToBytes del back.
const TYPE_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'I', label: 'Ingreso' },
  { value: 'E', label: 'Egreso' },
  { value: 'P', label: 'Pago' },
  { value: 'N', label: 'Nómina' },
  { value: 'T', label: 'Traslado' },
]

function toApiFilters(f: Filters): InvoiceFilters | undefined {
  const filters: InvoiceFilters = {}
  if (f.search.trim()) filters.search = f.search.trim()
  if (f.rfcSearch.trim()) filters.rfcSearch = f.rfcSearch.trim().toUpperCase()
  if (f.from) filters.from = f.from
  if (f.to) filters.to = f.to
  if (f.cfdiUse.trim()) filters.cfdiUse = f.cfdiUse.trim().toUpperCase()
  if (f.statusCfdi) filters.statusCfdi = Number(f.statusCfdi)
  if (f.typeCfdi) filters.typeCfdi = [f.typeCfdi]
  const min = parseFloat(f.minTotal)
  const max = parseFloat(f.maxTotal)
  if (Number.isFinite(min)) filters.minTotal = min
  if (Number.isFinite(max)) filters.maxTotal = max
  return Object.keys(filters).length > 0 ? filters : undefined
}

const fieldLabelClass = 'text-[11px] font-bold uppercase tracking-wider'
const fieldClass = 'w-full px-4 py-2.5 rounded-lg border text-[13px]'
const fieldStyle = { borderColor: 'var(--border)', background: 'var(--input)' }

interface Props {
  go: GoFn
}

const moneyFull = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

function compactMoney(n: number): string {
  const trim = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1))
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `$${trim(n / 1_000_000)}M`
  if (abs >= 1_000) return `$${trim(n / 1_000)}K`
  return `$${Math.round(n)}`
}

function formatDate(s: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a)
  const db = new Date(b)
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return true
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

type DocType = 'invoice' | 'expense'

interface Row {
  key: string
  id: string
  docType: DocType
  name: string
  rfc: string
  meta: string
  // Nota visible solo cuando la factura se timbró en un día distinto al de
  // su fecha de expedición (p.ej. facturas de Público en General timbradas
  // ya iniciado el mes siguiente al que resumen).
  stampNote?: string
  monto: string
  revisar: boolean
}

function toRow(inv: VaultInvoice, side: 'issued' | 'received'): Row {
  const party = side === 'issued' ? inv.receiver : inv.issuer
  const invoiceDate = inv.invoiceDate || inv.date
  const fecha = formatDate(invoiceDate)
  const uso = inv.uso?.trim()
  const stampNote =
    inv.stampDate && !sameDay(invoiceDate, inv.stampDate)
      ? `Timbrado ${formatDate(inv.stampDate)}`
      : undefined
  return {
    key: inv.uuid || String(inv.id),
    id: String(inv.id),
    docType: side === 'issued' ? 'invoice' : 'expense',
    name: party?.name?.trim() || party?.rfc || 'Sin nombre',
    rfc: party?.rfc || '—',
    meta: [fecha, uso].filter(Boolean).join(' · '),
    stampNote,
    monto: moneyFull.format(inv.total ?? 0),
    revisar: !isCfdiDeducible(inv),
  }
}

function filenameFromResponse(res: Response, fallback: string): string {
  const cd = res.headers.get('content-disposition')
  if (!cd) return fallback
  const star = /filename\*=UTF-8''([^;\n]+)/i.exec(cd)
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1])
    } catch {
      return star[1]
    }
  }
  const m = /filename="?([^";]+)"?/i.exec(cd)
  return m?.[1] ?? fallback
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function downloadRowsZip(rows: Row[]) {
  const groups = new Map<DocType, string[]>()
  for (const r of rows) {
    const arr = groups.get(r.docType) ?? []
    arr.push(r.id)
    groups.set(r.docType, arr)
  }

  for (const [type, ids] of groups) {
    const res = await fetch('/api/vault/download-zip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids, type }),
    })
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error || 'No se pudo descargar el ZIP.')
    }
    triggerBrowserDownload(await res.blob(), filenameFromResponse(res, 'documentos.zip'))
  }
}

const TABS = ['Recibidas', 'Emitidas', 'Canceladas'] as const

export function DocumentosScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const { selectedRfc: rfc, selectedRfcInfo } = useRfcStore()
  const [tab, setTab] = useState(0)

  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [issued, setIssued] = useState<VaultInvoice[]>([])
  const [received, setReceived] = useState<VaultInvoice[]>([])

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [searchPending, startSearchTransition] = useTransition()

  useEffect(() => {
    if (!rfc) return
    let active = true
    setDataLoading(true)
    setError(null)
    setFilters(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)

    Promise.all([getVaultStats(rfc), getIssuedInvoices(rfc), getReceivedInvoices(rfc)])
      .then(([s, i, r]) => {
        if (!active) return
        if (s.success) setStats(s.value)
        else setError(s.error.message)
        setIssued(i.success ? i.value : [])
        setReceived(r.success ? r.value : [])
      })
      .catch(() => {
        if (active) setError('No pudimos cargar tu bóveda.')
      })
      .finally(() => {
        if (active) setDataLoading(false)
      })

    return () => {
      active = false
    }
  }, [rfc])

  const rowsByTab = useMemo<Row[][]>(() => {
    const recibidas = received.map(r => toRow(r, 'received'))
    const emitidas = issued.map(i => toRow(i, 'issued'))
    const canceladas = [
      ...issued.filter(isCfdiCancelled).map(i => toRow(i, 'issued')),
      ...received.filter(isCfdiCancelled).map(r => toRow(r, 'received')),
    ]
    return [recibidas, emitidas, canceladas]
  }, [issued, received])

  const deducible = useMemo(() => {
    const totalRecibido = received.reduce((sum, r) => sum + (r.total ?? 0), 0)
    const totalDeducible = received
      .filter(isCfdiDeducible)
      .reduce((sum, r) => sum + (r.total ?? 0), 0)
    const pct = totalRecibido > 0 ? Math.round((totalDeducible / totalRecibido) * 100) : 0
    return { value: totalDeducible, pct }
  }, [received])

  async function handleDownloadTab(rows: Row[]) {
    if (rows.length === 0 || downloading) return
    setDownloading(true)
    setDownloadError(null)
    try {
      await downloadRowsZip(rows)
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : 'No se pudo descargar el ZIP.')
    } finally {
      setDownloading(false)
    }
  }

  // Los filtros se aplican en el back; la descarga ZIP toma las filas ya filtradas.
  function applyFilters(next: Filters) {
    if (!rfc) return
    setFilters(next)
    setApplied(next)
    setFiltersExpanded(false)
    startSearchTransition(async () => {
      setError(null)
      const apiFilters = toApiFilters(next)
      const [issuedResult, receivedResult] = await Promise.all([
        getIssuedInvoices(rfc, apiFilters),
        getReceivedInvoices(rfc, apiFilters),
      ])
      if (issuedResult.success) setIssued(issuedResult.value)
      else setError(issuedResult.error.message)
      if (receivedResult.success) setReceived(receivedResult.value)
      else setError(receivedResult.error.message)
    })
  }

  const activeFilterCount = Object.values(applied).filter(v => v.trim() !== '').length

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu bóveda" />
  const ciecBlock = getCiecBlockStatus(selectedRfcInfo)
  if (!isSatConnected(selectedRfcInfo) && !ciecBlock) return <NeedsSatConnect go={go} feature="ver tu bóveda" />
  if (ciecBlock === 'invalid') return <CiecBlockedScreen go={go} state="invalid" />

  const rows = rowsByTab[tab]

  const facturasHint = (n: number) => `${n} ${n === 1 ? 'factura' : 'facturas'}`

  return (
    <div className="flex flex-col gap-5">
      {ciecBlock === 'unverified' && <CiecWarningBanner go={go} variant="unverified" />}
      {isConnectedByEfirmaOnly(selectedRfcInfo) && <CiecWarningBanner go={go} variant="efirma" />}
      <div>

        {error && (
          <div
            className="rounded-2xl px-4 py-3 mb-4 text-[13.5px] font-semibold"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
          >
            {error}
          </div>
        )}

        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <SummaryStat
            label="Emitidas"
            value={dataLoading && !stats ? '—' : compactMoney(stats?.totalIncome.value ?? 0)}
            hint={dataLoading && !stats ? 'Cargando…' : facturasHint(stats?.issuedCount ?? 0)}
          />
          <SummaryStat
            label="Recibidas"
            value={dataLoading && !stats ? '—' : compactMoney(stats?.totalExpenses.value ?? 0)}
            hint={dataLoading && !stats ? 'Cargando…' : facturasHint(stats?.receivedCount ?? 0)}
          />
          <SummaryStat
            label="Deducible"
            value={dataLoading ? '—' : compactMoney(deducible.value)}
            hint={dataLoading ? 'Cargando…' : `${deducible.pct}% ✓`}
            tone="ok"
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por UUID, RFC, Folio o Razón Social"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyFilters(filters)
                }}
                className="w-full px-4 py-3 rounded-xl border text-[14px] transition"
                style={fieldStyle}
              />
            </div>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="px-5 py-3 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition hover:opacity-80"
              style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}
            >
              <Sliders size={16} /> FILTROS
              {activeFilterCount > 0 && (
                <span
                  className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--brand-700)', color: '#fff' }}
                >
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown
                size={16}
                style={{
                  transform: filtersExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            <button
              onClick={() => applyFilters(filters)}
              disabled={searchPending}
              className="px-5 py-3 rounded-xl font-semibold text-[13px] text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#221158' }}
            >
              <Search size={16} /> {searchPending ? 'Buscando…' : 'BUSCAR'}
            </button>
          </div>

          {filtersExpanded && (
            <Card>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      RFC
                    </label>
                    <input
                      type="text"
                      placeholder="XAXX010101000"
                      value={filters.rfcSearch}
                      onChange={(e) => setFilters({ ...filters, rfcSearch: e.target.value.toUpperCase() })}
                      className={fieldClass}
                      style={fieldStyle}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Desde
                    </label>
                    <DatePicker
                      value={filters.from}
                      onChange={(date) => setFilters({ ...filters, from: date })}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Hasta
                    </label>
                    <DatePicker
                      value={filters.to}
                      onChange={(date) => setFilters({ ...filters, to: date })}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Uso de CFDI
                    </label>
                    <input
                      type="text"
                      placeholder="G03, P01…"
                      value={filters.cfdiUse}
                      onChange={(e) => setFilters({ ...filters, cfdiUse: e.target.value.toUpperCase() })}
                      className={fieldClass}
                      style={fieldStyle}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Monto mínimo
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minTotal}
                      onChange={(e) => setFilters({ ...filters, minTotal: e.target.value })}
                      className={fieldClass}
                      style={fieldStyle}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Monto máximo
                    </label>
                    <input
                      type="number"
                      placeholder="Sin límite"
                      value={filters.maxTotal}
                      onChange={(e) => setFilters({ ...filters, maxTotal: e.target.value })}
                      className={fieldClass}
                      style={fieldStyle}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Estatus
                    </label>
                    <select
                      value={filters.statusCfdi}
                      onChange={(e) => setFilters({ ...filters, statusCfdi: e.target.value })}
                      className={fieldClass}
                      style={fieldStyle}
                    >
                      {STATUS_OPTIONS.map(o => (
                        <option key={o.label} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className={fieldLabelClass} style={{ color: 'var(--ink-500)' }}>
                      Tipo de comprobante
                    </label>
                    <select
                      value={filters.typeCfdi}
                      onChange={(e) => setFilters({ ...filters, typeCfdi: e.target.value })}
                      className={fieldClass}
                      style={fieldStyle}
                    >
                      {TYPE_OPTIONS.map(o => (
                        <option key={o.label} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-5">
                  <Btn kind="ghost" size="sm" onClick={() => applyFilters(EMPTY_FILTERS)} disabled={searchPending}>
                    Limpiar
                  </Btn>
                  <Btn kind="primary" size="sm" onClick={() => applyFilters(filters)} disabled={searchPending}>
                    Aplicar filtros
                  </Btn>
                </div>
              </div>
            </Card>
          )}
        </div>


        {/* Tabs + descarga */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3 mt-6">
          <Tabs items={[...TABS]} active={tab} onChange={setTab} />
          <Btn
            kind="ghost"
            size="sm"
            onClick={() => handleDownloadTab(rows)}
            disabled={downloading || dataLoading || rows.length === 0}
          >
            <Download size={16} /> {downloading ? 'Descargando…' : 'Descargar XML + PDF'}
          </Btn>
        </div>

        {downloadError && (
          <div
            className="rounded-2xl px-4 py-3 mb-3 text-[13.5px] font-semibold"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
          >
            {downloadError}
          </div>
        )}

        <Card>
          {dataLoading ? (
            <div className="px-4 py-10 text-center text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              Cargando tus facturas…
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              {activeFilterCount > 0
                ? 'Ningún comprobante coincide con los filtros.'
                : 'No hay facturas en esta sección.'}
            </div>
          ) : (
            <div>
              {rows.map((f, i, arr) => (
                <div key={f.key}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={
                        f.revisar
                          ? { background: 'var(--amber-soft)', color: 'var(--violet-ink)' }
                          : { background: 'var(--brand-50)', color: 'var(--brand-700)' }
                      }
                    >
                      {f.revisar ? <AlertTriangle size={20} /> : <FileDown size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14.5px] truncate">{f.name}</div>
                      <div className="text-[12px] mt-0.5 truncate" style={{ ...MONO, color: 'var(--ink-500)' }}>
                        {f.rfc}
                        {f.meta ? ` · ${f.meta}` : ''}
                      </div>
                      {f.stampNote && (
                        <div className="text-[11px] mt-0.5 truncate" style={{ ...MONO, color: 'var(--ink-400)' }}>
                          {f.stampNote}
                        </div>
                      )}
                    </div>
                    <div className="text-[14.5px] font-extrabold" style={MONO}>
                      {f.monto}
                    </div>
                    <Badge kind={f.revisar ? 'amber' : 'brand'}>{f.revisar ? 'Revisar' : 'Deducible'}</Badge>
                  </div>
                  {i < arr.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
