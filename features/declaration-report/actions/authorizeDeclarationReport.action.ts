'use server'

import { ApiError, fetchPostPublic } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { reportTokenSchema } from '../schemas/declarationReport.schema'
import type { DeclarationReportActionResult, DeclarationReportError } from '../types'

/**
 * "Autorizar y presentar": 9 (EnRevisionCliente) → 11 (PorPresentar).
 * Idempotente en el backend: repetirla responde 200 con `changed: false`.
 */
export async function authorizeDeclarationReport(
  token: string,
): Promise<Result<DeclarationReportActionResult, DeclarationReportError>> {
  const parsed = reportTokenSchema.safeParse(token)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: 'El enlace del reporte no es válido o fue modificado.',
      code: 'REPORT_TOKEN_INVALID',
    })
  }

  try {
    const data = await fetchPostPublic<DeclarationReportActionResult>(
      API_ROUTES.DECLARATION_REPORT.AUTHORIZE,
      { token: parsed.data },
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[authorizeDeclarationReport] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos registrar tu autorización.' })
  }
}
