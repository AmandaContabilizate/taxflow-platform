export interface FiscalScoreStatusBreakdown {
  statusId: number // 1..8
  status: string // nombre del DeclarationStatus (enum)
  count: number
  countsAsPresented: boolean
}

export interface FiscalScore {
  rfc: string
  total: number // total de declaraciones del RFC
  presented: number // declaraciones que cuentan como presentadas
  pending: number // total - presented
  score: number // 0-100 (2 decimales)
  breakdown: FiscalScoreStatusBreakdown[]
  hasCsfData: boolean // true si ya se leyó la Constancia de Situación Fiscal al menos una vez
  isReconciling: boolean // true si el scraper de declaraciones sigue corriendo para este RFC
  pendingVerificationCount: number // cuántas siguen "Por Revisar" (sembradas, sin confirmar aún)
}

export interface FiscalScoreError {
  statusCode: number
  message: string
  /** errorCode del backend (TAXPAYER_NOT_FOUND | INVALID_REQUEST | EMAIL_REQUIRED). */
  code?: string
}

// Error compartido por las acciones de declaraciones.
export type DeclarationsError = FiscalScoreError

// --- Regularizaciones ---
export type RegularizationBadge = 'NoPresentada' | 'NecesitaCorreccion' | 'EnProceso'

export interface RegularizationMonth {
  declarationId: number
  fiscalYear: number
  month: number
  periodValueId: number
  statusId: number
  statusLabel: string
  isContracted: boolean
  badge: RegularizationBadge
}

export interface Regularizations {
  rfc: string
  totalMonths: number
  contractedCount: number
  toContractCount: number
  advancePercent: number
  months: RegularizationMonth[]
}

// --- Plan a futuro ---
export type FuturePlanBadge = 'Siguiente' | 'Programada'

export interface FuturePlanItem {
  declarationId: number
  fiscalYear: number
  month: number
  periodValueId: number
  statusId: number
  statusLabel: string
  badge: FuturePlanBadge
}

export interface FuturePlan {
  rfc: string
  presentedThisYear: number
  remainingInPlan: number
  upcoming: FuturePlanItem[]
}

// --- Todas ---
export interface AllDeclarationItem {
  declarationId: number
  fiscalYear: number
  periodValueId: number | null
  month: number | null
  periodicityId: number | null
  periodicity: string | null // "Mensual" | "Bimestral" | "Anual"
  statusId: number
  statusCode: string
  statusLabel: string
  taxRegimeId: number | null
  regimeSatCode: string | null
  regimeName: string | null
  /** 1 = Regularización, 2 = Futuro. Null si no tiene venta activa asociada. */
  declarationKind: number | null
  acknowledgmentPdfUrl: string | null
  submittedAt: string | null
}

export interface AllDeclarations {
  rfc: string
  items: AllDeclarationItem[]
}

// --- Anuales ---
export interface AnnualCurrent {
  fiscalYear: number
  prepareFrom: string
  dueDate: string
  remainingDays: number
}

export interface AnnualHistoryItem {
  fiscalYear: number
  planName: string
  saleDate: string
}

export interface Annuals {
  rfc: string
  hasPurchase: boolean
  current: AnnualCurrent
  history: AnnualHistoryItem[]
}

// --- Comentarios ---
export interface DeclarationComment {
  id: number
  declarationId: number
  authorUserId: string
  authorName: string
  authorRole: string | null
  body: string
  createdAt: string
}
