'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { FiscalScore, FiscalScoreError } from '../types'

export async function getFiscalScore(
  rfc: string,
): Promise<Result<FiscalScore, FiscalScoreError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: 'Falta el RFC.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<FiscalScore>(
      API_ROUTES.DECLARATION.FISCAL_SCORE(rfc),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getFiscalScore] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tu score fiscal.' })
  }
}
