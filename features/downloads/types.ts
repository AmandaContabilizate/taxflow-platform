/**
 * Monitor de solicitudes de descarga SAT/Fispal (GET download-monitor, Procedures).
 * Ids de db-filedownload. Fechas `DateTimeOffset` en ISO; periodo (`startDateRequest`/`endDateRequest`)
 * sin zona.
 */
export interface DownloadMonitorItem {
  id: number
  externalId: string | null
  taxpayerId: number
  rfc: string | null
  taxpayerName: string | null
  email: string | null
  startDateRequest: string | null
  endDateRequest: string | null
  dateRequest: string | null
  dateStartProcess: string | null
  dateEndProcess: string | null
  statusId: number
  statusAt: string
  /** = statusAt cuando el estatus actual es final (7-12); null si sigue en transitorio. */
  closedAt: string | null
  secondsInStatus: number
  /** dateRequest → closedAt, o → ahora si sigue en transitorio. */
  totalSeconds: number | null
  isIssued: boolean
  isInvoice: boolean
  downloadKindId: number
  downloadKindName: string | null
  systemOriginId: number
  systemOriginName: string | null
  /** Flujo NUEVO que reemplazó a esta (requeue/expire). */
  downloadRequestRelatedId: number | null
  expectedFiles: number | null
  declarationId: number | null
  /** Veces que Fispal respondió "ZIP no listo" (estatus 13). */
  retryCount: number
  note: string | null
}

export interface DownloadMonitorGroup {
  statusId: number
  statusCode: string
  statusLabel: string
  isTransient: boolean
  /** Total real; `items` puede venir recortado a `maxItemsPerGroup` (los más recientes). */
  count: number
  items: DownloadMonitorItem[]
}

export interface DownloadMonitor {
  generatedAt: string
  finalSince: string
  maxItemsPerGroup: number
  groups: DownloadMonitorGroup[]
}

export interface DownloadRequestStatusEntry {
  id: number
  statusId: number
  statusCode: string
  statusLabel: string
  createAt: string
}

export interface DownloadRequestHistory {
  downloadRequestId: number
  statuses: DownloadRequestStatusEntry[]
  declarationIds: number[]
  relatedRequestIds: number[]
}

export interface DownloadMonitorFilters {
  rfc?: string
  email?: string
  /** yyyy-MM-dd */
  from?: string
  /** yyyy-MM-dd */
  to?: string
}

export interface DownloadMonitorError {
  statusCode: number
  message: string
  code?: string
}

export function downloadMonitorQuery(f: DownloadMonitorFilters): string {
  const qs = new URLSearchParams()
  if (f.rfc?.trim()) qs.set('rfc', f.rfc.trim())
  if (f.email?.trim()) qs.set('email', f.email.trim())
  if (f.from) qs.set('from', f.from)
  if (f.to) qs.set('to', f.to)
  return qs.toString()
}
