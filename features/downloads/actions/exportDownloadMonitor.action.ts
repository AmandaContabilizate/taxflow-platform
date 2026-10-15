'use server'

import { ApiError, fetchGetBlob } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DownloadableFile } from '@/lib/common/downloadFile'
import { type DownloadMonitorError, type DownloadMonitorFilters, downloadMonitorQuery } from '../types'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

/** GET download-monitor/export: .xlsx con una hoja por estatus, mismos filtros que la pantalla y sin tope. */
export async function exportDownloadMonitor(
  filters: DownloadMonitorFilters,
): Promise<Result<DownloadableFile, DownloadMonitorError>> {
  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.DOWNLOAD_MONITOR.EXPORT(downloadMonitorQuery(filters)),
      'download_monitor',
    )
    const buffer = Buffer.from(await blob.arrayBuffer())
    return ok({
      base64: buffer.toString('base64'),
      filename: filename ?? `MonitorDescargas_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}.xlsx`,
      contentType: blob.type || XLSX_MIME,
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[exportDownloadMonitor] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos generar el Excel del monitor de descargas.' })
  }
}
