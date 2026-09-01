'use server'

import { ApiError, fetchGetBlob } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { exportReportSchema, type ExportReportInput } from '../schemas/exportReport.schema'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export interface ExportedFile {
  base64: string
  filename: string
  contentType: string
}

export interface ExportReportError {
  statusCode: number
  message: string
  /** 'EXPORT_NO_RESULTS' | 'INVALID_INPUT' del catálogo del back, si aplica. */
  code?: string
}

/** GET declaration/export-report (Procedures). Devuelve el .xlsx en base64 para cruzar a cliente. */
export async function exportDeclarationsReport(
  input: ExportReportInput = {},
): Promise<Result<ExportedFile, ExportReportError>> {
  const parsed = exportReportSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Parámetros inválidos.',
      code: 'INVALID_INPUT',
    })
  }

  try {
    const { blob, filename } = await fetchGetBlob(
      API_ROUTES.DECLARATION.EXPORT_REPORT(parsed.data),
      'declaration',
    )
    const buffer = Buffer.from(await blob.arrayBuffer())
    return ok({
      base64: buffer.toString('base64'),
      filename: filename ?? 'Declaraciones.xlsx',
      contentType: blob.type || XLSX_MIME,
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[exportDeclarationsReport] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos generar el reporte.' })
  }
}
