'use client'

import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPendingActivityAssignments } from '@/features/taxpayers/actions/regimeActivities.action'
import type { PendingActivityAssignment, PendingActivityKind } from '@/features/taxpayers/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import { Pagination } from '../clientes/parts'
import { ActividadesModal } from '../clientes/actividades-modal'

const PAGE_SIZE = 25

/** Mismo claim que abre el modal de actividades en Mis clientes. */
const ACTIVITIES_PERMISSION = 'AccountingManager.GetRegimeActivities'

const KINDS: { value: PendingActivityKind; label: string }[] = [
  { value: 0, label: 'Todos' },
  { value: 1, label: 'Regímenes de baja sin actividades' },
  { value: 2, label: 'Actividades de la constancia' },
  { value: 3, label: 'Actividades del historial SAT' },
]

function usePendingList() {
  const [items, setItems] = useState<PendingActivityAssignment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [kind, setKindState] = useState<PendingActivityKind>(0)
  const [rfc, setRfcState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const handle = setTimeout(async () => {
      const res = await getPendingActivityAssignments({
        rfc: rfc.trim() || undefined,
        kind,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      })
      if (cancelled) return
      if (res.success) {
        setItems(res.value.items)
        setTotal(res.value.total)
      } else {
        setError(res.error.message)
        setItems([])
        setTotal(0)
      }
      setLoading(false)
    }, rfc.trim() ? 350 : 0)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [kind, rfc, page, reloadKey])

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    error,
    kind,
    setKind: (value: PendingActivityKind) => {
      setPage(1)
      setKindState(value)
    },
    rfc,
    setRfc: (value: string) => {
      setPage(1)
      setRfcState(value)
    },
    reload: () => setReloadKey((k) => k + 1),
    nextPage: () => setPage((p) => (p * PAGE_SIZE < total ? p + 1 : p)),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
  }
}

function CountCell({ value }: { value: number }) {
  if (value === 0) return <span style={{ color: 'var(--ink-300)' }}>—</span>
  return (
    <span
      className="inline-flex min-w-[28px] justify-center px-2 py-0.5 rounded-full text-[12px] font-bold"
      style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
    >
      {value}
    </span>
  )
}

/**
 * Bandeja del Gerente de Operaciones: todos los contribuyentes con actividades pendientes de asignar a
 * régimen. Abrir un renglón usa el mismo modal de Mis clientes (requiere los permisos de actividades).
 */
export function ActividadesPendientesScreen({ permissions = [] }: { permissions?: string[] }) {
  const list = usePendingList()
  const canAssign = permissions.includes(ACTIVITIES_PERMISSION)
  const [target, setTarget] = useState<{ client: PendingActivityAssignment; tab: 'vigentes' | 'baja' } | null>(null)

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)] min-h-[600px]">
      <HelpBox>
        Contribuyentes con actividades sin régimen. <b>Regímenes de baja sin actividades</b>: no se pueden
        calcular ni presentar sus periodos anteriores a la baja. <b>Constancia</b>: actividades vigentes de
        la última constancia sin régimen activo. <b>Historial SAT</b>: actividades que el SAT reporta (incluidas
        las ya dadas de baja) sin ningún régimen vigente en esas fechas.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                onClick={() => list.setKind(k.value)}
                aria-pressed={list.kind === k.value}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold"
                style={{
                  background: list.kind === k.value ? 'var(--brand-500)' : 'var(--card)',
                  color: list.kind === k.value ? '#fff' : 'var(--ink-700)',
                  border: `1px solid ${list.kind === k.value ? 'var(--brand-500)' : 'var(--border-strong)'}`,
                }}
              >
                {k.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={list.rfc}
            onChange={(e) => list.setRfc(e.target.value)}
            placeholder="Filtrar por RFC…"
            className="px-3 py-2.5 rounded-lg text-[13.5px] sm:max-w-[320px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>
      </Card>

      <Card className="flex-1 min-h-[480px] flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} contribuyentes con pendientes`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={list.error} />
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando pendientes…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['RFC', 'Contribuyente', 'Regímenes de baja sin actividades', 'Constancia sin asignar', 'Historial SAT sin asignar', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={`px-5 py-3 font-extrabold whitespace-nowrap ${i >= 2 && i <= 4 ? 'text-center' : 'text-left'}`}
                          style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((t) => (
                    <tr key={t.taxpayerId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-3.5">
                        <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-900)' }}>{t.rfc}</code>
                      </td>
                      <td className="px-5 py-3.5 max-w-[320px]">
                        <div className="text-[13px] truncate" style={{ color: 'var(--ink-700)' }} title={t.legalName}>
                          {t.legalName}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CountCell value={t.regimesWithoutActivities} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CountCell value={t.unassignedPdfActivities} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <CountCell value={t.unassignedIdcActivities} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {canAssign && (
                          <button
                            type="button"
                            onClick={() =>
                              setTarget({
                                client: t,
                                tab: t.unassignedPdfActivities > 0 ? 'vigentes' : 'baja',
                              })
                            }
                            className="px-3 py-1.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap"
                            style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
                          >
                            Asignar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay contribuyentes con pendientes con estos filtros</div>
              </div>
            ) : (
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                total={list.total}
                skip={(list.page - 1) * PAGE_SIZE}
                take={PAGE_SIZE}
                itemCount={list.items.length}
                onPrev={list.prevPage}
                onNext={list.nextPage}
              />
            )}
          </>
        )}
      </Card>

      <ActividadesModal
        open={target !== null}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null)
            list.reload()
          }
        }}
        client={target?.client ?? null}
        initialTab={target?.tab}
      />
    </div>
  )
}
