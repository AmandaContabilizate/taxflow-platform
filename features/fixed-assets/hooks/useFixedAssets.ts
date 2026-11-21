'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { catalogKeys, declarationKeys } from '@/features/declarations/hooks/declarationQueryKeys'
import { unwrap } from '@/features/declarations/hooks/useDeclarationQueries'
import { getFixedAssetTypes } from '../actions/getFixedAssetTypes.action'
import { getFixedAssets } from '../actions/getFixedAssets.action'

/** El catálogo de tipos casi no cambia. */
const TYPES_STALE_MS = 60 * 60_000
const DATA_STALE_MS = 5 * 60_000

export function useFixedAssetTypes(enabled = true) {
  return useQuery({
    queryKey: catalogKeys.fixedAssetTypes,
    queryFn: async () => unwrap(await getFixedAssetTypes()),
    staleTime: TYPES_STALE_MS,
    enabled,
  })
}

/** Lista de activos + `invalidate()` para después de confirmar, descartar o marcar. */
export function useFixedAssets(declarationId: number, rfc: string) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: declarationKeys.fixedAssets(declarationId, rfc),
    queryFn: async () => unwrap(await getFixedAssets(rfc, declarationId)),
    staleTime: DATA_STALE_MS,
    enabled: Boolean(rfc && declarationId),
  })
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: declarationKeys.fixedAssets(declarationId, rfc) }),
    [queryClient, declarationId, rfc],
  )
  return { query, invalidate }
}
