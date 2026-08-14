/**
 * Reporte público de la declaración (microservicio Procedures,
 * `apiType: "declaration_report"`).
 *
 * El cliente recibe por correo un enlace a `/reporte?t={token}`. El token es un
 * string AES cifrado (Base64 url-safe) generado por el backend: es la única
 * credencial del flujo, el front no lo interpreta y lo reenvía tal cual.
 */

/** Decimales de .NET: llegan como number, o como string cuando el clasificador los serializa. */
export type Money = number | string | null

/** Tope de `DeclarationReportCommentRequestDto.Comment` en el backend. */
export const REPORT_COMMENT_MAX_LENGTH = 500

/** Estatus de `Declarations.StatusDeclaration` relevantes para este flujo. */
export const DECLARATION_STATUS = {
  CLIENT_REVIEW: 9,
  CLIENT_REJECTED: 10,
  TO_SUBMIT: 11,
} as const

/** Espejo de `DeclarationReportDto`. */
export interface DeclarationReport {
  declarationId: number
  rfc: string
  legalName: string | null
  fiscalYear: number
  periodValueId: number | null
  /** 1-12 en mensuales; null en bimestrales/anuales. */
  month: number | null
  /** Etiqueta lista para pintar: "Julio 2026". */
  periodLabel: string | null
  periodicityId: number | null
  periodicity: string | null
  taxRegimeId: number | null
  regimeSatCode: string | null
  regimeName: string | null
  /** Primera actividad económica activa del contribuyente en ese régimen. */
  activity: string | null
  activities: string[]
  statusId: number
  statusCode: string | null
  statusLabel: string | null
  /** true solo con statusId === 9: única situación en que los botones tienen efecto. */
  canAuthorize: boolean
  totalDeclaration: Money
  income: Money
  ivaFavor: Money
  ivaCargo: Money
  ivaIngresos: Money
  ivaGastos: Money
  ivaRetenido: Money
  isrRetenido: Money
  personalDeductions: Money
  /** `DeclarationSummary.RawIvaJson` deserializado. Sin tipar: cambia por régimen. */
  ivaDetail: unknown
  /** `DeclarationSummary.RawIsrJson` deserializado. Sin tipar: cambia por régimen. */
  isrDetail: unknown
  submittedAt: string | null
  /** Acuse del SAT (solo si ya se presentó); NO es el reporte de esta pantalla. */
  acknowledgmentPdfUrl: string | null
}

/** Espejo de `DeclarationReportActionResultDto`. */
export interface DeclarationReportActionResult {
  declarationId: number
  statusId: number
  statusCode: string | null
  statusLabel: string | null
  /** false cuando la declaración ya estaba en el estatus destino. */
  changed: boolean
}

export interface DeclarationReportError {
  statusCode: number
  message: string
  /**
   * errorCode del backend (`extensions.errorCode` del ProblemDetails):
   * REPORT_TOKEN_INVALID | DECLARATION_NOT_FOUND | INVALID_STATUS_TRANSITION |
   * INVALID_REQUEST | UPDATE_FAILED.
   */
  code?: string
}

export type ReportRowFormat = 'money' | 'percent'
export type ReportRowEmphasis = 'normal' | 'sub' | 'total'
export type ReportRowTone = 'neutral' | 'positive' | 'negative'

/** Renglón del desglose, ya normalizado desde el JSON crudo del clasificador. */
export interface ReportDetailRow {
  label: string
  amount: Money
  format: ReportRowFormat
  emphasis: ReportRowEmphasis
  tone: ReportRowTone
}

/** Bloque del desglose (IVA, ISR, o un servicio del 625). */
export interface ReportDetailBlock {
  key: string
  title: string
  tag: string | null
  rows: ReportDetailRow[]
}
