'use client'

import { ArrowRight, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getDeclarationsByTaxpayer } from '@/features/declarations/actions/getDeclarationsByTaxpayer.action'
import type { PagedDeclarations, TaxpayerDeclarationItem } from '@/features/declarations/types'
import type { DeclarationSubject } from '@/features/operations/types'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { declarationStatusBadge } from '../declaraciones/parts'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { DeclarationDetail } from '../operaciones/declaration-detail'
import { ForcePostButton, PostingReadinessIcon } from '../operaciones/posting-readiness'
import { MESES, TIPO_LABEL, periodLabel, selectStyle } from '../operaciones/purchased-declarations'
import { buildUrl, numParam, useUrlState } from '../url-state'
import { Badge, Card, ErrorState, HelpBox } from '../ui'

const TAKE = 50
const READY_TO_SUBMIT = 11

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

  const [page, setPage] = useState(emptyPage)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subject, setSubject] = useState<DeclarationSubject | null>(null)
  const [regimes, setRegimes] = useState<TaxRegime[]>([])
  const [rfcInput, setRfcInput] = useState(rfcParam ?? '')

  useEffect(() => {
    void (async () => {
      const res = await getTaxRegimes()
      if (res.success) setRegimes(res.value)
    })()
  }, [])

  useEffect(() => {
    if (declarationId) return
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
  }, [declarationId, rfcParam, regimeId, year, month, skip])

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

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const rfcInvalid = rfcParam != null && rfcParam !== '' && !RFC_PATTERN.test(rfcParam)
  const filtering = Boolean(rfcParam || regimeId || year || month)

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
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

          {filtering && (
            <button
              type="button"
              onClick={() => {
                setRfcInput('')
                setParams({ rfc: null, regimen: null, year: null, month: null, skip: null }, { replace: true })
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

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading
              ? 'Cargando…'
              : `${page.total} ${page.total === 1 ? 'declaración por presentar' : 'declaraciones por presentar'}`}
          </div>
          {!loading && page.items.length > 0 && (
            <div className="flex items-center gap-2 text-[12px] font-bold">
              <Badge kind="danger">{counts.blocked} no se pueden presentar</Badge>
              <Badge kind="amber">{counts.warning} requieren autorización</Badge>
              <Badge kind="brand">{counts.ok} listas para el robot</Badge>
              <span style={{ color: 'var(--ink-500)' }}>(en esta página)</span>
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
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Contribuyente', 'RFC', 'Ejercicio', 'Periodo', 'Régimen', 'Tipo', 'Estatus', ''].map((h) => (
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
                        </td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.fiscalYear}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{periodLabel(d.periodValueId)}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.taxRegimeName ?? '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                          {d.declarationKind != null ? TIPO_LABEL[d.declarationKind] ?? '—' : '—'}
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
