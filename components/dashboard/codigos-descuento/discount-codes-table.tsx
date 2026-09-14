'use client'

import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, Pencil, ShieldCheck, Tag } from 'lucide-react'
import type { DiscountCodeAdmin } from '@/features/discountCodes/types'
import { MONO } from '../constants'
import { Badge } from '../ui'
import { fueraDeTope } from './use-discount-codes-state'

interface DiscountCodesTableProps {
  codes: DiscountCodeAdmin[]
  totalFiltered: number
  page: number
  pageSize: number
  totalPages: number
  canAuthorize: boolean
  authorizingId: number | null
  onAutorizar: (code: DiscountCodeAdmin) => void
  onEdit: (code: DiscountCodeAdmin) => void
  onPrevPage: () => void
  onNextPage: () => void
  onPageSizeChange: (size: number) => void
}

export function DiscountCodesTable({
  codes,
  totalFiltered,
  page,
  pageSize,
  totalPages,
  canAuthorize,
  authorizingId,
  onAutorizar,
  onEdit,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
}: DiscountCodesTableProps) {
  if (codes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}
        >
          <Tag size={28} />
        </div>
        <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
          Sin resultados con esos filtros
        </div>
        <div className="text-[12.5px] max-w-sm" style={{ color: 'var(--ink-500)' }}>
          Intenta modificando los criterios de búsqueda o limpiando los filtros seleccionados.
        </div>
      </div>
    )
  }

  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalFiltered)

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Contenedor con Scroll Interno */}
      <div className="flex-1 min-h-0 overflow-auto">
        <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
          <thead className="sticky top-0 z-10">
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
              {['Código', 'Dueño', 'Descuento', 'Planes', 'Usos', 'RFCs', 'Creado', 'Estatus', ''].map((h) => (
                <th
                  key={h}
                  className="py-3 px-4 text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ color: 'var(--ink-500)', background: 'var(--card)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr
                key={c.id}
                className="transition hover:bg-[var(--ink-50)]/50"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {/* Código y descripción */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code style={{ ...MONO, fontSize: '13px', color: 'var(--ink-900)', fontWeight: 700 }}>
                      {c.code}
                    </code>
                    {c.discountTypeId === 1 && c.stripeStatus === 'synced' && (
                      <span
                        title="Sincronizado con Stripe: este código también existe en el dashboard de Stripe"
                        className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
                      >
                        Stripe ✓
                      </span>
                    )}
                    {c.discountTypeId === 1 && c.stripeStatus === 'error' && (
                      <span
                        title={`No se pudo sincronizar con Stripe: ${c.stripeSyncError ?? 'error desconocido'}.`}
                        className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full cursor-help"
                        style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                      >
                        <AlertTriangle size={10} /> Stripe pendiente
                      </span>
                    )}
                  </div>
                  {c.description && (
                    <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {c.description}
                    </div>
                  )}
                </td>

                {/* Dueño */}
                <td className="py-3.5 px-4">
                  {c.isBaseTemplate ? (
                    <Badge kind="brand">Base para asesores</Badge>
                  ) : c.ownerType === 'none' ? (
                    <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>
                      Sin dueño
                    </span>
                  ) : (
                    <>
                      <Badge
                        kind={
                          c.ownerType === 'partner'
                            ? 'sky'
                            : c.ownerProfileType === 'Finder Fee'
                              ? 'amber'
                              : 'brand'
                        }
                      >
                        {c.ownerType === 'partner' ? 'Partner' : c.ownerProfileType ?? 'Ejecutivo'}
                      </Badge>
                      <div className="text-[12px] font-medium mt-0.5" style={{ color: 'var(--ink-700)' }}>
                        {c.ownerName}
                      </div>
                    </>
                  )}
                </td>

                {/* Descuento */}
                <td className="py-3.5 px-4 text-[13px]" style={{ color: 'var(--ink-900)' }}>
                  {c.discountTypeId === 2 ? (
                    <>
                      <b>{c.declarationsCount}</b> declaraciones
                      <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                        futuras de regalo
                      </div>
                    </>
                  ) : (
                    <b>{c.discountPercent}%</b>
                  )}
                </td>

                {/* Planes */}
                <td className="py-3.5 px-4 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                  {c.subscriptionPlanIds.length === 0 ? 'Todos' : `${c.subscriptionPlanIds.length} planes`}
                </td>

                {/* Usos */}
                <td className="py-3.5 px-4 text-[13px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                  {c.usedCount}/{c.maxUses ?? '—'}
                </td>

                {/* RFCs */}
                <td className="py-3.5 px-4 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                  {c.whitelistedRfcsCount > 0 ? `${c.whitelistedRfcsCount} exclusivos` : 'Abierto'}
                </td>

                {/* Creado */}
                <td className="py-3.5 px-4">
                  <div className="text-[12.5px] font-medium" style={{ color: 'var(--ink-700)' }}>
                    {new Date(c.createdAt).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  {c.createdByName && (
                    <div
                      className="text-[11px] mt-0.5 truncate max-w-[140px]"
                      title={c.createdByName}
                      style={{ color: 'var(--ink-500)' }}
                    >
                      por {c.createdByName}
                    </div>
                  )}
                </td>

                {/* Estatus */}
                <td className="py-3.5 px-4">
                  {!c.isActive && fueraDeTope(c) ? (
                    <Badge kind="amber">Por autorizar</Badge>
                  ) : (
                    <Badge kind={c.isActive ? 'brand' : 'default'}>
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  )}
                </td>

                {/* Acciones */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {canAuthorize && !c.isActive && fueraDeTope(c) && (
                      <button
                        type="button"
                        onClick={() => onAutorizar(c)}
                        disabled={authorizingId === c.id}
                        title="Autorizar y activar este código fuera de tope"
                        className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1.5 rounded-lg transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        style={{ background: 'var(--ink-900)', color: '#fff' }}
                      >
                        {authorizingId === c.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={12} />
                        )}
                        Autorizar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(c)}
                      title="Editar código"
                      aria-label={`Editar código ${c.code}`}
                      className="p-1.5 rounded-lg transition hover:bg-[var(--ink-100)] cursor-pointer"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <Pencil size={14} style={{ color: 'var(--ink-600)' }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer de Paginación Integrado */}
      <div
        className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 border-t shrink-0 text-xs"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-600)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-3">
          <span>
            Mostrando <b>{startItem}</b> a <b>{endItem}</b> de <b>{totalFiltered}</b> códigos
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>Filas por pág:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1 rounded-md text-xs font-semibold outline-none cursor-pointer"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold">
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onPrevPage}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border transition hover:opacity-80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--ink-50)' }}
              title="Página anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              onClick={onNextPage}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border transition hover:opacity-80 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              style={{ borderColor: 'var(--border)', background: 'var(--ink-50)' }}
              title="Página siguiente"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
