'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type DownloadMonitor,
  type DownloadMonitorError,
  type DownloadMonitorFilters,
  downloadMonitorQuery,
} from '../types'

/**
 * Solicitudes de descarga en estatus transitorio (sin importar fecha) + las que cerraron (7-12) en
 * las últimas 24 h, agrupadas por su último estatus. Solo Developer.
 */
export async function getDownloadMonitor(
  filters: DownloadMonitorFilters,
): Promise<Result<DownloadMonitor, DownloadMonitorError>> {
  try {
    const data = await fetchGet<DownloadMonitor>(
      API_ROUTES.DOWNLOAD_MONITOR.LIST(downloadMonitorQuery(filters)),
      'download_monitor',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDownloadMonitor] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar el monitor de descargas.' })
  }
}
