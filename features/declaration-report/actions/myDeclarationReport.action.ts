'use server'

import { ApiError, fetchGet, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { reportCommentSchema } from '../schemas/declarationReport.schema'
import type {
  DeclarationReport,
  DeclarationReportActionResult,
  DeclarationReportError,
} from '../types'

/**
 * El MISMO reporte del enlace del correo, pero para el cliente que ya entró con su sesión.
 *
 * Cambia la credencial, no el contenido: el backend comparte handler, proyección y reglas
 * con el flujo anónimo, y valida que la declaración sea del contribuyente del token. Por eso
 * estas acciones usan `fetchGet`/`fetchPost` (con JWT) y no las variantes `Public`.
 */
function toError(e: unknown, fallback: string): DeclarationReportError {
  if (e instanceof ApiError) {
    return { statusCode: e.status, message: e.message, code: e.errorCode }
  }
  return { statusCode: 500, message: fallback }
}

export async function getMyDeclarationReport(
  declarationId: number,
): Promise<Result<DeclarationReport, DeclarationReportError>> {
  try {
    const data = await fetchGet<DeclarationReport>(
      API_ROUTES.DECLARATION_REPORT.MY(declarationId),
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    console.error('[getMyDeclarationReport] Error:', e)
    return err(toError(e, 'No pudimos cargar el cálculo de tu declaración.'))
  }
}

/** "Autorizar y presentar": 9 (EnRevisionCliente) → 11 (PorPresentar). Idempotente. */
export async function authorizeMyDeclarationReport(
  declarationId: number,
): Promise<Result<DeclarationReportActionResult, DeclarationReportError>> {
  try {
    const data = await fetchPost<DeclarationReportActionResult>(
      API_ROUTES.DECLARATION_REPORT.MY_AUTHORIZE(declarationId),
      {},
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    console.error('[authorizeMyDeclarationReport] Error:', e)
    return err(toError(e, 'No pudimos registrar tu autorización.'))
  }
}

/** "Tengo una duda": 9 o 10 → 10 (RebotadaCliente), con el texto en el historial. */
export async function commentMyDeclarationReport(
  declarationId: number,
  comment: string,
): Promise<Result<DeclarationReportActionResult, DeclarationReportError>> {
  const parsed = reportCommentSchema.safeParse({ comment })
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Escribe tu duda.',
      code: 'INVALID_REQUEST',
    })
  }

  try {
    const data = await fetchPost<DeclarationReportActionResult>(
      API_ROUTES.DECLARATION_REPORT.MY_COMMENT(declarationId),
      { comment: parsed.data.comment },
      'declaration_report',
    )
    return ok(data)
  } catch (e) {
    console.error('[commentMyDeclarationReport] Error:', e)
    return err(toError(e, 'No pudimos enviar tu comentario.'))
  }
}
