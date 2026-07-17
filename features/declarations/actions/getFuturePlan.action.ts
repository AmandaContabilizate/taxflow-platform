'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, FuturePlan } from '../types'

export async function getFuturePlan(
  rfc: string,
): Promise<Result<FuturePlan, DeclarationsError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: 'Falta el RFC.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<FuturePlan>(
      API_ROUTES.DECLARATION.FUTURE_PLAN(rfc),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getFuturePlan] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tu plan a futuro.' })
  }
}
