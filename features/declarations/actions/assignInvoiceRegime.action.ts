'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, InvoiceRegimeAssignmentResult } from '../types'

/**
 * Un CFDI, un régimen: asigna la factura al régimen de la declaración. Sale del
 * cálculo de los otros regímenes (las declaraciones ya presentadas no se tocan).
 * No recalcula; el contador recalcula después.
 */
export async function assignInvoiceRegime(
  declarationId: number,
  invoiceId: number,
): Promise<Result<InvoiceRegimeAssignmentResult, DeclarationsError>> {
  if (!declarationId || !invoiceId) {
    return err({ statusCode: 400, message: 'Falta la declaración o la factura.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPost<InvoiceRegimeAssignmentResult>(
      API_ROUTES.DECLARATION.ASSIGN_INVOICE_REGIME(declarationId, invoiceId),
      {},
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      const message = e.status === 403 ? 'Tu perfil no puede asignar facturas a un régimen.' : e.message
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[assignInvoiceRegime] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos asignar la factura al régimen.' })
  }
}
