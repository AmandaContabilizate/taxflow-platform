'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  declarationDownloadErrorMessage,
  type DeclarationsError,
  type RunDeclarationDownloadResult,
} from '../types'

/**
 * Re-encola la descarga de los 4 archivos SAT (facturas emitidas/recibidas, retenciones
 * emitidas/recibidas) del periodo de la declaración. Máximo 1 corrida por día calendario (MX).
 */
export async function runDeclarationDownload(
  declarationId: number,
): Promise<Result<RunDeclarationDownloadResult, DeclarationsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Declaración inválida.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPost<RunDeclarationDownloadResult>(
      API_ROUTES.DECLARATION.DOWNLOAD_FILES_RUN(declarationId),
      undefined,
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        message: declarationDownloadErrorMessage(e.errorCode, e.message || 'No pudimos encolar la descarga.'),
        code: e.errorCode,
      })
    }
    console.error('[runDeclarationDownload] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos encolar la descarga.' })
  }
}
