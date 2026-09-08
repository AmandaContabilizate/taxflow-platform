'use client'

import { ArrowLeft, ArrowRight, Download, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeclarationStatuses } from '@/features/declarations/actions/getDeclarationStatuses.action'
import { getDeclarationTaxpayers } from '@/features/declarations/actions/getDeclarationTaxpayers.action'
import { getDeclarationsByTaxpayer } from '@/features/declarations/actions/getDeclarationsByTaxpayer.action'
import { getRegularizationTaxpayers } from '@/features/declarations/actions/getRegularizationTaxpayers.action'
import { getRegularizationsByTaxpayer } from '@/features/declarations/actions/getRegularizationsByTaxpayer.action'
import { getEquipoOperaciones } from '@/features/operations/actions/getEquipoOperaciones.action'
import type {
  DeclarationStatusCatalogItem,
  PagedDeclarations,
  TaxpayerDeclarationItem,
  TaxpayerGroup,
  TaxpayerRegime,
} from '@/features/declarations/types'
import type { DeclarationSubject } from '@/features/operations/types'
import { declarationStatusBadge } from '../declaraciones/parts'
import { Pagination } from '../clientes/parts'
import { DISPLAY, MONO } from '../constants'
import { Badge, type BadgeKind, Btn, Card, ErrorState, HelpBox } from '../ui'
import { buildUrl, numParam, useUrlState } from '../url-state'
import type { MouseEvent as ReactMouseEvent } from 'react'
import { DeclarationDetail } from './declaration-detail'
import { ExportReportModal, type StatusOption } from './export-report-modal'

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const BIMESTRES = [
  'Enero-Febrero', 'Marzo-Abril', 'Mayo-Junio',
  'Julio-Agosto', 'Septiembre-Octubre', 'Noviembre-Diciembre',
]

/**
 * CiecState del back (0 sin verificar, 1 válida, 2 inválida). Se pintan los tres por
 * separado: el [Description] del enum colapsa 0 y 2 en "Ciec Inválida" y no son lo mismo.
 */
const CIEC_BADGE: Record<number, { label: string; kind: BadgeKind }> = {
  0: { label: 'Sin verificar', kind: 'amber' },
  1: { label: 'Válida', kind: 'brand' },
  2: { label: 'Inválida', kind: 'danger' },
}

/** 101-112 mensual · 201-206 bimestral · 501 anual. */
function periodLabel(periodValueId: number | null | undefined): string {
  if (periodValueId == null) return '—'
  if (periodValueId >= 101 && periodValueId <= 112) return MESES[periodValueId - 101]
  if (periodValueId >= 201 && periodValueId <= 206) return BIMESTRES[periodValueId - 201]
  if (periodValueId === 501) return 'Anual'
  return `Periodo ${periodValueId}`
}

const PERIOD_OPTIONS: { id: number; label: string }[] = [
  ...MESES.map((m, i) => ({ id: 101 + i, label: m })),
  ...BIMESTRES.map((b, i) => ({ id: 201 + i, label: b })),
  { id: 501, label: 'Anual' },
]

const TAKE = 50

/**
 * Clic izquierdo simple (sin Ctrl/Cmd/Shift/Alt): navega en la SPA sin
 * recargar. Cualquier otro caso (clic central, Ctrl/Cmd+clic, clic derecho)
 * se deja pasar tal cual para que el navegador haga lo suyo (pestaña nueva,
 * menú contextual): por eso el `<a>` necesita un `href` real.
 */
function handlePlainLeftClick(e: ReactMouseEvent, onOpen: () => void) {
  if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
    e.preventDefault()
    onOpen()
  }
}

type Mode = 'future' | 'regularization' | 'all'

type Copy = { help: string; noun: string; nounPlural: string; emptyGroups: string; emptyRows: string }

