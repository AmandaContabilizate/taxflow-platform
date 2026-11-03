'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationSatReading, DeclarationsError } from '../types'

/**
 * Datos leídos de los PDFs del SAT (acuse, línea de captura, recibo bancario) de una declaración.
 * Con `taxpayerId` va por la ruta espejo (Vista del cliente, Gerencia.VistaCliente).
 */
export async function getDeclarationSatReading(
  declarationId: number,
  taxpayerId?: number,
): Promise<Result<DeclarationSatReading, DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta la declaración.', code: 'INVALID_REQUEST' })
  }

  try {
    const route = taxpayerId
      ? API_ROUTES.DECLARATION.SAT_READING_ESPEJO(taxpayerId, declarationId)
      : API_ROUTES.DECLARATION.SAT_READING(declarationId)
    const data = await fetchGet<DeclarationSatReading>(route, 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationSatReading] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los datos del SAT.' })
  }
}
