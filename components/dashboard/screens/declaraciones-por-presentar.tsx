'use client'

import { ArrowRight, ChevronUp, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getDeclarationsByTaxpayer } from '@/features/declarations/actions/getDeclarationsByTaxpayer.action'
import type { PagedDeclarations, TaxpayerDeclarationItem } from '@/features/declarations/types'
import type { DeclarationSubject } from '@/features/operations/types'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { declarationStatusBadge } from '../declaraciones/parts'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { DeclarationDetail } from '../operaciones/declaration-detail'
import { FORCE_POST_CLAIM, ForcePostButton, PostingReadinessIcon } from '../operaciones/posting-readiness'
import { MESES, TIPO_LABEL, periodLabel, selectStyle } from '../operaciones/purchased-declarations'
import { useHasPermission } from '../permissions'
import { buildUrl, numParam, useUrlState } from '../url-state'
import { Badge, Card, ErrorState, HelpBox, NoAccessState } from '../ui'

const TAKE = 50
const READY_TO_SUBMIT = 11

type Semaforo = 'blocked' | 'warning' | 'ok'

/**
 * Niveles del semáforo de posteo, en el orden en que se muestran; `kind` es el color del chip y
 * `titulo` es cómo se lee en el encabezado ("N declaraciones que no se pueden presentar").
 */
const SEMAFORO: { value: Semaforo; label: string; titulo: string; kind: 'danger' | 'amber' | 'brand' }[] = [
  { value: 'blocked', label: 'no se pueden presentar', titulo: 'que no se pueden presentar', kind: 'danger' },
  { value: 'warning', label: 'requieren autorización', titulo: 'que requieren autorización', kind: 'amber' },
  { value: 'ok', label: 'listas para el robot', titulo: 'listas para el robot', kind: 'brand' },
]

const esSemaforo = (v: string | null): v is Semaforo => v === 'blocked' || v === 'warning' || v === 'ok'

/** Users.Taxpayers.PasswordState (enum CiecState). */
const CIEC: { value: 0 | 1 | 2; label: string }[] = [
  { value: 2, label: 'CIEC inválida' },
  { value: 1, label: 'CIEC válida' },
  { value: 0, label: 'CIEC sin verificar' },
]

type Presentacion = 'normal' | 'complementaria'
const esPresentacion = (v: string | null): v is Presentacion => v === 'normal' || v === 'complementaria'
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

interface CurrentUser {
  userId: string
  fullName: string
}

const emptyPage: PagedDeclarations<TaxpayerDeclarationItem> = { items: [], total: 0, skip: 0, take: TAKE }

/** Subject vacío para entrar por link directo (`?decl=`); el detalle lo llena con /general. */
const stubSubject = (declarationId: number, rfc: string | null): DeclarationSubject => ({
  declarationId,
  rfc: rfc ?? '',
  legalName: '',
  periodo: '',
  fiscalYear: 0,
  accountantName: null,
})

const RFC_PATTERN = /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/

/**
 * Concentrado de TODAS las declaraciones en PorPresentar (11), de todos los contribuyentes, para que
 * el Gerente de Operaciones no tenga que ir de cliente en cliente. Cada fila trae el semáforo de
 * posteo (⚠️ rojo: no se puede presentar; ⚠️ ámbar: el robot no la toma, pero se puede autorizar) y
 * el botón "Enviar" para autorizarla o adelantarla antes del robot.
 *
 * Usa el mismo endpoint que el nivel 2 del Centro de operaciones (`declarations-by-taxpayer`) sin
 * `rfc`, filtrado a estatus 11, así que las advertencias son las mismas en las dos pantallas.
 */