const COPY: Record<Mode, Copy> = {
  future: {
    help: 'Contribuyentes con planes a futuro ya comprados y en proceso. Elige uno para ver sus declaraciones.',
    noun: 'declaración en proceso',
    nounPlural: 'declaraciones en proceso',
    emptyGroups: 'No hay contribuyentes con planes a futuro comprados.',
    emptyRows: 'Este contribuyente no tiene planes a futuro en proceso con los filtros aplicados.',
  },
  regularization: {
    help: 'Contribuyentes con regularizaciones ya pagadas y en proceso. Elige uno para ver sus declaraciones.',
    noun: 'regularización pagada',
    nounPlural: 'regularizaciones pagadas',
    emptyGroups: 'No hay contribuyentes con regularizaciones compradas.',
    emptyRows: 'Este contribuyente no tiene regularizaciones en proceso con los filtros aplicados.',
  },
  all: {
    help: 'Contribuyentes con declaraciones compradas y en proceso, a futuro o de regularización. Elige uno para ver sus declaraciones.',
    noun: 'declaración en proceso',
    nounPlural: 'declaraciones en proceso',
    emptyGroups: 'No hay contribuyentes con declaraciones compradas.',
    emptyRows: 'Este contribuyente no tiene declaraciones en proceso con los filtros aplicados.',
  },
}

/** `declaration-taxpayers`/`declarations-by-taxpayer` sirven tanto "a futuro" (kind
 * explícito) como "todo" (Centro de operaciones, sin kind = ambas, desde E5.1). */
const ACTIONS = {
  future: { groups: getDeclarationTaxpayers, rows: getDeclarationsByTaxpayer },
  regularization: { groups: getRegularizationTaxpayers, rows: getRegularizationsByTaxpayer },
  all: { groups: getDeclarationTaxpayers, rows: getDeclarationsByTaxpayer },
} as const

/**
 * `kind` que cada modo manda al backend: 1 = regularización, 2 = a futuro,
 * `undefined` = ambas. Desde E5.1 el backend ya NO asume kind=2 por default en
 * estos endpoints, así que "future"/"regularization" deben mandarlo explícito o
 * mostrarían de todo.
 */
const KIND_BY_MODE: Record<Mode, 1 | 2 | undefined> = {
  future: 2,
  regularization: 1,
  all: undefined,
}

const TIPO_LABEL: Record<number, string> = { 1: 'Regularización', 2: 'A futuro' }

/** Filtro por contador, gerencia (E1): mismo claim y patrón que Mis clientes. */
const ASSIGN_PERMISSION = 'AssignAccountant'

/** `DeclarationStatus.InProcess` — Regularizaciones arranca con este estatus preseleccionado (D4). */
const IN_PROCESS_STATUS_ID = 15

const emptyPage = <T,>(take: number): PagedDeclarations<T> => ({ items: [], total: 0, skip: 0, take })

/* -------------------------------------------------------------------------- */
/*  Filtro de periodo (upcomingExact / onlyUpcoming / mes específico)          */
/* -------------------------------------------------------------------------- */

type PeriodMode = 'todos' | 'exact' | 'upcoming' | 'month'

/**
 * D1: ninguna pantalla arrancaba hoy con el `>=` marcado, así que las tres siguen
 * abriendo sin filtro de periodo. "future" no puede arrancar en "exacto": acotar
 * al mes que vence esconde justo las declaraciones futuras que esa pantalla existe
 * para mostrar.
 */
const DEFAULT_PERIOD_MODE: Record<Mode, PeriodMode> = { all: 'todos', future: 'todos', regularization: 'todos' }

/** `onlyUpcoming` (`>=`) no lo acepta regularization-taxpayers; el back lo ignora, así que no se ofrece. */
const UPCOMING_AVAILABLE: Record<Mode, boolean> = { all: true, future: true, regularization: false }

/** Rango razonable para el `<select>` de ejercicio: 6 años atrás, 1 adelante. */
function periodYearOptions(): number[] {
  const y = new Date().getFullYear()
  return Array.from({ length: 8 }, (_, i) => y + 1 - i)
}

interface PeriodFilter {
  periodMode: PeriodMode
  periodYear?: number
  periodMonth?: number
}

/**
 * Único punto donde se lee el filtro de periodo de la URL, para que nivel 1 y
 * nivel 2 (mismo contribuyente expandido) manden siempre el mismo filtro al
 * back. Un año/mes incompleto en modo "month" se trata como si no hubiera
 * modo elegido: nunca se manda el par a medias.
 */
function periodFilterFromParams(mode: Mode, params: URLSearchParams): PeriodFilter {
  const raw = params.get('pmode')
  const periodMode: PeriodMode =
    raw === 'exact' || raw === 'month' || raw === 'todos' || (raw === 'upcoming' && UPCOMING_AVAILABLE[mode])
      ? raw
      : DEFAULT_PERIOD_MODE[mode]
  if (periodMode !== 'month') return { periodMode }
  const periodYear = numParam(params, 'pyear') ?? undefined
  const periodMonth = numParam(params, 'pmonth') ?? undefined
  return periodYear != null && periodMonth != null ? { periodMode, periodYear, periodMonth } : { periodMode }
}

