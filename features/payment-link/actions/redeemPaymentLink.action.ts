'use server'

import { ApiError, fetchGetPublic } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { paymentTokenSchema } from '../schemas/paymentLink.schema'
import type { PaymentLinkClientSecret, PaymentLinkError } from '../types'

const INVALID_LINK: PaymentLinkError = {
  statusCode: 400,
  message: 'El enlace de pago no es válido o fue modificado.',
  code: 'PAYMENT_TOKEN_INVALID',
}

export async function redeemPaymentLink(
  token: string,
): Promise<Result<PaymentLinkClientSecret, PaymentLinkError>> {
  const parsed = paymentTokenSchema.safeParse(token)
  if (!parsed.success) return err(INVALID_LINK)

  try {
    const data = await fetchGetPublic<PaymentLinkClientSecret>(
      API_ROUTES.PAYMENT_LINK.REDEEM(parsed.data),
      'payment_link',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[redeemPaymentLink] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos preparar tu pago.' })
  }
}
