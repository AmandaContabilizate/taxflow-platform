'use client'

import { Ban, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { CancellationDeclaration } from '@/features/cancellations/types'
import { declarationStatusBadge } from '../declaraciones/parts'
import { selectStyle } from '../operaciones/purchased-declarations'
import { useHasPermission } from '../permissions'
import { Badge, Card, ErrorState } from '../ui'
import { CANCEL_DECLARATIONS_CLAIM, dangerBtn, dangerBtnStyle, declarationPeriodLabel } from './parts'

export interface DeclarationFilters {
  regimen: number | null
  year: number | null
  estatus: number | null
  cancelables: boolean
}

/**
 * Declaraciones del RFC con checkbox por fila. Los filtros viven en la URL (la pantalla los lee
 * y los pasa); los catálogos de régimen/año/estatus se derivan de las filas ya cargadas sin
 * filtrar para no pedir otro endpoint. `cancellable` y la razón vienen resueltos del back.
 */
export function DeclarationsTable({
  items,
  allItems,
  loading,
  error,
  filters,
  onFilters,
  onCancel,
}: {
  items: CancellationDeclaration[]
  /** Universo sin filtrar, para los selects. */
  allItems: CancellationDeclaration[]
  loading: boolean
  error: string | null
  filters: DeclarationFilters
  onFilters: (patch: Partial<DeclarationFilters>) => void
  onCancel: (selected: CancellationDeclaration[]) => void
}) {
  const canCancel = useHasPermission(CANCEL_DECLARATIONS_CLAIM)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  // Si una fila desaparece (filtro, cancelación), sale de la selección.
  useEffect(() => {
    setSelected((prev) => {
      const visible = new Set(items.filter((d) => d.cancellable).map((d) => d.declarationId))
      const next = new Set([...prev].filter((id) => visible.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [items])

  const regimes = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of allItems) if (d.taxRegimeId != null) m.set(d.taxRegimeId, d.regimeSatCode ?? `Régimen ${d.taxRegimeId}`)
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [allItems])
  const years = useMemo(
    () => [...new Set(allItems.map((d) => d.fiscalYear))].sort((a, b) => b - a),
    [allItems],
  )
  const statuses = useMemo(() => {
    const m = new Map<number, string>()
    for (const d of allItems) m.set(d.statusId, declarationStatusBadge(d.statusCode, d.statusLabel).label)
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [allItems])

  const cancellable = items.filter((d) => d.cancellable)
  const allChecked = cancellable.length > 0 && cancellable.every((d) => selected.has(d.declarationId))

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () =>
    setSelected(allChecked ? new Set() : new Set(cancellable.map((d) => d.declarationId)))

  const selectedItems = items.filter((d) => selected.has(d.declarationId))
  const filtering = filters.regimen != null || filters.year != null || filters.estatus != null || filters.cancelables

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filters.regimen ?? ''}
            onChange={(e) => onFilters({ regimen: e.target.value ? Number(e.target.value) : null })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
            aria-label="Régimen"
          >
            <option value="">Todos los regímenes</option>
            {regimes.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <select
            value={filters.year ?? ''}
            onChange={(e) => onFilters({ year: e.target.value ? Number(e.target.value) : null })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
            aria-label="Ejercicio"
          >
            <option value="">Todos los ejercicios</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={filters.estatus ?? ''}
            onChange={(e) => onFilters({ estatus: e.target.value ? Number(e.target.value) : null })}
            className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
            style={selectStyle}
            aria-label="Estatus"
          >
            <option value="">Todos los estatus</option>
            {statuses.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold cursor-pointer" style={{ color: 'var(--ink-700)' }}>
            <input
              type="checkbox"
              checked={filters.cancelables}
              onChange={(e) => onFilters({ cancelables: e.target.checked })}
              className="accent-[var(--brand-700)]"
            />
            Solo cancelables
          </label>
          {filtering && (
            <button
              type="button"
              onClick={() => onFilters({ regimen: null, year: null, estatus: null, cancelables: false })}
              className="px-3 py-2 rounded-lg text-[12.5px] font-bold cursor-pointer"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
        {canCancel && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              {selected.size} {selected.size === 1 ? 'seleccionada' : 'seleccionadas'}
            </span>
            <button
              type="button"
              onClick={() => onCancel(selectedItems)}
              disabled={selectedItems.length === 0}
              className={dangerBtn}
              style={dangerBtnStyle}
            >
              <Ban size={15} /> Cancelar seleccionadas
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando declaraciones…
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
          {filtering ? 'Ninguna declaración cumple los filtros.' : 'Este contribuyente no tiene declaraciones.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="px-5 py-3 text-left" style={{ background: 'var(--card)' }}>
                  {canCancel && (
                    <input
                      type="checkbox"
                      checked={allChecked}
                      disabled={cancellable.length === 0}
                      onChange={toggleAll}
                      aria-label="Seleccionar todas las cancelables"
                      title="Seleccionar todas las cancelables"
                      className="accent-[var(--brand-700)]"
                    />
                  )}
                </th>
                {['Periodo', 'Régimen', 'Estatus', 'Paquete', 'Contador', '¿Cancelable?'].map((h) => (
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
              {items.map((d) => {
                const badge = declarationStatusBadge(d.statusCode, d.statusLabel)
                const checked = selected.has(d.declarationId)
                return (
                  <tr
                    key={d.declarationId}
                    style={{ borderBottom: '1px solid var(--border)', background: checked ? 'var(--ink-50)' : undefined }}
                  >
                    <td className="px-5 py-4">
                      {canCancel && (
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!d.cancellable}
                          onChange={() => toggle(d.declarationId)}
                          aria-label={`Seleccionar ${declarationPeriodLabel(d.fiscalYear, d.periodValueId, d.complementNumber)}`}
                          className="accent-[var(--brand-700)] disabled:opacity-40"
                        />
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>
                      {declarationPeriodLabel(d.fiscalYear, d.periodValueId, d.complementNumber)}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.regimeSatCode ?? '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <Badge kind={badge.kind}>{badge.label}</Badge>
                      {d.inFlight && (
                        <span className="ml-1.5"><Badge kind="amber">En vuelo</Badge></span>
                      )}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                      {d.planName ?? (d.saleItemId != null ? `Partida ${d.saleItemId}` : '—')}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{d.accountantName ?? '—'}</td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {d.cancellable ? (
                        <Badge kind="brand">Sí</Badge>
                      ) : (
                        <span title={d.notCancellableReason ?? undefined} className="cursor-help">
                          <Badge>No</Badge>
                          {d.notCancellableReason && (
                            <span className="ml-1.5 text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                              {d.notCancellableReason}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
