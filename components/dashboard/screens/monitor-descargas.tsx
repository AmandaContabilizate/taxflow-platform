'use client'

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Copy,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { exportDownloadMonitor } from '@/features/downloads/actions/exportDownloadMonitor.action'
import { getDownloadMonitor } from '@/features/downloads/actions/getDownloadMonitor.action'
import { getDownloadRequestHistory } from '@/features/downloads/actions/getDownloadRequestHistory.action'
import type {
  DownloadMonitor,
  DownloadMonitorFilters,
  DownloadMonitorGroup,
  DownloadMonitorItem,
  DownloadRequestHistory,
} from '@/features/downloads/types'
import { downloadFile } from '@/lib/common/downloadFile'
import { MONO } from '../constants'
import { selectStyle } from '../operaciones/purchased-declarations'
import { useHasPermission } from '../permissions'
import { useUrlState } from '../url-state'
import { Badge, type BadgeKind, Card, ErrorState, HelpBox, NoAccessState } from '../ui'

export const DOWNLOAD_MONITOR_CLAIM = 'Developer.ReadDownloadMonitor'

/** Una transitoria que lleva más de esto en el mismo estatus se marca como atorada. */
const STALE_SECONDS = 2 * 60 * 60

const MX_TZ = 'America/Mexico_City'
const dateTimeFmt = new Intl.DateTimeFormat('es-MX', {
  timeZone: MX_TZ,
  day: '2-digit',
  month: 'short',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})
const timeFmt = new Intl.DateTimeFormat('es-MX', { timeZone: MX_TZ, hour: '2-digit', minute: '2-digit' })
// El periodo viene sin zona (datetime2): se formatea tal cual, sin convertir.
const periodFmt = new Intl.DateTimeFormat('es-MX', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })

const fmtDateTime = (iso: string | null) => (iso ? dateTimeFmt.format(new Date(iso)) : '—')
const fmtPeriodDate = (iso: string | null) => (iso ? periodFmt.format(new Date(`${iso.slice(0, 10)}T00:00:00Z`)) : '—')

function fmtDuration(seconds: number | null): string {
  if (seconds == null) return '—'
  const s = Math.max(0, seconds)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

function groupKind(g: Pick<DownloadMonitorGroup, 'statusId' | 'isTransient'>): BadgeKind {
  if (g.isTransient) return 'sky'
  if (g.statusId === 7) return 'brand'
  if (g.statusId === 11 || g.statusId === 12) return 'danger'
  return 'amber'
}

type SortKey = 'statusAt' | 'rfc' | 'period' | 'dateRequest' | 'secondsInStatus' | 'totalSeconds' | 'retryCount' | 'id'
interface SortState {
  key: SortKey
  dir: 'asc' | 'desc'
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'statusAt', label: 'Último cambio de estatus' },
  { key: 'secondsInStatus', label: 'Tiempo en estatus' },
  { key: 'totalSeconds', label: 'Duración total' },
  { key: 'dateRequest', label: 'Fecha de solicitud' },
  { key: 'period', label: 'Periodo' },
  { key: 'rfc', label: 'RFC' },
  { key: 'retryCount', label: 'Reintentos' },
  { key: 'id', label: 'Id' },
]

const DEFAULT_SORT: SortState = { key: 'statusAt', dir: 'desc' }

function sortValue(i: DownloadMonitorItem, key: SortKey): string | number {
  switch (key) {
    case 'statusAt':
      return i.statusAt
    case 'rfc':
      return i.rfc ?? ''
    case 'period':
      return `${i.startDateRequest ?? ''}|${i.endDateRequest ?? ''}`
    case 'dateRequest':
      return i.dateRequest ?? ''
    case 'secondsInStatus':
      return i.secondsInStatus
    case 'totalSeconds':
      return i.totalSeconds ?? -1
    case 'retryCount':
      return i.retryCount
    case 'id':
      return i.id
  }
}

function sortItems(items: DownloadMonitorItem[], sort: SortState): DownloadMonitorItem[] {
  const factor = sort.dir === 'asc' ? 1 : -1
  return [...items].sort((a, b) => {
    const va = sortValue(a, sort.key)
    const vb = sortValue(b, sort.key)
    if (va < vb) return -1 * factor
    if (va > vb) return 1 * factor
    return b.id - a.id
  })
}

const inputClass = 'px-3 py-2 rounded-lg text-[12.5px] font-semibold'
const ghostBtn = {
  background: 'var(--card)',
  border: '1px solid var(--border-strong)',
  color: 'var(--ink-700)',
}

