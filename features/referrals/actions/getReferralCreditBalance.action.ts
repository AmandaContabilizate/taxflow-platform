'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { ReferralCreditBalance, ReferralsError } from '../types'

/**
 * Saldo de créditos de referidos del usuario autenticado (el carrito lo consulta antes de pagar).
 * Con `rfc` (el que compra) el back no resta lo apartado en la venta Abierta de ese mismo RFC,
 * porque la compra nueva la reemplaza.
 */
export async function getReferralCreditBalance(
  rfc?: string,
): Promise<Result<ReferralCreditBalance, ReferralsError>> {
  try {
    const endpoint = rfc ? API_ROUTES.REFERRALS.BALANCE_FOR(rfc) : API_ROUTES.REFERRALS.BALANCE
    const data = await fetchGet<ReferralCreditBalance>(endpoint, 'referrals')
    return ok({
      available: data?.available ?? 0,
      reserved: data?.reserved ?? 0,
      nextExpiryAt: data?.nextExpiryAt ?? null,
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getReferralCreditBalance] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar tus créditos.' })
  }
}
