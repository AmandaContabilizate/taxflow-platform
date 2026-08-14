'use client'

import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeclarations } from '@/features/operations/actions/getDeclarations.action'
import type { DeclarationListItem, DeclarationSubject, Paged } from '@/features/operations/types'
import { getTaxpayers } from '@/features/taxpayers/actions/getTaxpayers.action'
import type { TaxpayerListItem, TaxpayerRegimen } from '@/features/taxpayers/types'
import { Pagination, TaxpayerFilters, usePagedList, useRegimenOptions } from '../clientes/parts'
import { DISPLAY, MONO } from '../constants'
import { Card, HelpBox } from '../ui'
import { DeclarationDetail } from './declaration-detail'

/* -------------------------------------------------------------------------- */
/*  Catálogo de periodos (Catalogs.Period)                                     */
/* -------------------------------------------------------------------------- */

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

/** "PorPresentar" → "Por presentar". */
function humanizeStatus(code: string): string {
  if (!code) return '—'
  const spaced = code.replace(/([a-z\d])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

const money = (v: string | number | null) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

const shortDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* -------------------------------------------------------------------------- */
/*  Selección: contribuyente + régimen                                         */
/* -------------------------------------------------------------------------- */

interface Selection {
  taxpayer: TaxpayerListItem
  regimen: TaxpayerRegimen
}

/**
 * Con un solo régimen no hay nada que elegir: se muestra fijo. Con varios, un
 * select con el nombre completo (el código SAT solo no le dice nada a nadie).
 */
function RegimenPicker({
  regimenes,
  selectedId,
  onSelect,
}: {
  regimenes: TaxpayerRegimen[]
  selectedId: number | null
  onSelect: (r: TaxpayerRegimen) => void
}) {
  if (!regimenes || regimenes.length === 0) {
    return (
      <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
        Sin régimen activo
      </span>
    )
  }

  if (regimenes.length === 1) {
    const r = regimenes[0]
    return (
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          {r.satCode}
        </span>
        <span className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{r.name}</span>
      </div>
    )
  }

  return (
    <select
      value={selectedId ?? ''}
      onChange={(e) => {
        const found = regimenes.find((r) => r.id === Number(e.target.value))
        if (found) onSelect(found)
      }}
      className="w-full max-w-[300px] px-3 py-2 rounded-lg text-[12.5px] font-semibold"
      style={{
        background: 'var(--input)',
        border: `1px solid ${selectedId ? 'var(--border)' : 'var(--border-strong)'}`,
        color: selectedId ? 'var(--ink-900)' : 'var(--ink-500)',
      }}
    >
      <option value="">Elige un régimen…</option>
      {regimenes.map((r) => (
        <option key={r.id} value={r.id}>
          {r.satCode} · {r.name}
        </option>
      ))}
    </select>
  )
}

function TaxpayerPicker({ onOpen }: { onOpen: (s: Selection) => void }) {
  const list = usePagedList<TaxpayerListItem>(getTaxpayers, 50)
  const regimenOptions = useRegimenOptions(list.items)
  // Régimen elegido por contribuyente (taxpayerId → regimeId).
  const [chosen, setChosen] = useState<Record<number, TaxpayerRegimen>>({})

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Elige un contribuyente y el <strong>régimen</strong> del que quieres revisar sus declaraciones. Si solo tiene
        uno, ya viene seleccionado.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4">
          <TaxpayerFilters
            rfc={list.rfc}
            onRfcChange={list.setRfc}
            regimeId={list.regimeId}
            onRegimeChange={list.setRegimeId}
            regimenes={regimenOptions}
            placeholder="Buscar por RFC…"
          />
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} contribuyentes`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{list.error}</div>
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando contribuyentes…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Correo', 'Régimen', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((t) => {
                    const only = t.regimenes?.length === 1 ? t.regimenes[0] : undefined
                    const selected = chosen[t.taxpayerId] ?? only
                    return (
                      <tr key={t.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-5 py-4">
                          <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{t.legalName}</div>
                        </td>
                        <td className="px-5 py-4">
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{t.rfc}</code>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm" style={{ color: 'var(--ink-700)' }}>{t.email}</span>
                        </td>
                        <td className="px-5 py-4">
                          <RegimenPicker
                            regimenes={t.regimenes}
                            selectedId={selected?.id ?? null}
                            onSelect={(r) => setChosen((prev) => ({ ...prev, [t.taxpayerId]: r }))}
                          />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={!selected}
                            title={selected ? undefined : 'Elige un régimen primero'}
                            onClick={() => selected && onOpen({ taxpayer: t, regimen: selected })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap transition disabled:opacity-40 disabled:cursor-not-allowed"
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

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No se encontraron contribuyentes</div>
              </div>
            ) : (
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                total={list.total}
                skip={list.skip}
                take={list.take}
                itemCount={list.items.length}
                onPrev={list.prevPage}
                onNext={list.nextPage}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Declaraciones del contribuyente + régimen                                  */
/* -------------------------------------------------------------------------- */

const TAKE = 50

function DeclarationsTable({
  selection,
  onBack,
  onOpen,
}: {
  selection: Selection
  onBack: () => void
  onOpen: (d: DeclarationListItem) => void
}) {
  const { taxpayer, regimen } = selection

  const [page, setPage] = useState<Paged<DeclarationListItem>>({ items: [], total: 0, skip: 0, take: TAKE })
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodValueId, setPeriodValueId] = useState<number | ''>('')
  const [statusId, setStatusId] = useState<number | ''>('')
  const [year, setYear] = useState<number | ''>('')

  // Los catálogos de estatus/ejercicio no tienen endpoint propio: se acumulan
  // con lo que va llegando para no perder la opción activa al filtrar.
  const [seenStatuses, setSeenStatuses] = useState<Map<number, string>>(new Map())
  const [seenYears, setSeenYears] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getDeclarations({
      rfc: taxpayer.rfc,
      regimeId: regimen.id,
      periodValueId: periodValueId || undefined,
      statusId: statusId || undefined,
      year: year || undefined,
      skip,
      take: TAKE,
    })
    if (res.success) {
      setPage(res.value)
      setSeenStatuses((prev) => {
        const next = new Map(prev)
        for (const d of res.value.items) next.set(d.statusId, d.statusCode)
        return next
      })
      setSeenYears((prev) => {
        const next = new Set(prev)
        for (const d of res.value.items) next.add(d.fiscalYear)
        return next
      })
    } else {
      setError(res.error.message)
      setPage({ items: [], total: 0, skip: 0, take: TAKE })
    }
    setLoading(false)
  }, [taxpayer.rfc, regimen.id, periodValueId, statusId, year, skip])

  useEffect(() => {
    void load()
  }, [load])

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const currentPage = Math.floor(skip / TAKE) + 1

  const statusOptions = useMemo(
    () => [...seenStatuses.entries()].sort((a, b) => a[0] - b[0]),
    [seenStatuses],
  )
  const yearOptions = useMemo(() => [...seenYears].sort((a, b) => b - a), [seenYears])

  const resetTo = (fn: () => void) => {
    setSkip(0)
    fn()
  }

  const selectStyle = {
    background: 'var(--input)',
    border: '1px solid var(--border)',
    color: 'var(--ink-700)',
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      {/* Encabezado del contribuyente */}
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
            {taxpayer.legalName}
          </div>
          <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
            <code style={MONO}>{taxpayer.rfc}</code> • {regimen.satCode} {regimen.name}
          </div>
        </div>
      </div>

      {/* Filtros */}
      <Card className="shrink-0">
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <select
            value={periodValueId}
            onChange={(e) => resetTo(() => setPeriodValueId(e.target.value ? Number(e.target.value) : ''))}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          >
            <option value="">Todos los periodos</option>
            {PERIOD_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          <select
            value={statusId}
            onChange={(e) => resetTo(() => setStatusId(e.target.value ? Number(e.target.value) : ''))}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          >
            <option value="">Todos los estatus</option>
            {statusOptions.map(([id, code]) => (
              <option key={id} value={id}>{humanizeStatus(code)}</option>
            ))}
          </select>

          <select
            value={year}
            onChange={(e) => resetTo(() => setYear(e.target.value ? Number(e.target.value) : ''))}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
          >
            <option value="">Todos los ejercicios</option>
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {(periodValueId || statusId || year) && (
            <button
              type="button"
              onClick={() => resetTo(() => { setPeriodValueId(''); setStatusId(''); setYear('') })}
              className="px-3 py-2 rounded-lg text-[12.5px] font-bold"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </Card>

      {/* Tabla */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${page.total} declaraciones`}
          </div>
        </div>

        {error ? (
          <div className="flex-1 px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
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
                    {['Ejercicio', 'Periodo', 'Estatus', 'Total', 'Asignada', 'Presentada', ''].map((h) => (
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
                  {page.items.map((d) => (
                    <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>{d.fiscalYear}</td>
                      <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{periodLabel(d.periodValueId)}</td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap"
                          style={
                            d.submittedAt
                              ? { background: 'var(--brand-50)', color: 'var(--brand-700)' }
                              : { background: 'var(--amber-soft)', color: '#7B5312' }
                          }
                        >
                          {humanizeStatus(d.statusCode)}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {money(d.totalDeclaration)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{shortDate(d.assignedAt)}</td>
                      <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{shortDate(d.submittedAt)}</td>
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

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>
                  No hay declaraciones para este régimen con los filtros aplicados
                </div>
              </div>
            ) : (
              <Pagination
                page={currentPage}
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
/*  Orquestador de los tres pasos                                              */
/* -------------------------------------------------------------------------- */

interface CurrentUser {
  userId: string
  fullName: string
}

export function DeclarationsByTaxpayer({ currentUser }: { currentUser: CurrentUser }) {
  const [selection, setSelection] = useState<Selection | null>(null)
  const [subject, setSubject] = useState<DeclarationSubject | null>(null)

  if (subject) {
    return (
      <DeclarationDetail
        declaration={subject}
        onBack={() => setSubject(null)}
        viewerRole="contador"
        currentUser={currentUser}
      />
    )
  }

  if (selection) {
    return (
      <DeclarationsTable
        selection={selection}
        onBack={() => setSelection(null)}
        onOpen={(d) =>
          setSubject({
            declarationId: d.id,
            rfc: d.rfc,
            legalName: selection.taxpayer.legalName,
            periodo: `${periodLabel(d.periodValueId)} ${d.fiscalYear}`,
            fiscalYear: d.fiscalYear,
            accountantName: null,
          })
        }
      />
    )
  }

  return <TaxpayerPicker onOpen={setSelection} />
}
