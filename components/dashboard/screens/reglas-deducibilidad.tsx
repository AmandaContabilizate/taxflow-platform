'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDeductibilityOverrides } from '@/features/classification/actions/getDeductibilityOverrides.action'
import type { DeductibilityOverride } from '@/features/classification/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox, Pill } from '../ui'
import { Pagination } from '../clientes/parts'

const PAGE_SIZE = 20

function formatDateTime(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

/** Lista paginada server-side, filtrada por actividad y RFC. */
function useOverridesList() {
  const [items, setItems] = useState<DeductibilityOverride[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [activityId, setActivityIdState] = useState<number | ''>('')
  const [rfc, setRfcState] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const handle = setTimeout(async () => {
      const res = await getDeductibilityOverrides({
        activityId: activityId || undefined,
        rfc: rfc.trim() || undefined,
        page,
        pageSize: PAGE_SIZE,
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
  }, [activityId, rfc, page])

  const setActivityId = (value: number | '') => {
    setPage(1)
    setActivityIdState(value)
  }
  const setRfc = (value: string) => {
    setPage(1)
    setRfcState(value)
  }

  return {
    items,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    loading,
    error,
    activityId,
    setActivityId,
    rfc,
    setRfc,
    nextPage: () => setPage((p) => (p * PAGE_SIZE < total ? p + 1 : p)),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
  }
}

/** `rfc = null` es la regla global: afecta a todos los contribuyentes de la actividad. */
function RfcCell({ rfc }: { rfc: string | null }) {
  if (!rfc) return <Pill kind="coral">Todos (global)</Pill>
  return <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{rfc}</code>
}

/** Forzar deducible es lo riesgoso: se marca distinto de forzar no deducible. */
function ForzadoCell({ isDeductible }: { isDeductible: boolean }) {
  return isDeductible ? (
    <Pill kind="coral">Deducible forzado</Pill>
  ) : (
    <Pill kind="ink">No deducible forzado</Pill>
  )
}

/**
 * `deductibilityRegime` null = el override no aplica en ningún régimen (E9):
 * quedó inerte, hay que distinguirlo de uno activo.
 */
function RegimenCell({ regime }: { regime: string | null }) {
  if (!regime) {
    return (
      <span className="inline-flex items-center gap-1.5" title="No aplica en ningún régimen: quedó inerte (E9)">
        <AlertTriangle size={13} style={{ color: 'var(--amber)' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>Inerte</span>
      </span>
    )
  }
  return <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-700)' }}>{regime}</span>
}

export function ReglasDeducibilidadScreen() {
  const list = useOverridesList()

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)] min-h-[600px]">
      <HelpBox>
        Bitácora de claves producto/servicio con la deducibilidad forzada a mano. Un override no
        caduca: apaga la evaluación normal (uso de CFDI, forma de pago, régimen) para siempre hasta
        que alguien lo revierta en la base. Solo lectura.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            value={list.activityId}
            onChange={(e) => list.setActivityId(e.target.value ? Number(e.target.value) : '')}
            placeholder="Filtrar por id de actividad…"
            className="px-3 py-2.5 rounded-lg text-[13.5px] sm:w-[240px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <input
            type="text"
            value={list.rfc}
            onChange={(e) => list.setRfc(e.target.value)}
            placeholder="Filtrar por RFC exacto…"
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[13.5px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          {(list.activityId !== '' || list.rfc) && (
            <button
              type="button"
              onClick={() => {
                list.setActivityId('')
                list.setRfc('')
              }}
              className="px-3.5 py-2.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              Limpiar
            </button>
          )}
        </div>
      </Card>

      <Card className="flex-1 min-h-[480px] flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} overrides`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={list.error} />
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando overrides…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Clave', 'Actividad', 'RFC', 'Régimen', 'Forzado', 'Motivo', 'Clasificación', 'Creado', 'Actualizado'].map((h) => (
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
                  {list.items.map((o) => (
                    <tr key={o.ruleId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-900)' }}>{o.productKey}</code>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
                          {o.activityDescription ?? `Actividad #${o.activityId}`}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <RfcCell rfc={o.rfc} />
                      </td>
                      <td className="px-5 py-4">
                        <RegimenCell regime={o.deductibilityRegime} />
                      </td>
                      <td className="px-5 py-4">
                        <ForzadoCell isDeductible={o.isDeductible} />
                      </td>
                      <td className="px-5 py-4 max-w-[360px]">
                        <div className="text-[13px] leading-snug whitespace-pre-wrap break-words" style={{ color: 'var(--ink-700)' }}>
                          {o.deductibilityReason ?? '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
                          {o.classificationName ?? `#${o.classificationId}`}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{formatDateTime(o.createdAt)}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>{o.createdBy ?? '—'}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{formatDateTime(o.updatedAt)}</div>
                        <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>{o.updatedBy ?? '—'}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay overrides con estos filtros</div>
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
    </div>
  )
}
