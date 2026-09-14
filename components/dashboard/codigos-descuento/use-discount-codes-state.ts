'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  getDiscountCodeLookups,
  getDiscountCodes,
} from '@/features/discountCodes/actions/getDiscountCodes.action'
import { saveDiscountCode } from '@/features/discountCodes/actions/saveDiscountCode.action'
import type {
  DiscountCodeAdmin,
  DiscountCodeLookups,
} from '@/features/discountCodes/types'

export type OwnerFilter = 'all' | 'user' | 'partner' | 'none' | 'base'
export type StatusFilter = 'all' | 'active' | 'inactive' | 'pending_auth'
export type DiscountTypeFilter = 'all' | 'percent' | 'declarations'
export type DateRangeFilter = 'all' | 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth'

/** Código fuera del tope de negocio (20% / 3 declaraciones). */
export const fueraDeTope = (c: DiscountCodeAdmin) =>
  c.discountTypeId === 2 ? (c.declarationsCount ?? 0) > 3 : c.discountPercent > 20

function matchesDateRange(createdAtStr: string, filter: DateRangeFilter): boolean {
  if (filter === 'all') return true
  const date = new Date(createdAtStr)
  if (isNaN(date.getTime())) return true

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (filter === 'today') {
    return date >= startOfToday
  }
  if (filter === 'last7days') {
    const cutoff = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000)
    return date >= cutoff
  }
  if (filter === 'last30days') {
    const cutoff = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000)
    return date >= cutoff
  }
  if (filter === 'thisMonth') {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
  }
  if (filter === 'lastMonth') {
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return date.getFullYear() === prevYear && date.getMonth() === prevMonth
  }
  return true
}

export function useDiscountCodesState() {
  const [codes, setCodes] = useState<DiscountCodeAdmin[]>([])
  const [lookups, setLookups] = useState<DiscountCodeLookups | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [search, setSearchState] = useState('')
  const [ownerFilter, setOwnerFilterState] = useState<OwnerFilter>('all')
  const [statusFilter, setStatusFilterState] = useState<StatusFilter>('all')
  const [discountTypeFilter, setDiscountTypeFilterState] = useState<DiscountTypeFilter>('all')
  const [dateRangeFilter, setDateRangeFilterState] = useState<DateRangeFilter>('all')

  // Paginación
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(25)

  // Estados de mutación
  const [authorizingId, setAuthorizingId] = useState<number | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [codesRes, lookupsRes] = await Promise.all([getDiscountCodes(), getDiscountCodeLookups()])
    if (codesRes.success) {
      setCodes(codesRes.value)
    } else {
      setError(codesRes.error.message)
    }
    if (lookupsRes.success) setLookups(lookupsRes.value)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  // Helpers de reseteo de página
  const setSearch = (val: string) => {
    setSearchState(val)
    setPage(1)
  }
  const setOwnerFilter = (val: OwnerFilter) => {
    setOwnerFilterState(val)
    setPage(1)
  }
  const setStatusFilter = (val: StatusFilter) => {
    setStatusFilterState(val)
    setPage(1)
  }
  const setDiscountTypeFilter = (val: DiscountTypeFilter) => {
    setDiscountTypeFilterState(val)
    setPage(1)
  }
  const setDateRangeFilter = (val: DateRangeFilter) => {
    setDateRangeFilterState(val)
    setPage(1)
  }
  const setPageSize = (val: number) => {
    setPageSizeState(val)
    setPage(1)
  }
  const resetFilters = () => {
    setSearchState('')
    setOwnerFilterState('all')
    setStatusFilterState('all')
    setDiscountTypeFilterState('all')
    setDateRangeFilterState('all')
    setPage(1)
  }

  // Filtrado reactivo en memoria
  const filteredCodes = useMemo(() => {
    return codes.filter((c) => {
      // Búsqueda por texto
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const match =
          c.code.toLowerCase().includes(q) ||
          (c.ownerName ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q) ||
          (c.createdByName ?? '').toLowerCase().includes(q)
        if (!match) return false
      }

      // Filtro por dueño
      if (ownerFilter !== 'all') {
        if (ownerFilter === 'base' && !c.isBaseTemplate) return false
        if (ownerFilter === 'user' && (c.ownerType !== 'user' || c.isBaseTemplate)) return false
        if (ownerFilter === 'partner' && c.ownerType !== 'partner') return false
        if (ownerFilter === 'none' && (c.ownerType !== 'none' || c.isBaseTemplate)) return false
      }

      // Filtro por estatus
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && !c.isActive) return false
        if (statusFilter === 'inactive' && (c.isActive || fueraDeTope(c))) return false
        if (statusFilter === 'pending_auth' && (c.isActive || !fueraDeTope(c))) return false
      }

      // Filtro por tipo de descuento
      if (discountTypeFilter !== 'all') {
        if (discountTypeFilter === 'percent' && c.discountTypeId !== 1) return false
        if (discountTypeFilter === 'declarations' && c.discountTypeId !== 2) return false
      }

      // Filtro por fecha
      if (!matchesDateRange(c.createdAt, dateRangeFilter)) {
        return false
      }

      return true
    })
  }, [codes, search, ownerFilter, statusFilter, discountTypeFilter, dateRangeFilter])

  // Paginación
  const totalFiltered = filteredCodes.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedCodes = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filteredCodes.slice(start, start + pageSize)
  }, [filteredCodes, safePage, pageSize])

  const autorizar = async (c: DiscountCodeAdmin, onSuccess?: () => void) => {
    setAuthorizingId(c.id)
    setAuthError(null)
    const res = await saveDiscountCode({
      id: c.id,
      code: c.code,
      description: c.description ?? undefined,
      sellerUserId: c.ownerType === 'user' ? (c.sellerUserId ?? undefined) : undefined,
      partnershipId: c.ownerType === 'partner' ? (c.partnershipId ?? undefined) : undefined,
      discountTypeId: c.discountTypeId,
      discountPercent: c.discountTypeId === 1 ? c.discountPercent : undefined,
      declarationsCount: c.discountTypeId === 2 ? (c.declarationsCount ?? undefined) : undefined,
      maxUses: c.maxUses ?? 0,
      subscriptionPlanIds: c.subscriptionPlanIds,
      whitelistedRfcs: c.whitelistedRfcs,
      isActive: true,
      isBaseTemplate: c.isBaseTemplate,
      baseTemplateSegmentId: c.baseTemplateSegmentId,
    })
    setAuthorizingId(null)
    if (res.success) {
      if (onSuccess) onSuccess()
      void load()
    } else {
      setAuthError(`${c.code}: ${res.error.message}`)
    }
  }

  const hasActiveFilters =
    search.trim() !== '' ||
    ownerFilter !== 'all' ||
    statusFilter !== 'all' ||
    discountTypeFilter !== 'all' ||
    dateRangeFilter !== 'all'

  return {
    codes,
    lookups,
    loading,
    error,
    filteredCodes,
    paginatedCodes,
    totalFiltered,
    totalOriginal: codes.length,
    page: safePage,
    pageSize,
    totalPages,
    search,
    ownerFilter,
    statusFilter,
    discountTypeFilter,
    dateRangeFilter,
    hasActiveFilters,
    authorizingId,
    authError,
    setSearch,
    setOwnerFilter,
    setStatusFilter,
    setDiscountTypeFilter,
    setDateRangeFilter,
    setPage,
    setPageSize,
    resetFilters,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    reload: load,
    autorizar,
    pendientesAutorizar: codes.filter((c) => !c.isActive && fueraDeTope(c)),
  }
}
