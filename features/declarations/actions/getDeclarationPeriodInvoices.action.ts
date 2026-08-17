'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type DeclarationPeriodInvoicesInput,
  declarationPeriodInvoicesSchema,
} from '../schemas/recalculate.schema'
import type { DeclarationPeriodInvoice, DeclarationsError } from '../types'

/** `ResultHandler<List<DeclarationInvoiceItemDto>>` del backend. */
interface InvoicesEnvelope {
  success: boolean
  data: DeclarationPeriodInvoice[] | null
  errorCode: string | null
  errorMessage: string | null
}

/**
 * Universo completo de CFDI del periodo (emitidos + recibidos) con su clasificación.
 *
 * Es la misma consulta que arma el payload del clasificador, así que lo que ve el
 * contador aquí y lo que entra al cálculo no pueden divergir. Son dos endpoints
 * (emitidas / recibidas) y se piden en paralelo: si uno falla, falla la acción —
 * media lista haría creer que faltan comprobantes.
 */
export async function getDeclarationPeriodInvoices(
  input: DeclarationPeriodInvoicesInput,
): Promise<Result<DeclarationPeriodInvoice[], DeclarationsError>> {
  const parsed = declarationPeriodInvoicesSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Periodo o RFC inválidos.',
    })
  }
  if (parsed.data.beginMonth > parsed.data.endMonth) {
    return err({ statusCode: 400, message: 'El rango de meses del periodo es inválido.' })
  }

  try {
    const [issued, received] = await Promise.all([
      fetchGet<InvoicesEnvelope>(
        API_ROUTES.DECLARATION.ISSUED_INVOICES_DECLARATION(parsed.data),
        'declaration',
      ),
      fetchGet<InvoicesEnvelope>(
        API_ROUTES.DECLARATION.RECEIVED_INVOICES_DECLARATION(parsed.data),
        'declaration',
      ),
    ])

    const failed = [issued, received].find((r) => r?.success === false)
    if (failed) {
      return err({
        statusCode: 400,
        message: failed.errorMessage ?? 'No pudimos obtener las facturas del periodo.',
        code: failed.errorCode ?? undefined,
      })
    }

    return ok([...(issued?.data ?? []), ...(received?.data ?? [])])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationPeriodInvoices] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener las facturas del periodo.' })
  }
}
