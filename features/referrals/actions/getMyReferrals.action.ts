'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { ReferralsError, ReferralsSummary } from '../types'

/** Resumen de referidos del usuario autenticado; el back genera su código si aún no lo tenía. */
export async function getMyReferrals(): Promise<Result<ReferralsSummary, ReferralsError>> {
  try {
    const data = await fetchGet<ReferralsSummary>(API_ROUTES.REFERRALS.ME, 'referrals')
    return ok({
      ...data,
      items: data?.items ?? [],
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getMyReferrals] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos cargar tus referidos.' })
  }
}
