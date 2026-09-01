import type { DocumentMetadata } from '@/features/taxpayers/actions/getDocumentMetadata.action'
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
