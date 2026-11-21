'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { declarationKeys } from '@/features/declarations/hooks/declarationQueryKeys'
import { unwrap } from '@/features/declarations/hooks/useDeclarationQueries'
import { getIvaFavorBalances } from '../actions/getIvaFavorBalances.action'

const DATA_STALE_MS = 5 * 60_000

/**
 * Saldos del contribuyente. La clave cuelga de la declaración para que el recálculo (que
 * registra aplicaciones y el saldo generado) la invalide junto con los cálculos.
 */
export function useIvaFavorBalances(declarationId: number, rfc: string, enabled = true) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: declarationKeys.ivaFavorBalances(declarationId, rfc),
    queryFn: async () => unwrap(await getIvaFavorBalances(rfc)),
    staleTime: DATA_STALE_MS,
    enabled: enabled && Boolean(rfc),
  })
  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: declarationKeys.ivaFavorBalances(declarationId, rfc) }),
    [queryClient, declarationId, rfc],
  )
  return { query, invalidate }
}
