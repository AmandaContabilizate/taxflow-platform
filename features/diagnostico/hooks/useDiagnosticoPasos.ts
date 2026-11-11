'use client'

import { useQuery } from '@tanstack/react-query'
import { getDiagnosticoPasosCliente } from '../actions/getDiagnosticoPasos.action'
import type { DiagnosticoPasos } from '../types'

const POLL_MS = 20_000

/**
 * ¿Sigue avanzando algún paso? Compra queda "en espera" mientras no haya venta, así que no cuenta:
 * con ella el sondeo no pararía nunca.
 */
function sigueAvanzando(data: DiagnosticoPasos | undefined): boolean {
  return !!data?.pasos.some((p) => p.clave !== 'compra' && (p.estatusId === 2 || p.estatusId === 3))
}

/** Pasos del diagnóstico del RFC del cliente; se sondea cada 20 s mientras algún paso avance. */
export function useDiagnosticoPasos(rfc: string | null | undefined, enabled = true) {
  const query = useQuery({
    queryKey: ['diagnostico', 'pasos-cliente', rfc],
    enabled: enabled && !!rfc,
    staleTime: 15_000,
    refetchInterval: (q) => (sigueAvanzando(q.state.data) ? POLL_MS : false),
    queryFn: async () => {
      const res = await getDiagnosticoPasosCliente(rfc!)
      if (!res.success) throw new Error(res.error.message)
      return res.value
    },
  })

  return {
    pasos: query.data ?? null,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    refetch: query.refetch,
  }
}