/**
 * Monitor de solicitudes de descarga SAT (Fispal), solo Developer. Muestra las que siguen en un
 * estatus transitorio (sin importar la fecha) y las que cerraron (completada, error, ZIP incompleto,
 * expirada, cancelada, reencolada) en las últimas 24 h, agrupadas por su último estatus.
 * Los Ids son de db-filedownload (la base de DownloadFispal), no de db-contaboxpro.
 */
export function MonitorDescargasScreen() {
  const { params, setParams } = useUrlState()
  const rfcParam = params.get('rfc') ?? ''
  const emailParam = params.get('email') ?? ''
  const fromParam = params.get('from') ?? ''
  const toParam = params.get('to') ?? ''

  const [rfcInput, setRfcInput] = useState(rfcParam)
  const [emailInput, setEmailInput] = useState(emailParam)
  const [fromInput, setFromInput] = useState(fromParam)
  const [toInput, setToInput] = useState(toParam)

  const [data, setData] = useState<DownloadMonitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())
  const [sorts, setSorts] = useState<Record<number, SortState>>({})

  // El menú ya la oculta sin el claim, pero la URL directa (`?s=monitor-descargas`) no.
  const canView = useHasPermission(DOWNLOAD_MONITOR_CLAIM)

  const filters: DownloadMonitorFilters = useMemo(
    () => ({
      rfc: rfcParam || undefined,
      email: emailParam || undefined,
      from: fromParam || undefined,
      to: toParam || undefined,
    }),
    [rfcParam, emailParam, fromParam, toParam],
  )

  useEffect(() => {
    if (!canView) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDownloadMonitor(filters)
      if (cancelled) return
      if (res.success) setData(res.value)
      else {
        setError(res.error.message)
        setData(null)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [canView, filters, reloadKey])

  const rangeInvalid = Boolean(fromInput && toInput && fromInput > toInput)

  const applyFilters = () => {
    if (rangeInvalid) return
    setParams(
      {
        rfc: rfcInput.trim().toUpperCase() || null,
        email: emailInput.trim() || null,
        from: fromInput || null,
        to: toInput || null,
      },
      { replace: true },
    )
  }

  const clearFilters = () => {
    setRfcInput('')
    setEmailInput('')
    setFromInput('')
    setToInput('')
    setParams({ rfc: null, email: null, from: null, to: null }, { replace: true })
  }

  const onExport = async () => {
    setExporting(true)
    setExportError(null)
    const res = await exportDownloadMonitor(filters)
    if (res.success) downloadFile(res.value)
    else
      setExportError(
        res.error.code === 'EXPORT_NO_RESULTS' ? 'No hay descargas que exportar con estos filtros.' : res.error.message,
      )
    setExporting(false)
  }

  const toggleGroup = (statusId: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(statusId)) next.delete(statusId)
      else next.add(statusId)
      return next
    })

  const setGroupSort = (statusId: number, sort: SortState) => setSorts((prev) => ({ ...prev, [statusId]: sort }))

  const jumpTo = (statusId: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.delete(statusId)
      return next
    })
    requestAnimationFrame(() =>
      document.getElementById(`monitor-group-${statusId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
  }

  if (!canView) {
    return (
      <Card>
        <NoAccessState />
      </Card>
    )
  }

  const filtering = Boolean(rfcParam || emailParam || fromParam || toParam)
  const groups = data?.groups ?? []
  const transientTotal = groups.filter((g) => g.isTransient).reduce((acc, g) => acc + g.count, 0)
  const finalTotal = groups.filter((g) => !g.isTransient).reduce((acc, g) => acc + g.count, 0)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>
        Descargas del SAT vía Fispal agrupadas por su <strong>último</strong> estatus. Las transitorias
        (creada → procesando facturas, y ZIP no listo) salen sin importar la fecha; las cerradas solo si
        cerraron en las últimas 24 horas. El filtro de fechas exige que el periodo descargado quede
        completo dentro del rango. Una transitoria con más de {STALE_SECONDS / 3600} h sin moverse se
        marca como atorada.
      </HelpBox>

      <Card>
        <div className="p-4 flex items-end gap-2 flex-wrap">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ink-500)' }}>RFC</span>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-500)' }} />
              <input
                value={rfcInput}
                onChange={(e) => setRfcInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                placeholder="RFC o parte"
                className={`pl-8 pr-3 py-2 rounded-lg text-[12.5px] font-semibold uppercase w-44`}
                style={selectStyle}
              />
            </div>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ink-500)' }}>Correo</span>
            <input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="correo o parte"
              className={`${inputClass} w-52`}
              style={selectStyle}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ink-500)' }}>Periodo desde</span>
            <input
              type="date"
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              className={inputClass}
              style={selectStyle}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-bold" style={{ color: 'var(--ink-500)' }}>Periodo hasta</span>
            <input
              type="date"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              className={inputClass}
              style={selectStyle}
            />
          </label>
          <button
            type="button"
            onClick={applyFilters}
            disabled={rangeInvalid}
            className="px-4 py-2 rounded-lg text-[12.5px] font-bold disabled:opacity-50"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Buscar
          </button>
          {filtering && (
            <button type="button" onClick={clearFilters} className="px-3 py-2 rounded-lg text-[12.5px] font-bold" style={ghostBtn}>
              Limpiar filtros
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {data && (
              <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                Actualizado {timeFmt.format(new Date(data.generatedAt))}
              </span>
            )}
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold disabled:opacity-50"
              style={ghostBtn}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refrescar
            </button>
            <button
              type="button"
              onClick={onExport}
              disabled={exporting || loading || groups.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-bold disabled:opacity-50"
              style={ghostBtn}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileSpreadsheet size={14} />}
              {exporting ? 'Generando…' : 'Exportar Excel'}
            </button>
          </div>

          {rangeInvalid && (
            <span className="w-full text-[12px] font-semibold" style={{ color: 'var(--danger)' }}>
              La fecha inicial no puede ser mayor que la final.
            </span>
          )}
          {exportError && (
            <span className="w-full text-[12px] font-semibold" style={{ color: 'var(--danger)' }}>
              {exportError}
            </span>
          )}
        </div>
      </Card>

      {error ? (
        <Card>
          <ErrorState message={error} />
        </Card>
      ) : loading && !data ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando descargas…
          </div>
        </Card>
      ) : groups.length === 0 ? (
        <Card>
          <div className="px-5 py-10 text-center text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
            {filtering
              ? 'Ninguna descarga en curso o cerrada en las últimas 24 h coincide con los filtros.'
              : 'No hay descargas en curso ni cerradas en las últimas 24 h.'}
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="px-5 py-4 flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-extrabold mr-1" style={{ color: 'var(--ink-900)' }}>
                {transientTotal} en curso · {finalTotal} cerradas en 24 h
              </span>
              {groups.map((g) => (
                <button
                  key={g.statusId}
                  type="button"
                  onClick={() => jumpTo(g.statusId)}
                  title={`Ir a ${g.statusLabel}`}
                  className="rounded-full transition-transform duration-150 active:scale-[0.97]"
                >
                  <Badge kind={groupKind(g)}>
                    {g.count} {g.statusLabel}
                  </Badge>
                </button>
              ))}
            </div>
          </Card>

          {groups.map((g) => (
            <GroupSection
              key={g.statusId}
              group={g}
              collapsed={collapsed.has(g.statusId)}
              onToggle={() => toggleGroup(g.statusId)}
              sort={sorts[g.statusId] ?? DEFAULT_SORT}
              onSort={(s) => setGroupSort(g.statusId, s)}
            />
          ))}
        </>
      )}
    </div>
  )
}

function GroupSection({
  group,
  collapsed,
  onToggle,
  sort,
  onSort,
}: {
  group: DownloadMonitorGroup
  collapsed: boolean
  onToggle: () => void
  sort: SortState
  onSort: (s: SortState) => void
}) {
  const items = useMemo(() => sortItems(group.items, sort), [group.items, sort])
  const [expanded, setExpanded] = useState<number | null>(null)
  const truncated = group.items.length < group.count

  const clickHeader = (key: SortKey) =>
    onSort(sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' })

  return (
    <Card>
      <div id={`monitor-group-${group.statusId}`} className="scroll-mt-4" />
      <div
        className="px-5 py-3 flex items-center gap-3 flex-wrap"
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--border)' }}
      >
        <button type="button" onClick={onToggle} className="flex items-center gap-2" aria-expanded={!collapsed}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Badge kind={groupKind(group)}>{group.statusId}</Badge>
          <span className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {group.statusLabel}
          </span>
          <span className="text-[13px] font-bold" style={{ color: 'var(--ink-500)' }}>
            {group.count} {group.count === 1 ? 'descarga' : 'descargas'}
            {!group.isTransient && ' · últimas 24 h'}
          </span>
        </button>
        {truncated && (
          <span className="text-[12px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
            Mostrando las {group.items.length} más recientes de {group.count}: filtra o exporta para ver todas.
          </span>
        )}
        {!collapsed && (
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-[11.5px] font-bold" style={{ color: 'var(--ink-500)' }}>Ordenar</span>
            <select
              value={sort.key}
              onChange={(e) => onSort({ key: e.target.value as SortKey, dir: sort.dir })}
              className="px-2 py-1.5 rounded-lg text-[12px] font-semibold"
              style={selectStyle}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onSort({ key: sort.key, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] font-bold"
              style={ghostBtn}
              title={sort.dir === 'asc' ? 'Ascendente' : 'Descendente'}
            >
              {sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              {sort.dir === 'asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="overflow-auto max-h-[70vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="w-8" style={{ background: 'var(--card)' }} />
                <SortTh label="Id" sortKey="id" sort={sort} onClick={clickHeader} />
                <SortTh label="Contribuyente" sortKey="rfc" sort={sort} onClick={clickHeader} />
                <SortTh label="Periodo" sortKey="period" sort={sort} onClick={clickHeader} />
                <Th label="Tipo" />
                <SortTh label="Solicitada / inicio" sortKey="dateRequest" sort={sort} onClick={clickHeader} />
                <SortTh label="En estatus" sortKey="secondsInStatus" sort={sort} onClick={clickHeader} />
                <SortTh label="Duración total" sortKey="totalSeconds" sort={sort} onClick={clickHeader} />
                <SortTh label="Reintentos" sortKey="retryCount" sort={sort} onClick={clickHeader} />
                <Th label="Nota" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <ItemRow
                  key={i.id}
                  item={i}
                  isTransient={group.isTransient}
                  expanded={expanded === i.id}
                  onToggle={() => setExpanded((cur) => (cur === i.id ? null : i.id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function Th({ label }: { label: string }) {
  return (
    <th className="px-4 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)', background: 'var(--card)' }}>
      {label}
    </th>
  )
}

function SortTh({
  label,
  sortKey,
  sort,
  onClick,
}: {
  label: string
  sortKey: SortKey
  sort: SortState
  onClick: (k: SortKey) => void
}) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      className="px-4 py-3 text-left font-extrabold whitespace-nowrap"
      style={{ color: active ? 'var(--ink-900)' : 'var(--ink-700)', background: 'var(--card)' }}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button type="button" onClick={() => onClick(sortKey)} className="inline-flex items-center gap-1">
        {label}
        <Icon size={12} style={{ opacity: active ? 1 : 0.4 }} />
      </button>
    </th>
  )
}

function ItemRow({
  item,
  isTransient,
  expanded,
  onToggle,
}: {
  item: DownloadMonitorItem
  isTransient: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const stale = isTransient && item.secondsInStatus > STALE_SECONDS
  const cell = 'px-4 py-3 align-top'
  return (
    <>
      <tr style={{ borderBottom: expanded ? 'none' : '1px solid var(--border)' }}>
        <td className="pl-3 py-3 align-top">
          <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label="Ver historial" style={{ color: 'var(--ink-500)' }}>
            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className={cell}>
          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{item.id}</code>
        </td>
        <td className={cell}>
          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-900)' }}>{item.rfc ?? '—'}</code>
          {item.taxpayerName && (
            <div className="text-[12px] font-semibold max-w-[220px] truncate" style={{ color: 'var(--ink-700)' }} title={item.taxpayerName}>
              {item.taxpayerName}
            </div>
          )}
          {item.email && (
            <div className="text-[11.5px] max-w-[220px] truncate" style={{ color: 'var(--ink-500)' }} title={item.email}>
              {item.email}
            </div>
          )}
        </td>
        <td className={`${cell} whitespace-nowrap`} style={{ color: 'var(--ink-700)' }}>
          {fmtPeriodDate(item.startDateRequest)}
          <div style={{ color: 'var(--ink-500)' }}>→ {fmtPeriodDate(item.endDateRequest)}</div>
        </td>
        <td className={cell}>
          <div className="flex flex-wrap gap-1 max-w-[170px]">
            <Badge>{item.isIssued ? 'Emitidas' : 'Recibidas'}</Badge>
            <Badge>{item.isInvoice ? 'Facturas' : 'Retenciones'}</Badge>
            {item.downloadKindId !== 1 && <Badge kind="sky">{item.downloadKindName ?? 'Folios'}</Badge>}
          </div>
        </td>
        <td className={`${cell} whitespace-nowrap`} style={{ color: 'var(--ink-700)' }}>
          {fmtDateTime(item.dateRequest)}
          <div style={{ color: 'var(--ink-500)' }} title="Inicio de proceso">
            {item.dateStartProcess ? `▶ ${fmtDateTime(item.dateStartProcess)}` : 'sin iniciar'}
          </div>
        </td>
        <td className={`${cell} whitespace-nowrap`}>
          <span className="font-bold" style={{ color: stale ? 'var(--danger)' : 'var(--ink-900)' }}>
            {fmtDuration(item.secondsInStatus)}
          </span>
          {stale && (
            <div className="mt-1">
              <Badge kind="danger">atorada</Badge>
            </div>
          )}
          <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>desde {fmtDateTime(item.statusAt)}</div>
        </td>
        <td className={`${cell} whitespace-nowrap`} style={{ color: 'var(--ink-700)' }}>
          {fmtDuration(item.totalSeconds)}
          {!item.closedAt && item.totalSeconds != null && (
            <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>y contando</div>
          )}
        </td>
        <td className={cell} style={{ color: item.retryCount > 0 ? 'var(--ink-900)' : 'var(--ink-500)' }}>
          {item.retryCount}
        </td>
        <td className={cell}>
          <div className="text-[12px] max-w-[320px] line-clamp-2 whitespace-pre-line" style={{ color: 'var(--ink-700)' }} title={item.note ?? ''}>
            {item.note?.trim() || '—'}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td />
          <td colSpan={9} className="px-4 pb-4">
            <ItemDetail item={item} />
          </td>
        </tr>
      )}
    </>
  )
}

function ItemDetail({ item }: { item: DownloadMonitorItem }) {
  const [history, setHistory] = useState<DownloadRequestHistory | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getDownloadRequestHistory(item.id)
      if (cancelled) return
      if (res.success) setHistory(res.value)
      else setError(res.error.message)
    })()
    return () => {
      cancelled = true
    }
  }, [item.id])

  const copyExternalId = useCallback(() => {
    if (!item.externalId) return
    void navigator.clipboard.writeText(item.externalId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }, [item.externalId])

  const fact = (label: string, value: ReactNode) => (
    <div className="flex flex-col">
      <span className="text-[11px] font-bold" style={{ color: 'var(--ink-500)' }}>{label}</span>
      <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{value}</span>
    </div>
  )

  return (
    <div className="rounded-2xl p-4 flex flex-col gap-4" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {fact(
          'ExternalId (Fispal)',
          item.externalId ? (
            <button type="button" onClick={copyExternalId} className="inline-flex items-center gap-1.5" title="Copiar">
              <code style={{ ...MONO, fontSize: '11px' }}>{item.externalId}</code>
              <Copy size={12} />
              {copied && <span className="text-[11px]" style={{ color: 'var(--brand-700)' }}>copiado</span>}
            </button>
          ) : (
            '—'
          ),
        )}
        {fact('Origen', item.systemOriginName ?? item.systemOriginId)}
        {fact('Archivos esperados', item.expectedFiles ?? '—')}
        {fact('Fin de proceso', fmtDateTime(item.dateEndProcess))}
        {fact('Reemplazada por', item.downloadRequestRelatedId ?? '—')}
        {fact('Declaración origen', item.declarationId ?? '—')}
      </div>

      {item.note?.trim() && (
        <div>
          <div className="text-[11px] font-bold mb-1" style={{ color: 'var(--ink-500)' }}>Nota completa</div>
          <pre className="text-[12px] whitespace-pre-wrap break-words" style={{ ...MONO, color: 'var(--ink-700)' }}>
            {item.note.trim()}
          </pre>
        </div>
      )}

      <div>
        <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--ink-500)' }}>Historial de estatus</div>
        {error ? (
          <span className="text-[12px]" style={{ color: 'var(--danger)' }}>{error}</span>
        ) : !history ? (
          <span className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={13} className="animate-spin" /> Cargando…
          </span>
        ) : (
          <div className="flex flex-col gap-3">
            <ol className="flex flex-wrap items-center gap-1.5">
              {history.statuses.map((s, idx) => (
                <li key={s.id} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <ChevronRight size={12} style={{ color: 'var(--ink-500)' }} />}
                  <span title={fmtDateTime(s.createAt)}>
                    <Badge kind={groupKind({ statusId: s.statusId, isTransient: ![7, 8, 9, 10, 11, 12].includes(s.statusId) })}>
                      {s.statusLabel}
                      <span style={{ opacity: 0.7, fontWeight: 600 }}>{fmtDateTime(s.createAt)}</span>
                    </Badge>
                  </span>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {fact('Declaraciones ligadas', history.declarationIds.length ? history.declarationIds.join(', ') : '—')}
              {fact('Solicitudes relacionadas', history.relatedRequestIds.length ? history.relatedRequestIds.join(', ') : '—')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
