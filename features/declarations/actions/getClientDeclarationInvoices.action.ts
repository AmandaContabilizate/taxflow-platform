'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type ClientDeclarationInvoicesInput,
  clientDeclarationInvoicesSchema,
} from '../schemas/clientInvoices.schema'
import type { ClientDeclarationInvoice, DeclarationsError } from '../types'

/**
 * CFDI ligados a una declaración para la vista del contribuyente.
 *
 * Es un endpoint aparte del que usa el contador a propósito: no expone
 * clasificación, motivo ni claves prod/serv, solo el detalle del comprobante y su
 * deducibilidad. Responde el array directo, sin el envelope `ResultHandler`.
 */
export async function getClientDeclarationInvoices(
  input: ClientDeclarationInvoicesInput,
): Promise<Result<ClientDeclarationInvoice[], DeclarationsError>> {
  const parsed = clientDeclarationInvoicesSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Declaración inválida.',
    })
  }

  try {
    const data = await fetchGet<ClientDeclarationInvoice[]>(
      API_ROUTES.DECLARATION.CLIENT_INVOICES(parsed.data.declarationId),
      'declaration',
    )
    return ok(Array.isArray(data) ? data : [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getClientDeclarationInvoices] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener las facturas de la declaración.' })
  }
}
