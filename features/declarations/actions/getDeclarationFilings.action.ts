'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationFilings, DeclarationsError } from '../types'

/**
 * Todas las presentaciones (Normal + complementarias) del periodo de una declaración.
 * Con `taxpayerId` va por la ruta espejo (Vista del cliente, Gerencia.VistaCliente).
 */
export async function getDeclarationFilings(
  declarationId: number,
  taxpayerId?: number,
): Promise<Result<DeclarationFilings, DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta la declaración.', code: 'INVALID_REQUEST' })
  }

  try {
    const route = taxpayerId
      ? API_ROUTES.DECLARATION.FILINGS_ESPEJO(taxpayerId, declarationId)
      : API_ROUTES.DECLARATION.FILINGS(declarationId)
    const data = await fetchGet<DeclarationFilings>(route, 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationFilings] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener las presentaciones del periodo.' })
  }
}
