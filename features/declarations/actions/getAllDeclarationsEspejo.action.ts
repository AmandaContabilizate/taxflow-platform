'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { AllDeclarations, DeclarationsError } from '../types'

/**
 * Vista del cliente: las declaraciones de un contribuyente tal como las recibe él en su app
 * (mismo endpoint, misma forma), pedidas desde el backoffice por un gerente.
 */
export async function getAllDeclarationsEspejo(
  taxpayerId: number,
): Promise<Result<AllDeclarations, DeclarationsError>> {
  if (!taxpayerId) {
    return err({ statusCode: 400, message: 'Falta el contribuyente.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<AllDeclarations>(API_ROUTES.DECLARATION.ALL_ESPEJO(taxpayerId), 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getAllDeclarationsEspejo] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener la vista del cliente.' })
  }
}
