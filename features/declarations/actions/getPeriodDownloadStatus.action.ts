'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, PeriodDownloadStatus } from '../types'

/**
 * Estatus de los 4 combos de descarga SAT del periodo mensual (facturas y
 * retenciones, emitidas y recibidas). Solo lectura — no encola nada.
 * Solo aplica a periodos mensuales (101..112).
 */
export async function getPeriodDownloadStatus(
  rfc: string,
  fiscalYear: number,
  period: number,
): Promise<Result<PeriodDownloadStatus, DeclarationsError>> {
  if (!rfc || period < 101 || period > 112 || fiscalYear < 2000 || fiscalYear > 2100) {
    return err({ statusCode: 400, message: 'Parámetros inválidos.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<PeriodDownloadStatus>(
      API_ROUTES.DECLARATION.DOWNLOAD_FILES_PERIOD_STATUS(rfc, fiscalYear, period),
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