/* -------------------------------------------------------------------------- */
/*  Filtro de estatus (D2-D4)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * D3: subconjunto operativo, en el orden de trabajo del contador. 12 y 13
 * quedan fuera por ser estados del sistema (sembrado/migrado), no del contador.
 */
export const STATUS_ID_WHITELIST = [15, 11, 9, 10, 3, 14, 4, 7, 8] as const

/** D4: Regularizaciones arranca con "En proceso" preseleccionado; las otras dos en "Todos". */
const DEFAULT_STATUS_ID: Record<Mode, number | undefined> = {
  all: undefined,
  future: undefined,
  regularization: IN_PROCESS_STATUS_ID,
}

/** Texto antes de ":" para el `<select>`; la descripción completa si no hay ":". El título lleva la completa. */
function statusOptionLabel(description: string): string {
  const i = description.indexOf(':')
  return i === -1 ? description : description.slice(0, i).trim()
}

interface StatusFilter {
  statusId?: number
  /** Valor del `<select>`: 'todos' o el id como string. */
  selectValue: string
}

function statusFilterFromParams(mode: Mode, params: URLSearchParams): StatusFilter {
  const raw = params.get('estatus')
  if (raw === 'todos') return { statusId: undefined, selectValue: 'todos' }
  if (raw) return { statusId: Number(raw), selectValue: raw }
  const def = DEFAULT_STATUS_ID[mode]
  return { statusId: def, selectValue: def != null ? String(def) : 'todos' }
}

/** Etiqueta del régimen para los selects: "625 · Plataformas Tecnológicas". */
export const regimeLabel = (r: TaxpayerRegime) =>
  [r.satCode, r.name].filter(Boolean).join(' · ') || `Régimen ${r.id}`

export const selectStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--ink-700)',
}

/* -------------------------------------------------------------------------- */
/*  Nivel 1 — contribuyentes con compras                                       */
/* -------------------------------------------------------------------------- */

