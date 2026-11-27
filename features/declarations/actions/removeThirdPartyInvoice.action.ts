'use server'

import { ApiError, fetchDelete } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { problemDetailMessage } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, ThirdPartyInvoiceRemoval } from '../types'

/** Quita el vínculo del CFDI a cuenta de terceros con la declaración. No recalcula. */
export async function removeThirdPartyInvoice(
  declarationId: number,
  invoiceId: number,
): Promise<Result<ThirdPartyInvoiceRemoval, DeclarationsError>> {
  if (!declarationId || !invoiceId) {
    return err({ statusCode: 400, message: 'Falta la declaración o la factura.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchDelete<ThirdPartyInvoiceRemoval>(
      API_ROUTES.DECLARATION.THIRD_PARTY_INVOICE(declarationId, invoiceId),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      const message = e.status === 403 ? 'Tu perfil no puede quitar CFDI de la declaración.' : problemDetailMessage(e)
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[removeThirdPartyInvoice] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos quitar el CFDI.' })
  }
}
