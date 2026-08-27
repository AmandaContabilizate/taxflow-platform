'use client'

import { ArrowLeft, ArrowRight, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeclarationTaxpayers } from '@/features/declarations/actions/getDeclarationTaxpayers.action'
import { getDeclarationsByTaxpayer } from '@/features/declarations/actions/getDeclarationsByTaxpayer.action'
import { getRegularizationTaxpayers } from '@/features/declarations/actions/getRegularizationTaxpayers.action'
import { getRegularizationsByTaxpayer } from '@/features/declarations/actions/getRegularizationsByTaxpayer.action'
import type {
  PagedDeclarations,
  TaxpayerDeclarationItem,
  TaxpayerGroup,
  TaxpayerRegime,
} from '@/features/declarations/types'
import type { DeclarationSubject } from '@/features/operations/types'
import { declarationStatusBadge } from '../declaraciones/parts'
import { Pagination } from '../clientes/parts'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, ErrorState, HelpBox } from '../ui'
import { numParam, useUrlState } from '../url-state'
import { DeclarationDetail } from './declaration-detail'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const BIMESTRES = [
  'Enero-Febrero', 'Marzo-Abril', 'Mayo-Junio',
  'Julio-Agosto', 'Septiembre-Octubre', 'Noviembre-Diciembre',
]

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

const emptyPage = <T,>(take: number): PagedDeclarations<T> => ({ items: [], total: 0, skip: 0, take })

/** Etiqueta del régimen para los selects: "625 · Plataformas Tecnológicas". */
const regimeLabel = (r: TaxpayerRegime) =>
  [r.satCode, r.name].filter(Boolean).join(' · ') || `Régimen ${r.id}`

const selectStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--ink-700)',
}

/* -------------------------------------------------------------------------- */
/*  Nivel 1 — contribuyentes con compras                                       */
/* -------------------------------------------------------------------------- */

function TaxpayerGroups({
  mode,
  onOpen,
}: {
  mode: Mode
  onOpen: (g: TaxpayerGroup, taxRegimeId: number | null) => void
}) {
  const copy = COPY[mode]
  const kind = KIND_BY_MODE[mode]
  const { params, setParams } = useUrlState()
  // Solo "futuras" ofrece el filtro de periodo próximo; el back de
  // regularizaciones ni siquiera acepta el param.
  const upcomingAvailable = mode === 'future'
  const onlyUpcoming = upcomingAvailable && params.get('proximas') === '1'

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

  useEffect(() => {
    const id = setTimeout(() => {
      setSkip(0)
      setQuery(search.trim())
    }, 350)
    return () => clearTimeout(id)
  }, [search])

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
        onlyUpcoming: onlyUpcoming || undefined,
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
  }, [mode, kind, query, skip, onlyUpcoming])

  const toggleUpcoming = (next: boolean) => {
    setSkip(0)
    setParams({ proximas: next ? '1' : null }, { replace: true })
  }

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>{copy.help}</HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col gap-3">
          <div className="relative">
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

          {upcomingAvailable && (
            <label className="inline-flex items-center gap-2 cursor-pointer select-none self-start">
              <input
                type="checkbox"
                checked={onlyUpcoming}
                onChange={(e) => toggleUpcoming(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'var(--brand-600)' }}
              />
              <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                Solo periodo próximo a trabajar
              </span>
            </label>
          )}
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
                    {['Contribuyente', 'RFC', 'Correo', 'Compradas', 'Último ejercicio', 'Régimen', ''].map((h) => (
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
                        <button
                          type="button"
                          onClick={() => onOpen(g, selectedRegime)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition hover:opacity-90"
                          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                        >
                          Ver declaraciones <ArrowRight size={14} />
                        </button>
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
  const { params, setParams } = useUrlState()

  const [page, setPage] = useState<PagedDeclarations<TaxpayerDeclarationItem>>(emptyPage(TAKE))
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Los filtros viven en la URL para que el refresh no los pierda. `regimen`
  // viaja al back (total y paginación del universo filtrado); periodo y
  // ejercicio siguen siendo client-side sobre la página cargada.
  const periodValueId = numParam(params, 'period') ?? ''
  const year = numParam(params, 'year') ?? ''
  const regimeId = numParam(params, 'regimen') ?? ''
  const onlyUpcoming = mode === 'future' && params.get('proximas') === '1'

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await ACTIONS[mode].rows({
      rfc,
      skip,
      take: TAKE,
      kind,
      taxRegimeId: regimeId || undefined,
      onlyUpcoming: onlyUpcoming || undefined,
    })
    if (res.success) setPage(res.value)
    else {
      setError(res.error.message)
      setPage(emptyPage(TAKE))
    }
    setLoading(false)
  }, [mode, kind, rfc, skip, regimeId, onlyUpcoming])

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
                        <button
                          type="button"
                          onClick={() => onOpen(d)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap"
                          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                        >
                          Abrir <ArrowRight size={14} />
                        </button>
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
}: {
  mode: Mode
  currentUser: CurrentUser
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

  return <TaxpayerGroups mode={mode} onOpen={openGroup} />
}
