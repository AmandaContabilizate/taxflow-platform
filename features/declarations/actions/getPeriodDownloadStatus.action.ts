'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, PeriodDownloadStatus } from '../types'

/**
 * Estatus de los 4 combos de descarga SAT del periodo de la declaración (facturas y
 * retenciones, emitidas y recibidas). No encola descargas.
 * Solo aplica a declaraciones mensuales: el backend responde DOWNLOAD_NOT_MONTHLY
 * si el periodo no es 101..112.
 */
export async function getPeriodDownloadStatus(
  declarationId: number,
): Promise<Result<PeriodDownloadStatus, DeclarationsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Parámetros inválidos.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<PeriodDownloadStatus>(
      API_ROUTES.DECLARATION.DOWNLOAD_FILES_PERIOD_STATUS(declarationId),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getPeriodDownloadStatus] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar el estado de las descargas.' })
  }
}
