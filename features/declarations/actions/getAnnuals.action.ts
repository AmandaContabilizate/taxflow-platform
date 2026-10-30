'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { Annuals, DeclarationsError } from '../types'

export async function getAnnuals(
  rfc: string,
): Promise<Result<Annuals, DeclarationsError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: 'Falta el RFC.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<Annuals>(API_ROUTES.DECLARATION.ANNUALS(rfc), 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getAnnuals] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tus declaraciones anuales.' })
  }
}
