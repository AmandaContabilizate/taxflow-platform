'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BadgeCheck, Check, Download, Eye, FileDown } from 'lucide-react'
import { useHasRfc, useSelectedRfc } from '@/features/taxpayers/stores/rfcStore'
import {
  getIssuedInvoices,
  getReceivedInvoices,
  getVaultStats,
} from '@/features/vault/actions'
import { CFDI_STATUS_VIGENTE, type VaultInvoice, type VaultStats } from '@/features/vault/types'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, SummaryStat, Tabs } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

const moneyFull = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

// Formato compacto tipo "$128K" / "$9.9K" para las tarjetas.
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

type DocType = 'invoice' | 'expense'

interface Row {
  key: string
  id: string
  docType: DocType
  name: string
  rfc: string
  meta: string
  monto: string
  revisar: boolean
}

// La contraparte es el receptor en emitidas y el emisor en recibidas.
// Emitidas = CFDI tipo "invoice" (IdInvoice) · recibidas = "expense" (IdExpense).
function toRow(inv: VaultInvoice, side: 'issued' | 'received'): Row {
  const party = side === 'issued' ? inv.receiver : inv.issuer
  const fecha = formatDate(inv.date)
  const uso = inv.uso?.trim()
  return {
    key: inv.uuid || String(inv.id),
    id: String(inv.id),
    docType: side === 'issued' ? 'invoice' : 'expense',
    name: party?.name?.trim() || party?.rfc || 'Sin nombre',
    rfc: party?.rfc || '—',
    meta: [fecha, uso].filter(Boolean).join(' · '),
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

// Descarga el ZIP (PDF + XML) de las filas dadas vía el proxy /api/vault/download-zip.
// Agrupa por tipo porque la pestaña "Canceladas" mezcla emitidas y recibidas.
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

  const rowsByTab = useMemo<Row[][]>(() => {
    const recibidas = received.map(r => toRow(r, 'received'))
    const emitidas = issued.map(i => toRow(i, 'issued'))
    const canceladas = [
      ...issued.filter(i => i.statusComprobante !== CFDI_STATUS_VIGENTE).map(i => toRow(i, 'issued')),
      ...received.filter(r => r.statusComprobante !== CFDI_STATUS_VIGENTE).map(r => toRow(r, 'received')),
    ]
    return [recibidas, emitidas, canceladas]
  }, [issued, received])

  // "Deducible": no hay campo del backend, se deriva de los CFDI recibidos
  // vigentes (statusComprobante === 1). Monto deducible y % sobre el total recibido.
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

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu bóveda" />

  const status = [
    { t: 'Estás al corriente con tus obligaciones', s: 'No debes nada al SAT' },
    { t: 'No apareces en listas negras', s: 'Tu RFC tiene buen historial' },
    { t: 'Tu RFC está activo', s: 'Puedes facturar sin problema' },
  ]
  const rows = rowsByTab[tab]

  const facturasHint = (n: number) => `${n} ${n === 1 ? 'factura' : 'facturas'}`

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
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

        {/* Tabs + descarga */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
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
