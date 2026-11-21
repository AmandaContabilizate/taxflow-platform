'use client'

import { useQuery } from '@tanstack/react-query'
import { declarationKeys } from '@/features/declarations/hooks/declarationQueryKeys'
import { unwrap } from '@/features/declarations/hooks/useDeclarationQueries'
import { getSatFavorBalances } from '../actions/getSatFavorBalances.action'

const DATA_STALE_MS = 5 * 60_000

/** Saldos del SAT (lector de acuses) disponibles para la declaración. */
export function useSatFavorBalances(declarationId: number, enabled = true) {
  return useQuery({
    queryKey: declarationKeys.satFavorBalances(declarationId),
    queryFn: async () => unwrap(await getSatFavorBalances(declarationId)),
    staleTime: DATA_STALE_MS,
    enabled: enabled && declarationId > 0,
  })
}
