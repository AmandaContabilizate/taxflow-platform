'use client'

import { AlertCircle, History, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { DiscountCodeAdmin } from '@/features/discountCodes/types'
import { CodigoModal } from '../codigos-descuento/codigo-modal'
import { DiscountCodesFilters } from '../codigos-descuento/discount-codes-filters'
import { DiscountCodesLogModal } from '../codigos-descuento/discount-codes-log-modal'
import { DiscountCodesTable } from '../codigos-descuento/discount-codes-table'
import { useDiscountCodesState } from '../codigos-descuento/use-discount-codes-state'
import { Card, ErrorState } from '../ui'

export function CodigosDescuentoScreen({ permissions = [] }: { permissions?: string[] }) {
  const canAuthorize = permissions.includes('Admin.AuthorizeHighDiscount')
  const state = useDiscountCodesState()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCodeAdmin | null>(null)
  const [showLogModal, setShowLogModal] = useState(false)
  const [repartoMsg, setRepartoMsg] = useState<string | null>(null)

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (c: DiscountCodeAdmin) => {
    setEditing(c)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-4 max-w-full h-[calc(100dvh-8.5rem)]">
      {/* 1. Barra Superior de Búsqueda y Filtros */}
      <DiscountCodesFilters
        search={state.search}
        onSearchChange={state.setSearch}
        ownerFilter={state.ownerFilter}
        onOwnerFilterChange={state.setOwnerFilter}
        statusFilter={state.statusFilter}
        onStatusFilterChange={state.setStatusFilter}
        discountTypeFilter={state.discountTypeFilter}
        onDiscountTypeFilterChange={state.setDiscountTypeFilter}
        dateRangeFilter={state.dateRangeFilter}
        onDateRangeFilterChange={state.setDateRangeFilter}
        hasActiveFilters={state.hasActiveFilters}
        onResetFilters={state.resetFilters}
      />

      {/* 2. Contenedor Principal de la Tabla */}
      <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header de la Tabla: Contador y Acciones */}
        <div
          className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {state.loading
                ? 'Cargando códigos…'
                : `${state.totalFiltered} ${state.totalFiltered === 1 ? 'código encontrado' : 'códigos encontrados'}`}
            </div>
            {state.hasActiveFilters && !state.loading && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--ink-100)', color: 'var(--ink-600)' }}>
                de {state.totalOriginal} totales
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLogModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-[13px] transition hover:opacity-90 cursor-pointer"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >
              <History size={14} /> Bitácora
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] transition hover:opacity-95 shadow-sm cursor-pointer"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={15} /> Nuevo código
            </button>
          </div>
        </div>

        {/* Avisos Informativos y de Autorización */}
        {!state.loading && canAuthorize && state.pendientesAutorizar.length > 0 && (
          <div
            className="flex items-center gap-2.5 px-5 py-2.5 text-[12.5px] font-semibold border-b shrink-0"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', borderColor: 'var(--border)' }}
          >
            <ShieldCheck size={16} className="flex-shrink-0" />
            <span>
              {state.pendientesAutorizar.length === 1
                ? '1 código fuera de tope espera tu autorización.'
                : `${state.pendientesAutorizar.length} códigos fuera de tope esperan tu autorización.`}
            </span>
          </div>
        )}

        {state.authError && (
          <div
            className="flex items-center gap-2 px-5 py-2.5 text-[12.5px] font-semibold border-b shrink-0"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)', borderColor: 'var(--border)' }}
          >
            <AlertCircle size={15} className="flex-shrink-0" /> {state.authError}
          </div>
        )}

        {repartoMsg && (
          <div
            className="flex items-center justify-between gap-2 px-5 py-2.5 text-[12.5px] font-semibold border-b shrink-0"
            style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)', borderColor: 'var(--border)' }}
          >
            <span>{repartoMsg}</span>
            <button
              type="button"
              onClick={() => setRepartoMsg(null)}
              className="text-[11.5px] font-bold cursor-pointer hover:underline"
              style={{ color: 'var(--ink-500)' }}
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Cuerpo de la Tabla */}
        {state.loading ? (
          <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando códigos de descuento…
          </div>
        ) : state.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={state.error} />
          </div>
        ) : (
          <DiscountCodesTable
            codes={state.paginatedCodes}
            totalFiltered={state.totalFiltered}
            page={state.page}
            pageSize={state.pageSize}
            totalPages={state.totalPages}
            canAuthorize={canAuthorize}
            authorizingId={state.authorizingId}
            onAutorizar={state.autorizar}
            onEdit={openEdit}
            onPrevPage={state.prevPage}
            onNextPage={state.nextPage}
            onPageSizeChange={state.setPageSize}
          />
        )}
      </Card>

      {/* 3. Modal de Creación / Edición */}
      <CodigoModal
        open={modalOpen}
        code={editing}
        lookups={state.lookups}
        canAuthorize={canAuthorize}
        onClose={() => setModalOpen(false)}
        onSaved={(reparto) => {
          setRepartoMsg(
            reparto
              ? reparto.creadas === 0 && reparto.yaTenian === 0
                ? 'Código base guardado — aún no hay asesores a quienes repartirlo.'
                : `Código base repartido: ${reparto.creadas} ${reparto.creadas === 1 ? 'copia nueva' : 'copias nuevas'}; ${reparto.yaTenian} ${reparto.yaTenian === 1 ? 'asesor ya tenía la suya' : 'asesores ya tenían la suya'}.`
              : null,
          )
          void state.reload()
        }}
      />

      {/* 4. Modal de Bitácora de Autorizaciones */}
      <DiscountCodesLogModal
        open={showLogModal}
        onClose={() => setShowLogModal(false)}
      />
    </div>
  )
}