export function DeclaracionesPorPresentarScreen({ currentUser }: { currentUser: CurrentUser }) {
  const { params, setParams, pathname } = useUrlState()
  const declarationId = numParam(params, 'decl')
  const rfcParam = params.get('rfc')
  const skip = numParam(params, 'skip') ?? 0
  const regimeId = numParam(params, 'regimen')
  const year = numParam(params, 'year')
  const month = numParam(params, 'month')
  // Semáforo de posteo para dar seguimiento: el back evalúa todas las filas y pagina en memoria.
  const estadoParam = params.get('estado')
  const estado: Semaforo | null = esSemaforo(estadoParam) ? estadoParam : null
  // CIEC del contribuyente (0/1/2) y tipo de presentación; los dos se filtran en SQL.
  const ciecParam = numParam(params, 'ciec')
  const ciec: 0 | 1 | 2 | null = ciecParam === 0 || ciecParam === 1 || ciecParam === 2 ? ciecParam : null
  const presentacionParam = params.get('presentacion')
  const presentacion: Presentacion | null = esPresentacion(presentacionParam) ? presentacionParam : null

  const [page, setPage] = useState(emptyPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState<DeclarationSubject | null>(null)
  const [regimes, setRegimes] = useState<TaxRegime[]>([])
  const [rfcInput, setRfcInput] = useState(rfcParam ?? '')
  // Descripción + filtros plegables para darle alto a la tabla; cada visita arranca desplegado.
  const [headerOpen, setHeaderOpen] = useState(true)
  // El menú ya la oculta sin el claim, pero la URL directa (`?s=declaraciones-por-presentar`) no:
  // sin esto cualquier empleado con sesión vería todas las PorPresentar de todos los contribuyentes.
  const canView = useHasPermission(FORCE_POST_CLAIM)

  useEffect(() => {
    if (!canView) return
    void (async () => {
      const res = await getTaxRegimes()
      if (res.success) setRegimes(res.value)
    })()
  }, [canView])

  useEffect(() => {
    if (!canView || declarationId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDeclarationsByTaxpayer({
        statusId: READY_TO_SUBMIT,
        rfc: rfcParam && RFC_PATTERN.test(rfcParam) ? rfcParam : undefined,
        taxRegimeId: regimeId ?? undefined,
        // El back exige año y mes juntos.
        periodYear: year && month ? year : undefined,
        periodMonth: year && month ? month : undefined,
        readiness: estado ?? undefined,
        ciecState: ciec ?? undefined,
        presentacion: presentacion ?? undefined,
        skip,
        take: TAKE,
      })
      if (cancelled) return
      if (res.success) setPage(res.value)
      else {
        setError(res.error.message)
        setPage(emptyPage)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [canView, declarationId, rfcParam, regimeId, year, month, estado, ciec, presentacion, skip])

  const setEstado = (value: Semaforo | null) => setParams({ estado: value, skip: null }, { replace: true })

  const counts = useMemo(() => {
    const c = { blocked: 0, warning: 0, ok: 0 }
    for (const d of page.items) c[d.postingReadiness?.level ?? 'ok']++
    return c
  }, [page.items])

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear()
    return [now, now - 1, now - 2, now - 3, now - 4]
  }, [])

  const openDeclaration = (d: TaxpayerDeclarationItem) => {
    setSubject({
      declarationId: d.declarationId,
      rfc: d.rfc,
      legalName: d.legalName ?? '',
      periodo: periodLabel(d.periodValueId),
      fiscalYear: d.fiscalYear,
      accountantName: null,
    })
    setParams({ decl: d.declarationId, rfc: d.rfc })
  }

  const applyRfc = () => {
    const value = rfcInput.trim().toUpperCase()
    setParams({ rfc: value || null, skip: null }, { replace: true })
  }

  if (!canView) {
    return (
      <Card>
        <NoAccessState />
      </Card>
    )
  }

  if (declarationId) {
    const current = subject?.declarationId === declarationId ? subject : stubSubject(declarationId, rfcParam)
    // `key`: al saltar de una declaración a otra (p. ej. a su complementaria) el detalle se
    // monta de cero; si no, arrastraba el estado y el recálculo de la anterior.
    return (
      <DeclarationDetail
        key={current.declarationId}
        declaration={current}
        onBack={() => setParams({ decl: null })}
        currentUser={currentUser}
      />
    )
  }

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const rfcInvalid = rfcParam != null && rfcParam !== '' && !RFC_PATTERN.test(rfcParam)
  const activeFilters = [rfcParam, regimeId, year || month, estado, ciec != null, presentacion].filter(Boolean).length
  const filtering = activeFilters > 0

  return (
    // Alto fijo (tabla con scroll propio) solo en pantallas anchas y altas; en móvil o con poco alto la
    // página fluye y la tabla conserva un mínimo, si no los filtros envueltos la dejaban en 0 px.
    <div className="flex flex-col max-w-full lg:[@media(min-height:640px)]:h-[calc(100dvh-8.5rem)]">
      <div
        id="dpp-header"
        className="grid shrink-0 transition-[grid-template-rows,margin] duration-200 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: headerOpen ? '1fr' : '0fr', marginBottom: headerOpen ? '1.25rem' : 0 }}
        aria-hidden={!headerOpen}
        inert={!headerOpen}
      >
        <div className="min-h-0 overflow-hidden flex flex-col gap-5">
          <HelpBox>
            Todas las declaraciones listas para presentar. Las que tienen ⚠️ ámbar no las tomará el robot
            (sin pago, descargas incompletas…), pero puedes autorizarlas con &quot;Enviar&quot;. Las de ⚠️
            rojo no se pueden presentar hasta corregir lo que indica el aviso. &quot;Enviar&quot; en una sin
            aviso la manda a la cola sin esperar al robot. En todos los casos queda registrado quién la autorizó.
          </HelpBox>
    
          <Card className="shrink-0">
            <div className="p-4 flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-500)' }} />
                <input
                  value={rfcInput}
                  onChange={(e) => setRfcInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyRfc()}
                  onBlur={applyRfc}
                  placeholder="RFC completo"
                  className="pl-8 pr-3 py-2 rounded-lg text-[12.5px] font-semibold uppercase"
                  style={selectStyle}
                />
              </div>
    
              <select
                value={regimeId ?? ''}
                onChange={(e) => setParams({ regimen: e.target.value || null, skip: null }, { replace: true })}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
              >
                <option value="">Todos los regímenes</option>
                {regimes.map((r) => (
                  <option key={r.id} value={r.id}>{[r.satCode, r.name].filter(Boolean).join(' · ')}</option>
                ))}
              </select>
    
              <select
                value={year ?? ''}
                onChange={(e) => setParams({ year: e.target.value || null, skip: null }, { replace: true })}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
              >
                <option value="">Todos los ejercicios</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
    
              <select
                value={month ?? ''}
                onChange={(e) => setParams({ month: e.target.value || null, skip: null }, { replace: true })}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
              >
                <option value="">Todos los meses</option>
                {MESES.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
    
              <select
                value={estado ?? ''}
                onChange={(e) => setEstado(esSemaforo(e.target.value) ? e.target.value : null)}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
                aria-label="Semáforo"
              >
                <option value="">Todos los semáforos</option>
                {SEMAFORO.map((s) => (
                  <option key={s.value} value={s.value}>{capitalize(s.label)}</option>
                ))}
              </select>
    
              <select
                value={ciec ?? ''}
                onChange={(e) => setParams({ ciec: e.target.value || null, skip: null }, { replace: true })}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
                aria-label="CIEC"
              >
                <option value="">Cualquier CIEC</option>
                {CIEC.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
    
              <select
                value={presentacion ?? ''}
                onChange={(e) => setParams({ presentacion: e.target.value || null, skip: null }, { replace: true })}
                className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
                style={selectStyle}
                aria-label="Presentación"
              >
                <option value="">Normales y complementarias</option>
                <option value="normal">Solo normales</option>
                <option value="complementaria">Solo complementarias</option>
              </select>
    
              {filtering && (
                <button
                  type="button"
                  onClick={() => {
                    setRfcInput('')
                    setParams(
                      { rfc: null, regimen: null, year: null, month: null, estado: null, ciec: null, presentacion: null, skip: null },
                      { replace: true },
                    )
                  }}
                  className="px-3 py-2 rounded-lg text-[12.5px] font-bold"
                  style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
                >
                  Limpiar filtros
                </button>
              )}
    
              {rfcInvalid && (
                <span className="text-[12px] font-semibold" style={{ color: 'var(--danger)' }}>
                  Escribe el RFC completo (12 o 13 caracteres).
                </span>
              )}
              {(year != null) !== (month != null) && (
                <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  Elige ejercicio y mes para filtrar por periodo.
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      <Card className="flex-1 min-h-[70dvh] lg:[@media(min-height:640px)]:min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setHeaderOpen((o) => !o)}
              aria-expanded={headerOpen}
              aria-controls="dpp-header"
              title={headerOpen ? 'Ocultar descripción y filtros' : 'Mostrar descripción y filtros'}
              className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              <ChevronUp
                size={16}
                className="transition-transform duration-200 motion-reduce:transition-none"
                style={{ transform: headerOpen ? 'none' : 'rotate(180deg)' }}
              />
            </button>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {loading
                ? 'Cargando…'
                : `${page.total} ${page.total === 1 ? 'declaración' : 'declaraciones'} ${
                    estado ? SEMAFORO.find((s) => s.value === estado)!.titulo : 'por presentar'
                  }`}
            </div>
            {/* Plegado, que no se olvide que la lista está filtrada. */}
            {!headerOpen && filtering && (
              <button type="button" onClick={() => setHeaderOpen(true)} title="Mostrar filtros">
                <Badge kind="sky">
                  {activeFilters} {activeFilters === 1 ? 'filtro activo' : 'filtros activos'}
                </Badge>
              </button>
            )}
          </div>
          {!loading && (page.items.length > 0 || estado) && (
            <div className="flex items-center gap-2 text-[12px] font-bold">
              {/* Chips clicables: filtran por semáforo (mismo efecto que el select). Con filtro activo
                  solo se conoce el total del nivel elegido; los otros dos se muestran sin número. */}
              {SEMAFORO.map((s) => {
                const activo = estado === s.value
                const atenuado = estado != null && !activo
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={activo}
                    title={activo ? 'Quitar filtro' : `Ver solo las que ${s.label}`}
                    onClick={() => setEstado(activo ? null : s.value)}
                    className="rounded-full transition-[transform,opacity,box-shadow] duration-150 ease-out active:scale-[0.97]"
                    style={{
                      opacity: atenuado ? 0.5 : 1,
                      boxShadow: activo ? '0 0 0 2px var(--card), 0 0 0 4px var(--ring)' : 'none',
                    }}
                  >
                    <Badge kind={s.kind}>
                      {activo ? page.total : estado == null ? counts[s.value] : null}
                      {activo || estado == null ? ' ' : ''}
                      {s.label}
                    </Badge>
                  </button>
                )
              })}
              <span style={{ color: 'var(--ink-500)' }}>{estado ? '(en total)' : '(en esta página)'}</span>
            </div>
          )}
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
              <table className="w-full min-w-[900px] text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Ejercicio', 'Periodo', 'Régimen', 'Tipo', 'Presentación', 'Estatus', ''].map((h) => (
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
                  {page.items.map((d) => {
                    const badge = declarationStatusBadge(
                      (d.statusCode ?? '') as string,
                      d.statusLabel ?? (d.statusCode as string) ?? 'Por presentar',
                    )
                    return (
                      <tr key={d.declarationId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {d.legalName || '—'}
                        </td>
                        <td className="px-5 py-4">
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{d.rfc}</code>
                          {/* La CIEC válida es lo normal; solo se marca cuando no lo es. */}
                          {d.ciecState === 2 && (
                            <div className="mt-1"><Badge kind="coral">CIEC inválida</Badge></div>
                          )}
                          {d.ciecState === 0 && (
                            <div className="mt-1"><Badge>CIEC sin verificar</Badge></div>
                          )}
                        </td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.fiscalYear}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{periodLabel(d.periodValueId)}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.taxRegimeName ?? '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                          {d.declarationKind != null ? TIPO_LABEL[d.declarationKind] ?? '—' : '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                          {(d.complementNumber ?? 0) > 0 ? (
                            <Badge kind="sky">Complementaria {d.complementNumber}</Badge>
                          ) : (
                            'Normal'
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <Badge kind={badge.kind}>{badge.label}</Badge>
                          <PostingReadinessIcon readiness={d.postingReadiness} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-start justify-end gap-2">
                            <ForcePostButton
                              declarationId={d.declarationId}
                              statusId={d.statusId}
                              readiness={d.postingReadiness}
                            />
                            <a
                              href={buildUrl({ decl: d.declarationId, rfc: d.rfc }, pathname, params.toString())}
                              onClick={(e) => {
                                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return
                                e.preventDefault()
                                openDeclaration(d)
                              }}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap"
                              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                            >
                              Abrir <ArrowRight size={14} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay declaraciones por presentar.</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setParams({ skip: Math.max(0, skip - TAKE) || null })}
                onNext={() => setParams({ skip: skip + TAKE < page.total ? skip + TAKE : skip })}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}
