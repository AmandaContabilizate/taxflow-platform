'use server'

import { ApiError, fetchPostPublic } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  reportCommentSchema,
  reportTokenSchema,
} from '../schemas/declarationReport.schema'
import type { DeclarationReportActionResult, DeclarationReportError } from '../types'

/**
 * "Tengo una duda": 9 (EnRevisionCliente) o 10 → 10 (RebotadaCliente), con el
 * texto del cliente en `Declarations.DeclarationLog.Note`.
 */
export async function commentDeclarationReport(
  token: string,
  comment: string,
): Promise<Result<DeclarationReportActionResult, DeclarationReportError>> {
  const parsedToken = reportTokenSchema.safeParse(token)
  if (!parsedToken.success) {
    return err({
      statusCode: 400,
      message: 'El enlace del reporte no es válido o fue modificado.',
      code: 'REPORT_TOKEN_INVALID',
    })
  }

  const parsedComment = reportCommentSchema.safeParse({ comment })
  if (!parsedComment.success) {
    return err({
      statusCode: 400,
      message: parsedComment.error.issues[0]?.message ?? 'Escribe tu duda.',
      code: 'INVALID_REQUEST',
    })
  }

  try {
    const data = await fetchPostPublic<DeclarationReportActionResult>(
      API_ROUTES.DECLARATION_REPORT.COMMENT,
      { token: parsedToken.data, comment: parsedComment.data.comment },
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[commentDeclarationReport] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos enviar tu comentario.' })
  }
}
