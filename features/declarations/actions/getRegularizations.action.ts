'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, Regularizations } from '../types'

export async function getRegularizations(
  rfc: string,
): Promise<Result<Regularizations, DeclarationsError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: 'Falta el RFC.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<Regularizations>(
      API_ROUTES.DECLARATION.REGULARIZATIONS(rfc),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getRegularizations] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tus regularizaciones.' })
  }
}
