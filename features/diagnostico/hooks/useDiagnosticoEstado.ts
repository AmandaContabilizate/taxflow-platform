'use client'

import { useQuery } from '@tanstack/react-query'
import { getDiagnosticoEstadoCliente } from '../actions/getDiagnosticoEstado.action'

/**
 * Estado del diagnóstico del RFC del cliente. `terminado` solo es true con la respuesta del
 * servidor en "Terminado": mientras carga o si falla, se trata como no terminado (candado puesto).
 */
export function useDiagnosticoEstado(rfc: string | null | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['diagnostico', 'estado-cliente', rfc],
    enabled: enabled && !!rfc,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await getDiagnosticoEstadoCliente(rfc!)
      if (!res.success) throw new Error(res.error.message)
      return res.value
    },
  })

  return {
    estado: query.data ?? null,
    terminado: query.data?.estado === 'Terminado',
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  }
}