function TaxpayerGroups({
  mode,
  permissions,
  currentUserId,
  onOpen,
}: {
  mode: Mode
  permissions: string[]
  currentUserId?: string | null
  onOpen: (g: TaxpayerGroup, taxRegimeId: number | null) => void
}) {
  const copy = COPY[mode]
  const kind = KIND_BY_MODE[mode]
  const { params, setParams, pathname } = useUrlState()
  const isManager = permissions.includes(ASSIGN_PERMISSION)
  // '' = todas las carteras; un userId = cartera de ese contador.
  const [contadorFiltro, setContadorFiltro] = useState('')
  // Roster del área (misma fuente que el modal de exportación): no viene en TaxpayerGroup.
  const [contadores, setContadores] = useState<{ id: string; name: string }[]>([])
  const { periodMode, periodYear, periodMonth } = periodFilterFromParams(mode, params)
  const upcomingExact = periodMode === 'exact' ? true : undefined
  const onlyUpcoming = periodMode === 'upcoming' ? true : undefined
  // Valores en bruto del selector mes/año: se muestran aunque el par esté incompleto.
  const periodYearRaw = params.get('pyear') ?? ''
  const periodMonthRaw = params.get('pmonth') ?? ''
  const { statusId, selectValue: statusSelectValue } = statusFilterFromParams(mode, params)

  const [page, setPage] = useState<PagedDeclarations<TaxpayerGroup>>(emptyPage(TAKE))
  const [skip, setSkip] = useState(0)
  const [search, setSearch] = useState('')
  // El buscador pega al back: se deja asentar lo que se escribe antes de pedir.
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Régimen elegido por fila (Id interno). Se pierde al repaginar a propósito:
  // la selección solo vive hasta que se entra al nivel 2.
  const [regimeByTaxpayer, setRegimeByTaxpayer] = useState<Record<number, number>>({})
  const [exportOpen, setExportOpen] = useState(false)
  const [statusCatalog, setStatusCatalog] = useState<DeclarationStatusCatalogItem[]>([])

  useEffect(() => {
    const id = setTimeout(() => {
      setSkip(0)
      setQuery(search.trim())
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  useEffect(() => {
    if (!isManager || contadores.length) return
    const now = new Date()
    void (async () => {
      const res = await getEquipoOperaciones(now.getFullYear(), now.getMonth() + 1)
      if (res.success) setContadores(res.value.miembros.map((m) => ({ id: m.userId, name: m.nombre })))
    })()
  }, [isManager, contadores.length])

  useEffect(() => {
    if (statusCatalog.length) return
    void (async () => {
      const res = await getDeclarationStatuses()
      if (res.success) setStatusCatalog(res.value)
    })()
  }, [statusCatalog.length])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      // Sin `taxRegimeId`: el conteo de la fila es el total del contribuyente y
      // `regimes` trae todos sus regímenes para poblar el selector.
      const res = await ACTIONS[mode].groups({
        search: query || undefined,
        skip,
        take: TAKE,
        kind,
        onlyUpcoming,
        upcomingExact,
        periodYear,
        periodMonth,
        statusId,
        accountantUserId: isManager ? contadorFiltro || undefined : undefined,
      })
      if (cancelled) return
      if (res.success) setPage(res.value)
      else {
        setError(res.error.message)
        setPage(emptyPage(TAKE))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [mode, kind, query, skip, onlyUpcoming, upcomingExact, periodYear, periodMonth, statusId, isManager, contadorFiltro])

  const changeContador = (value: string) => {
    setSkip(0)
    setContadorFiltro(value)
  }

  const changePeriodMode = (next: PeriodMode) => {
    setSkip(0)
    setParams(next === 'month' ? { pmode: 'month' } : { pmode: next, pyear: null, pmonth: null }, { replace: true })
  }

  const changePeriodYear = (value: string) => {
    setSkip(0)
    setParams({ pyear: value || null }, { replace: true })
  }

  const changePeriodMonth = (value: string) => {
    setSkip(0)
    setParams({ pmonth: value || null }, { replace: true })
  }

  const changeStatus = (value: string) => {
    setSkip(0)
    setParams({ estatus: value }, { replace: true })
  }

  const statusOptions = useMemo(() => {
    const byId = new Map(statusCatalog.map((s) => [s.id, s.description]))
    return STATUS_ID_WHITELIST.map((id) => ({ id, description: byId.get(id) ?? `Estatus ${id}` }))
  }, [statusCatalog])

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>{copy.help}</HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
              />
              <input
                type="text"
                placeholder="Buscar por RFC o razón social…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>

            {isManager && (
              <select
                value={contadorFiltro}
                onChange={(e) => changeContador(e.target.value)}
                aria-label="Filtrar por contador"
                className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[230px] outline-none cursor-pointer"
                style={selectStyle}
              >
                <option value="">Todos los contadores</option>
                {currentUserId && <option value={currentUserId}>Mi cartera</option>}
                {contadores
                  .filter((c) => c.id !== currentUserId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={periodMode}
              onChange={(e) => changePeriodMode(e.target.value as PeriodMode)}
              aria-label="Filtrar por periodo"
              className="px-3 py-2.5 rounded-lg text-[12.5px] font-semibold outline-none cursor-pointer"
              style={selectStyle}
            >
              <option value="todos">Todos los periodos</option>
              <option value="exact" title="Solo el periodo que vence este mes">
                Próximo a trabajar
              </option>
              {UPCOMING_AVAILABLE[mode] && (
                <option value="upcoming" title="El próximo a trabajar y todo lo comprado a futuro">
                  Próximo a trabajar en adelante
                </option>
              )}
              <option value="month">Mes específico</option>
            </select>

            {periodMode === 'month' && (
              <>
                <select
                  value={periodMonthRaw}
                  onChange={(e) => changePeriodMonth(e.target.value)}
                  aria-label="Mes del periodo"
                  className="px-3 py-2.5 rounded-lg text-[12.5px] font-semibold outline-none cursor-pointer"
                  style={selectStyle}
                >
                  <option value="">Mes…</option>
                  {MESES.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>

                <select
                  value={periodYearRaw}
                  onChange={(e) => changePeriodYear(e.target.value)}
                  aria-label="Ejercicio del periodo"
                  className="px-3 py-2.5 rounded-lg text-[12.5px] font-semibold outline-none cursor-pointer"
                  style={selectStyle}
                >
                  <option value="">Año…</option>
                  {periodYearOptions().map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </>
            )}

            <select
              value={statusSelectValue}
              onChange={(e) => changeStatus(e.target.value)}
              aria-label="Filtrar por estatus"
              className="px-3 py-2.5 rounded-lg text-[12.5px] font-semibold outline-none cursor-pointer"
              style={selectStyle}
            >
              <option value="todos">Todos los estatus</option>
              {statusOptions.map((s) => (
                <option key={s.id} value={s.id} title={s.description}>
                  {statusOptionLabel(s.description)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${page.total} ${page.total === 1 ? 'contribuyente' : 'contribuyentes'}`}
          </div>
          <Btn kind="ghost" size="sm" onClick={() => setExportOpen(true)}>
            <Download size={14} /> Exportar
          </Btn>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={error} />
          </div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando contribuyentes…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'CIEC', 'Correo', 'Compradas', 'Último ejercicio', 'Régimen', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((g) => {
                    const regimes = g.regimes ?? []
                    // Con un solo régimen no se ofrece filtro: mandar su id escondería
                    // las declaraciones sin régimen asignado del mismo contribuyente.
                    const selectedRegime = regimeByTaxpayer[g.taxpayerId] ?? null
                    return (
                    <tr key={g.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {g.legalName || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{g.rfc}</code>
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const ciec = g.ciecState != null ? CIEC_BADGE[g.ciecState] : undefined
                          return ciec
                            ? <Badge kind={ciec.kind}>{ciec.label}</Badge>
                            : <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>—</span>
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>{g.email || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-bold"
                          style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                        >
                          {g.declarationCount} {g.declarationCount === 1 ? copy.noun : copy.nounPlural}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-500)' }}>
                        {g.lastFiscalYear ?? '—'}
                      </td>
                      <td className="px-5 py-4">
                        {regimes.length === 0 ? (
                          <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>—</span>
                        ) : regimes.length === 1 ? (
                          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                            {regimeLabel(regimes[0])}
                          </span>
                        ) : (
                          <select
                            value={selectedRegime ?? ''}
                            onChange={(e) => {
                              const value = e.target.value
                              setRegimeByTaxpayer((prev) => {
                                const next = { ...prev }
                                if (value) next[g.taxpayerId] = Number(value)
                                else delete next[g.taxpayerId]
                                return next
                              })
                            }}
                            className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold max-w-[220px]"
                            style={selectStyle}
                          >
                            <option value="">Todos los regímenes</option>
                            {regimes.map((r) => (
                              <option key={r.id} value={r.id}>{regimeLabel(r)}</option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={buildUrl({ rfc: g.rfc, decl: null, regimen: selectedRegime }, pathname, params.toString())}
                          onClick={(e) => handlePlainLeftClick(e, () => onOpen(g, selectedRegime))}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition hover:opacity-90"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                          Ver declaraciones <ArrowRight size={14} />
                        </a>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>{copy.emptyGroups}</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
                onNext={() => setSkip((s) => (s + TAKE < page.total ? s + TAKE : s))}
              />
            )}
          </>
        )}
      </Card>

      <ExportReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        kind={kind}
        initial={{ search: query || undefined }}
        statusOptions={[]}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Nivel 2 — declaraciones compradas del contribuyente                        */
/* -------------------------------------------------------------------------- */

function PurchasedTable({
  mode,
  rfc,
  legalName,
  regimes,
  onBack,
  onOpen,
}: {
  mode: Mode
  rfc: string
  legalName: string
  /** Regímenes del contribuyente traídos del nivel 1; vacío si se entró por URL directa. */
  regimes: TaxpayerRegime[]
  onBack: () => void
  onOpen: (d: TaxpayerDeclarationItem) => void
}) {
  const copy = COPY[mode]
  const kind = KIND_BY_MODE[mode]
  const { params, setParams, pathname } = useUrlState()

  const [page, setPage] = useState<PagedDeclarations<TaxpayerDeclarationItem>>(emptyPage(TAKE))
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  // Los filtros viven en la URL para que el refresh no los pierda. `regimen`
  // viaja al back (total y paginación del universo filtrado); periodo y
  // ejercicio siguen siendo client-side sobre la página cargada.
  const periodValueId = numParam(params, 'period') ?? ''
  const year = numParam(params, 'year') ?? ''
  const regimeId = numParam(params, 'regimen') ?? ''
  // Mismo filtro de periodo/estatus que nivel 1: si no, el conteo del grupo no
  // cuadra con la lista expandida (E1). regularization ignora periodo por completo.
  const { periodMode, periodYear, periodMonth } = periodFilterFromParams(mode, params)
  const { statusId } = statusFilterFromParams(mode, params)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await ACTIONS[mode].rows({
      rfc,
      skip,
      take: TAKE,
      kind,
      taxRegimeId: regimeId || undefined,
      onlyUpcoming: periodMode === 'upcoming' ? true : undefined,
      upcomingExact: periodMode === 'exact' ? true : undefined,
      periodYear,
      periodMonth,
      statusId,
    })
    if (res.success) setPage(res.value)
    else {
      setError(res.error.message)
      setPage(emptyPage(TAKE))
    }
    setLoading(false)
  }, [mode, kind, rfc, skip, regimeId, periodMode, periodYear, periodMonth, statusId])

  useEffect(() => {
    void load()
  }, [load])

  // Con el filtro activo la página solo trae ese régimen, así que las opciones
  // salen del nivel 1. Fallback (entrada por URL directa): lo que traiga la página.
  const regimeOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const r of regimes) map.set(r.id, regimeLabel(r))
    for (const d of page.items) {
      if (!map.has(d.taxRegimeId)) map.set(d.taxRegimeId, d.taxRegimeName ?? `Régimen ${d.taxRegimeId}`)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [regimes, page.items])

  const yearOptions = useMemo(
    () => [...new Set(page.items.map((d) => d.fiscalYear))].sort((a, b) => b - a),
    [page.items],
  )

  // Sin catálogo de estatus en el front: se ofrecen los visibles en la página cargada.
  const statusOptions = useMemo(() => {
    const map = new Map<number, string>()
    for (const d of page.items) {
      if (!map.has(d.statusId)) map.set(d.statusId, d.statusLabel ?? d.statusCode ?? `Estatus ${d.statusId}`)
    }
    return [...map.entries()].map(([id, label]) => ({ id, label }))
  }, [page.items])

  // Mes del export es 1-12 calendario; solo aplica si el periodo elegido es mensual.
  const exportMonth =
    typeof periodValueId === 'number' && periodValueId >= 101 && periodValueId <= 112
      ? periodValueId - 100
      : undefined

  const rows = useMemo(
    () =>
      page.items.filter(
        (d) =>
          (!periodValueId || d.periodValueId === periodValueId) &&
          (!year || d.fiscalYear === year),
      ),
    [page.items, periodValueId, year],
  )

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const filtering = Boolean(periodValueId || year || regimeId)

  // El régimen viaja al back: cambiar de régimen reordena el universo, así que
  // la paginación vuelve al inicio.
  const changeRegime = (value: string) => {
    setSkip(0)
    setParams({ regimen: value || null }, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <div className="flex items-center gap-3 flex-wrap shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
        >
          <ArrowLeft size={16} /> Contribuyentes
        </button>
        <div>
          <div className="text-[18px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            {legalName || rfc}
          </div>
          <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
            <code style={MONO}>{rfc}</code> • {page.total} {page.total === 1 ? copy.noun : copy.nounPlural}
          </div>
        </div>
      </div>

      <Card className="shrink-0">
        <div className="p-4 flex items-center gap-2 flex-wrap">
          {(regimeOptions.length > 1 || regimeId !== '') && (
            <select
              value={regimeId}
              onChange={(e) => changeRegime(e.target.value)}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={selectStyle}
            >
              <option value="">Todos los regímenes</option>
              {regimeOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          )}

          <select
            value={periodValueId}
            onChange={(e) => setParams({ period: e.target.value || null }, { replace: true })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          >
            <option value="">Todos los periodos</option>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => setParams({ year: e.target.value || null }, { replace: true })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          >
            <option value="">Todos los ejercicios</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {filtering && (
            <button
              type="button"
              onClick={() => {
                setSkip(0)
                setParams({ period: null, year: null, regimen: null }, { replace: true })
              }}
              className="px-3 py-2 rounded-lg text-[12.5px] font-bold"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${rows.length} ${rows.length === 1 ? 'declaración' : 'declaraciones'}`}
          </div>
          <Btn kind="ghost" size="sm" onClick={() => setExportOpen(true)}>
            <Download size={14} /> Exportar
          </Btn>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={error} />
          </div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando declaraciones…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {[
                      'Ejercicio',
                      'Periodo',
                      'Régimen',
                      ...(mode === 'all' ? ['Tipo'] : []),
                      'Estatus',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((d) => (
                    <tr key={d.declarationId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>{d.fiscalYear}</td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{periodLabel(d.periodValueId)}</td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.taxRegimeName ?? '—'}</td>
                      {mode === 'all' && (
                        <td className="px-5 py-4">
                          {d.declarationKind != null && TIPO_LABEL[d.declarationKind] ? (
                            <span
                              className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap"
                              style={
                                d.declarationKind === 2
                                  ? { background: 'var(--sky-soft)', color: 'var(--sky)' }
                                  : { background: 'var(--violet-soft)', color: 'var(--violet)' }
                              }
                            >
                              {TIPO_LABEL[d.declarationKind]}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--ink-500)' }}>—</span>
                          )}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        {d.statusCode ? (
                          (() => {
                            const badge = declarationStatusBadge(d.statusCode as string, d.statusLabel ?? d.statusCode as string)
                            return <Badge kind={badge.kind}>{badge.label}</Badge>
                          })()
                        ) : (
                          <span
                            className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap"
                            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                          >
                            {d.statusLabel ?? 'En proceso'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <a
                          href={buildUrl({ decl: d.declarationId }, pathname, params.toString())}
                          onClick={(e) => handlePlainLeftClick(e, () => onOpen(d))}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap"
                          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                        >
                          Abrir <ArrowRight size={14} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>{copy.emptyRows}</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
                onNext={() => setSkip((s) => (s + TAKE < page.total ? s + TAKE : s))}
              />
            )}
          </>
        )}
      </Card>

      <ExportReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        kind={kind}
        initial={{
          fiscalYear: year || undefined,
          month: exportMonth,
          taxRegimeId: regimeId || undefined,
          statusId,
        }}
        statusOptions={statusOptions}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Orquestador                                                                */
/* -------------------------------------------------------------------------- */

interface CurrentUser {
  userId: string
  fullName: string
}

/** Subject vacío para entradas por link directo; el detalle lo llena con /general. */
const stubSubject = (declarationId: number, rfc: string | null): DeclarationSubject => ({
  declarationId,
  rfc: rfc ?? '',
  legalName: '',
  periodo: '',
  fiscalYear: 0,
  accountantName: null,
})

export function PurchasedDeclarations({
  mode,
  currentUser,
  permissions = [],
}: {
  mode: Mode
  currentUser: CurrentUser
  permissions?: string[]
}) {
  const { params, setParams } = useUrlState()
  const rfcParam = params.get('rfc')
  const declarationId = numParam(params, 'decl')

  const [legalName, setLegalName] = useState('')
  const [groupRegimes, setGroupRegimes] = useState<TaxpayerRegime[]>([])
  const [subject, setSubject] = useState<DeclarationSubject | null>(null)

  const openGroup = (g: TaxpayerGroup, taxRegimeId: number | null) => {
    setLegalName(g.legalName ?? '')
    setGroupRegimes(g.regimes ?? [])
    setParams({ rfc: g.rfc, decl: null, regimen: taxRegimeId })
  }

  const openDeclaration = (d: TaxpayerDeclarationItem) => {
    setSubject({
      declarationId: d.declarationId,
      rfc: d.rfc,
      legalName,
      periodo: `${periodLabel(d.periodValueId)} ${d.fiscalYear}`,
      fiscalYear: d.fiscalYear,
      accountantName: null,
    })
    setParams({ decl: d.declarationId })
  }

  const backToGroups = () =>
    setParams({ rfc: null, decl: null, period: null, year: null, regimen: null })

  if (declarationId) {
    const current = subject?.declarationId === declarationId ? subject : stubSubject(declarationId, rfcParam)
    return (
      <DeclarationDetail
        declaration={current}
        onBack={() => setParams({ decl: null })}
        currentUser={currentUser}
      />
    )
  }

  if (rfcParam) {
    return (
      <PurchasedTable
        mode={mode}
        rfc={rfcParam}
        legalName={legalName}
        regimes={groupRegimes}
        onBack={backToGroups}
        onOpen={openDeclaration}
      />
    )
  }

  return (
    <TaxpayerGroups
      mode={mode}
      permissions={permissions}
      currentUserId={currentUser.userId}
      onOpen={openGroup}
    />
  )
}
