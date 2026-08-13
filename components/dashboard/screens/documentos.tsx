'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { AlertTriangle, Download, FileDown, Search, Sliders, ChevronDown } from 'lucide-react'
import { useHasRfc, useSelectedRfc } from '@/features/taxpayers/stores/rfcStore'
import {
  getIssuedInvoices,
  getReceivedInvoices,
  getVaultStats,
} from '@/features/vault/actions'
import { CFDI_STATUS_VIGENTE, type VaultInvoice, type VaultStats } from '@/features/vault/types'
import { MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, SummaryStat, Tabs } from '../ui'
import { DatePicker } from '../date-picker'
import { NeedsSatConnect } from './needs-sat-connect'

interface Filters {
  search: string
  startDate: string
  endDate: string
  rfc: string
  cfdiUse: string
  minAmount: string
  maxAmount: string
  status: string
  type: string
}

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
    revisar: inv.statusComprobante !== CFDI_STATUS_VIGENTE,
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
  const rfc = useSelectedRfc()
  const [tab, setTab] = useState(0)

  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [issued, setIssued] = useState<VaultInvoice[]>([])
  const [received, setReceived] = useState<VaultInvoice[]>([])

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [filters, setFilters] = useState<Filters>({
    search: '',
    startDate: '',
    endDate: '',
    rfc: '',
    cfdiUse: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    type: '',
  })
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [searchPending, startSearchTransition] = useTransition()

  useEffect(() => {
    if (!rfc) return
    let active = true
    setDataLoading(true)
    setError(null)

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

  const applyFilters = (rows: Row[]): Row[] => {
    return rows.filter(row => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matches =
          row.name.toLowerCase().includes(searchLower) ||
          row.rfc.toLowerCase().includes(searchLower)
        if (!matches) return false
      }
      if (filters.rfc && row.rfc !== filters.rfc) return false
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount)
        const amount = parseFloat(row.monto.replace(/[^\d.-]/g, ''))
        if (amount < min) return false
      }
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount)
        const amount = parseFloat(row.monto.replace(/[^\d.-]/g, ''))
        if (amount > max) return false
      }
      return true
    })
  }

  const rowsByTab = useMemo<Row[][]>(() => {
    const recibidas = received.map(r => toRow(r, 'received'))
    const emitidas = issued.map(i => toRow(i, 'issued'))
    const canceladas = [
      ...issued.filter(i => i.statusComprobante !== CFDI_STATUS_VIGENTE).map(i => toRow(i, 'issued')),
      ...received.filter(r => r.statusComprobante !== CFDI_STATUS_VIGENTE).map(r => toRow(r, 'received')),
    ]
    return [applyFilters(recibidas), applyFilters(emitidas), applyFilters(canceladas)]
  }, [issued, received, filters])

  const deducible = useMemo(() => {
    const totalRecibido = received.reduce((sum, r) => sum + (r.total ?? 0), 0)
    const totalDeducible = received
      .filter(r => r.statusComprobante === CFDI_STATUS_VIGENTE)
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

  async function handleSearch() {
    if (!rfc) return
    startSearchTransition(async () => {
      setError(null)
      const filterParams = {
        search: filters.search || undefined,
        from: filters.startDate || undefined,
        to: filters.endDate || undefined,
        rfcSearch: filters.rfc || undefined,
        cfdiUse: filters.cfdiUse || undefined,
        minTotal: filters.minAmount ? parseFloat(filters.minAmount) : undefined,
        maxTotal: filters.maxAmount ? parseFloat(filters.maxAmount) : undefined,
        statusCfdi: filters.status ? parseInt(filters.status) : undefined,
        typeCfdi: filters.type ? [filters.type] : undefined,
      }
      const [issuedResult, receivedResult] = await Promise.all([
        getIssuedInvoices(rfc, filterParams),
        getReceivedInvoices(rfc, filterParams),
      ])
      if (issuedResult.success) setIssued(issuedResult.value)
      else setError(issuedResult.error.message)
      if (receivedResult.success) setReceived(receivedResult.value)
      else setError(receivedResult.error.message)
      setFiltersExpanded(false)
    })
  }

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu bóveda" />

  const rows = rowsByTab[tab]

  const facturasHint = (n: number) => `${n} ${n === 1 ? 'factura' : 'facturas'}`

  return (
    <div className="flex flex-col gap-5">
      <div>

        {error && (
          <div
            className="rounded-2xl px-4 py-3 mb-4 text-[13.5px] font-semibold"
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
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

        {/* Filtros - Rediseño */}
        <div className="flex flex-col gap-3">
          {/* Buscador Principal */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por UUID, RFC, Folio o Razón Social"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border text-[14px] transition"
                style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
              />
            </div>
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="px-5 py-3 rounded-xl font-semibold text-[13px] flex items-center gap-2 transition hover:opacity-80"
              style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}
            >
              <Sliders size={16} /> FILTROS
              <ChevronDown
                size={16}
                style={{
                  transform: filtersExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>
            <button
              onClick={handleSearch}
              disabled={searchPending}
              className="px-5 py-3 rounded-xl font-semibold text-[13px] text-white flex items-center gap-2 transition hover:opacity-90 disabled:opacity-50"
              style={{ background: '#15113F' }}
            >
              <Search size={16} /> {searchPending ? 'Buscando…' : 'BUSCAR'}
            </button>
          </div>

          {/* Panel de Filtros Avanzados */}
          {filtersExpanded && (
            <Card>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Fecha Inicio
                    </label>
                    <DatePicker
                      value={filters.startDate}
                      onChange={(date) => setFilters({ ...filters, startDate: date })}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Fecha Fin
                    </label>
                    <DatePicker
                      value={filters.endDate}
                      onChange={(date) => setFilters({ ...filters, endDate: date })}
                      placeholder="Seleccionar"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      RFC
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: GOR0930119TXA"
                      value={filters.rfc}
                      onChange={(e) => setFilters({ ...filters, rfc: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Uso de CFDI
                    </label>
                    <select
                      value={filters.cfdiUse}
                      onChange={(e) => setFilters({ ...filters, cfdiUse: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    >
                      <option value="">Todos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Monto Mínimo
                    </label>
                    <input
                      type="number"
                      placeholder="$0.00"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Monto Máximo
                    </label>
                    <input
                      type="number"
                      placeholder="$999,999.99"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Estatus
                    </label>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    >
                      <option value="">Todos</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Tipo
                    </label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border text-[13px]"
                      style={{ borderColor: 'var(--border)', background: 'var(--input)' }}
                    >
                      <option value="">Todos</option>
                    </select>
                  </div>
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
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
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
              No hay facturas en esta sección.
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
                          ? { background: 'var(--amber-soft)', color: '#7B5312' }
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
