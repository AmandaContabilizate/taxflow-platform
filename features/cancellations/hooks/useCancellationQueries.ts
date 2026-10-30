'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { unwrap } from '@/features/declarations/hooks/useDeclarationQueries'
import { getCancellationDeclarations, type CancellationDeclarationsFilters } from '../actions/getCancellationDeclarations.action'
import { getCancellationHistory } from '../actions/getCancellationHistory.action'
import { getCancellationReasons } from '../actions/getCancellationReasons.action'
import { getDeactivationPreview } from '../actions/getDeactivationPreview.action'
import { searchCancellationTaxpayers } from '../actions/searchCancellationTaxpayers.action'

/**
 * Claves de caché del módulo Cancelaciones. Todo lo del contribuyente cuelga de
 * `['cancellations', 'taxpayer', taxpayerId]` para invalidarlo junto tras cancelar o reactivar.
 */
export const cancellationKeys = {
  reasons: ['cancellations', 'reasons'] as const,
  search: (q: string, skip: number, take: number) => ['cancellations', 'search', q, skip, take] as const,
  taxpayer: (taxpayerId: number) => ['cancellations', 'taxpayer', taxpayerId] as const,
  declarations: (taxpayerId: number, filters: CancellationDeclarationsFilters) =>
    [
      'cancellations',
      'taxpayer',
      taxpayerId,
      'declarations',
      {
        taxRegimeId: filters.taxRegimeId ?? null,
        fiscalYear: filters.fiscalYear ?? null,
        statusId: filters.statusId ?? null,
        onlyCancellable: filters.onlyCancellable ?? false,
      },
    ] as const,
  history: (taxpayerId: number) => ['cancellations', 'taxpayer', taxpayerId, 'history'] as const,
  preview: (taxpayerId: number) => ['cancellations', 'taxpayer', taxpayerId, 'preview'] as const,
}

const DATA_STALE_MS = 60_000
const CATALOG_STALE_MS = 60 * 60_000

export function useCancellationReasons() {
  return useQuery({
    queryKey: cancellationKeys.reasons,
    queryFn: async () => unwrap(await getCancellationReasons()),
    staleTime: CATALOG_STALE_MS,
  })
}

/** Búsqueda con `q` ya "debounceada" por la pantalla; con menos de 3 caracteres no pide nada. */
export function useCancellationTaxpayerSearch(q: string, skip: number, take: number) {
  return useQuery({
    queryKey: cancellationKeys.search(q, skip, take),
    queryFn: async () => unwrap(await searchCancellationTaxpayers({ q, skip, take })),
    enabled: q.trim().length >= 3,
    staleTime: DATA_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useCancellationDeclarations(taxpayerId: number | null, filters: CancellationDeclarationsFilters) {
  return useQuery({
    queryKey: cancellationKeys.declarations(taxpayerId ?? 0, filters),
    queryFn: async () => unwrap(await getCancellationDeclarations(taxpayerId as number, filters)),
    enabled: taxpayerId != null,
    staleTime: DATA_STALE_MS,
    placeholderData: (prev) => prev,
  })
}

export function useCancellationHistory(taxpayerId: number | null, enabled = true) {
  return useQuery({
    queryKey: cancellationKeys.history(taxpayerId ?? 0),
    queryFn: async () => unwrap(await getCancellationHistory(taxpayerId as number)),
    enabled: enabled && taxpayerId != null,
    staleTime: DATA_STALE_MS,
  })
}

/** Solo mientras el modal de "Cancelar cliente" está abierto: cada apertura lo vuelve a pedir. */
export function useDeactivationPreview(taxpayerId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: cancellationKeys.preview(taxpayerId ?? 0),
    queryFn: async () => unwrap(await getDeactivationPreview(taxpayerId as number)),
    enabled: enabled && taxpayerId != null,
    staleTime: 0,
    gcTime: 0,
  })
}

/** El back escribió (cancelar/reactivar): listado, historial y preview del RFC dejan de valer. */
export function useInvalidateCancellationTaxpayer() {
  const queryClient = useQueryClient()
  return useCallback(
    (taxpayerId: number) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cancellationKeys.taxpayer(taxpayerId) }),
        queryClient.invalidateQueries({ queryKey: ['cancellations', 'search'] }),
      ]),
    [queryClient],
  )
}
