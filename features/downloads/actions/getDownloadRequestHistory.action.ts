'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DownloadMonitorError, DownloadRequestHistory } from '../types'

/** Línea de tiempo completa de estatus de una solicitud (Id de db-filedownload) y lo que la liga. */
export async function getDownloadRequestHistory(
  id: number,
): Promise<Result<DownloadRequestHistory, DownloadMonitorError>> {
  if (!id || id <= 0) {
    return err({ statusCode: 400, message: 'Parámetros inválidos.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<DownloadRequestHistory>(API_ROUTES.DOWNLOAD_MONITOR.HISTORY(id), 'download_monitor')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDownloadRequestHistory] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar el historial de la descarga.' })
  }
}
