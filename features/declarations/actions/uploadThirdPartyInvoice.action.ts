'use server'

import { ApiError, fetchPostMultipart } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { problemDetailMessage } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, ThirdPartyInvoiceResult } from '../types'

/** Sube el XML de un CFDI emitido por una plataforma a cuenta de terceros. No recalcula. */
export async function uploadThirdPartyInvoice(
  declarationId: number,
  formData: FormData,
): Promise<Result<ThirdPartyInvoiceResult, DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta la declaración.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPostMultipart<ThirdPartyInvoiceResult>(
      API_ROUTES.DECLARATION.THIRD_PARTY_INVOICES(declarationId),
      formData,
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      const message = e.status === 403 ? 'Tu perfil no puede agregar CFDI a la declaración.' : problemDetailMessage(e)
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[uploadThirdPartyInvoice] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos subir el CFDI.' })
  }
}
