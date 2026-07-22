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
