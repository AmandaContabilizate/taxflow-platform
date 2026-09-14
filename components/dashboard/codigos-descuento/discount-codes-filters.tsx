'use client'

import { RotateCcw, Search, X } from 'lucide-react'
import { Card } from '../ui'
import type {
  DateRangeFilter,
  DiscountTypeFilter,
  OwnerFilter,
  StatusFilter,
} from './use-discount-codes-state'

interface DiscountCodesFiltersProps {
  search: string
  onSearchChange: (value: string) => void
  ownerFilter: OwnerFilter
  onOwnerFilterChange: (value: OwnerFilter) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (value: StatusFilter) => void
  discountTypeFilter: DiscountTypeFilter
  onDiscountTypeFilterChange: (value: DiscountTypeFilter) => void
  dateRangeFilter: DateRangeFilter
  onDateRangeFilterChange: (value: DateRangeFilter) => void
  hasActiveFilters: boolean
  onResetFilters: () => void
}

export function DiscountCodesFilters({
  search,
  onSearchChange,
  ownerFilter,
  onOwnerFilterChange,
  statusFilter,
  onStatusFilterChange,
  discountTypeFilter,
  onDiscountTypeFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  hasActiveFilters,
  onResetFilters,
}: DiscountCodesFiltersProps) {
  return (
    <Card className="shrink-0">
      <div className="p-4 flex flex-col gap-3">
        {/* Fila 1: Barra de Búsqueda y Botón Limpiar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--ink-400)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por código, dueño, descripción o creador…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[13.5px] font-medium outline-none transition focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
            {search.trim().length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                title="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-[var(--ink-400)] hover:text-[var(--ink-700)] transition cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold transition hover:opacity-80 cursor-pointer self-start sm:self-auto shrink-0"
              style={{
                background: 'var(--ink-50)',
                color: 'var(--ink-700)',
                border: '1px solid var(--border)',
              }}
            >
              <RotateCcw size={13} /> Limpiar filtros
            </button>
          )}
        </div>

        {/* Fila 2: Selectores de Filtro Responsivos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Dueño */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider px-1" style={{ color: 'var(--ink-500)' }}>
              Dueño
            </label>
            <select
              value={ownerFilter}
              onChange={(e) => onOwnerFilterChange(e.target.value as OwnerFilter)}
              className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">Todos los dueños</option>
              <option value="user">Ejecutivos / Finder Fee</option>
              <option value="partner">Partners</option>
              <option value="base">Base para asesores</option>
              <option value="none">Sin dueño</option>
            </select>
          </div>

          {/* Estatus */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider px-1" style={{ color: 'var(--ink-500)' }}>
              Estatus
            </label>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">Todos los estatus</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="pending_auth">Por autorizar (fuera de tope)</option>
            </select>
          </div>

          {/* Tipo de Descuento */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider px-1" style={{ color: 'var(--ink-500)' }}>
              Tipo de descuento
            </label>
            <select
              value={discountTypeFilter}
              onChange={(e) => onDiscountTypeFilterChange(e.target.value as DiscountTypeFilter)}
              className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">Todos los tipos</option>
              <option value="percent">Porcentaje (%)</option>
              <option value="declarations">Declaraciones de regalo</option>
            </select>
          </div>

          {/* Rango de Fechas */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-extrabold uppercase tracking-wider px-1" style={{ color: 'var(--ink-500)' }}>
              Fecha de creación
            </label>
            <select
              value={dateRangeFilter}
              onChange={(e) => onDateRangeFilterChange(e.target.value as DateRangeFilter)}
              className="w-full px-3 py-2 rounded-xl text-[13px] font-semibold outline-none transition focus:ring-2 focus:ring-[var(--primary)] cursor-pointer"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="last7days">Últimos 7 días</option>
              <option value="last30days">Últimos 30 días</option>
              <option value="thisMonth">Este mes</option>
              <option value="lastMonth">Mes anterior</option>
            </select>
          </div>
        </div>
      </div>
    </Card>
  )
}
