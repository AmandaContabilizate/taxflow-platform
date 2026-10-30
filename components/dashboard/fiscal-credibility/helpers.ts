import type { DocumentMetadata } from '@/features/taxpayers/actions/getDocumentMetadata.action'
import type { RfcStatus } from '@/features/taxpayers/actions/getRfcStatus.action'
import type { PdfDocument } from '@/features/taxpayers/actions/getTaxCertificate.action'
import { downloadFile, toBlob } from '@/lib/common/downloadFile'
import type { DocState } from './types'

export function classifyError(statusCode: number, message: string): DocState {
  if (statusCode === 404) return 'missing'
  if (statusCode === 401 || statusCode === 403) return 'forbidden'
  if (/taxpayer with rfc .* not found/i.test(message) || /rfc .* not found/i.test(message)) {
    return 'rfc-not-found'
  }
  return 'error'
}

function pickString(meta: DocumentMetadata, keys: string[]): string | null {
  for (const key of keys) {
    const value = meta[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export const readDownloadDate = (meta: DocumentMetadata) =>
  pickString(meta, [
    'downloadDate',
    'downloadedAt',
    'lastDownloadDate',
    'fechaDescarga',
    'generatedAt',
    'generationDate',
    'createdAt',
    'date',
    'fecha',
  ])

export const readComplianceStatus = (meta: DocumentMetadata) =>
  pickString(meta, ['status', 'complianceStatus', 'opinionStatus', 'estatus'])

const readBool = (meta: DocumentMetadata, key: string) =>
  typeof meta[key] === 'boolean' ? (meta[key] as boolean) : undefined

export const readHasFile = (meta: DocumentMetadata) => readBool(meta, 'hasFile')
export const readIsStale = (meta: DocumentMetadata) => readBool(meta, 'isStale')

export const read69BStatus = (status: RfcStatus) => {
  const value = status.status69B ?? status.status
  return typeof value === 'string' ? value.trim() : ''
}

/** true/false segun el 69-B; null cuando la respuesta no alcanza para decidir. */
export function read69BFlag(status: RfcStatus): boolean | null {
  if (typeof status.isInBlacklist === 'boolean') return status.isInBlacklist
  const value = status.status69B ?? status.status
  if (typeof value === 'string') return value.trim() !== ''
  return null
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function downloadPdf(doc: PdfDocument) {
  downloadFile({ ...doc, contentType: doc.contentType || 'application/pdf' })
}

export const pdfToBlobUrl = (doc: PdfDocument): string =>
  URL.createObjectURL(toBlob({ ...doc, contentType: doc.contentType || 'application/pdf' }))
