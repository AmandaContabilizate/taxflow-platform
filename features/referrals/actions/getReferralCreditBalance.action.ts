'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { ReferralCreditBalance, ReferralsError } from '../types'

/** Saldo de créditos de referidos del usuario autenticado (el carrito lo consulta antes de pagar). */
export async function getReferralCreditBalance(): Promise<Result<ReferralCreditBalance, ReferralsError>> {
  try {
    const data = await fetchGet<ReferralCreditBalance>(API_ROUTES.REFERRALS.BALANCE, 'referrals')
    return ok({ available: data?.available ?? 0, nextExpiryAt: data?.nextExpiryAt ?? null })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getReferralCreditBalance] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar tus créditos.' })
  }
}
