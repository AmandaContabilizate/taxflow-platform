'use server'

import { ApiError, fetchGetPublic } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { reportTokenSchema } from '../schemas/declarationReport.schema'
import type { DeclarationReport, DeclarationReportError } from '../types'

const INVALID_LINK: DeclarationReportError = {
  statusCode: 400,
  message: 'El enlace del reporte no es válido o fue modificado.',
  code: 'REPORT_TOKEN_INVALID',
}

export async function getDeclarationReport(
  token: string,
): Promise<Result<DeclarationReport, DeclarationReportError>> {
  const parsed = reportTokenSchema.safeParse(token)
  if (!parsed.success) return err(INVALID_LINK)

  try {
    const data = await fetchGetPublic<DeclarationReport>(
      API_ROUTES.DECLARATION_REPORT.REPORT(parsed.data),
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationReport] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos cargar tu declaración.' })
  }
}
