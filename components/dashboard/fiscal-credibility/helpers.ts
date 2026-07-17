import type { DocumentMetadata } from '@/features/taxpayers/actions/getDocumentMetadata.action'
import type { PdfDocument } from '@/features/taxpayers/actions/getTaxCertificate.action'
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

function toBlob(doc: PdfDocument): Blob {
  const byteChars = atob(doc.base64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  return new Blob([bytes], { type: doc.contentType || 'application/pdf' })
}

export function downloadPdf(doc: PdfDocument) {
  const url = URL.createObjectURL(toBlob(doc))
  const a = document.createElement('a')
  a.href = url
  a.download = doc.filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const pdfToBlobUrl = (doc: PdfDocument): string => URL.createObjectURL(toBlob(doc))
