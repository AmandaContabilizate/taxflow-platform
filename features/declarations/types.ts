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

// --- Recálculo y reclasificación manual ---

/**
 * Corrección manual del contador sobre un CFDI. Solo se mandan los campos que
 * se quieren cambiar: el clasificador aplica los ajustes con `exclude_unset`, así
 * que enviar `classification: null` borraría la categoría en vez de dejarla igual.
 */
export interface ClassificationAdjustment {
  uuid: string
  /** `name` del catálogo de clasificaciones; si no existe, el backend responde 422. */
  classification?: string
  isDeductible?: boolean
  /** true = gasto, false = ingreso. */
  isExpense?: boolean
  activityId?: number
  reason?: string
}

/** Categoría de `classification.clasificacion` (GET catalogs/classifications). */
export interface ClassificationCategory {
  id: number
  name: string
  isExpense: boolean
  description: string | null
}

/** Clasificación de un comprobante dentro del resultado del recálculo. */
export interface RecalculatedClassification {
  uuid: string
  classification: string | null
  isDeductible: boolean
  isExpense: boolean
  reason: string | null
}

/**
 * Cuántos XML llegaron realmente al clasificador. Va a propósito en el contrato:
 * si el cálculo se ve raro, aquí se ve si el problema está en el payload.
 */
export interface RecalculationInputSummary {
  issuedXmlCount: number
  receivedXmlCount: number
  totalXmlCount: number
  manualDeductions: number
  yearToDateIvaFavor: number | null
}

/**
 * Respuesta de `POST declaration/recalculate`. Ya trae los datos nuevos, así que
 * la pantalla se repinta sin un segundo round-trip al terminar el spinner.
 */
export interface RecalculationResult {
  declarationId: number
  rfc: string
  fiscalYear: number
  periodValueId: number | null
  regimeSatCode: string
  statusId: number
  /** true = corrió con ajustes manuales (reclasificación). */
  reclassified: boolean
  /** UUID de los ajustes que el clasificador alcanzó a aplicar. */
  appliedAdjustments: string[]
  accumulatedIncome: number | null
  annualTax: number | null
  withheldTax: number | null
  totalDeclaration: number | null
  personalDeductions: number | null
  income: number | null
  ivaCargo: number | null
  ivaFavor: number | null
  ivaIngresos: number | null
  ivaGastos: number | null
  ivaRetenido: number | null
  isrRetenido: number | null
  /** JSON crudo del clasificador; su forma depende del régimen. */
  isrDetail: Record<string, unknown> | null
  ivaDetail: Record<string, unknown> | null
  classifications: RecalculatedClassification[]
  input: RecalculationInputSummary
}

/**
 * Factura del periodo con su clasificación (`DeclarationInvoiceItemDto`).
 * OJO: no es el mismo DTO que `DeclarationInvoice` de operaciones — este sale de
 * Procedures y trae el universo completo del periodo, incluidas las no deducibles
 * y las de declaraciones en proceso.
 */
export interface DeclarationPeriodInvoice {
  id: number
  uuid: string
  folio: string | null
  issuer: { rfc: string; name: string } | null
  receiver: { rfc: string; name: string } | null
  /** Fecha de expedición del CFDI. */
  invoiceDate: string
  /** Fecha de timbrado. */
  stampDate: string
  total: number
  uso: string | null
  /** Descripción del tipo de CFDI ("Ingreso", "Egreso", …). */
  typeId: string
  /** Enum TipoComprobante: 0 desconocido, 1 I, 2 E, 3 T, 4 N, 5 P. */
  tipoComprobante: number
  /** Enum StatusComprobante: 0 desconocido, 1 vigente, 2 cancelado, 3 pendiente. */
  statusComprobante: number
  status: string
  /** true = el contribuyente es el emisor. */
  isIssued: boolean
  declarationId: number | null
  /** null = todavía no se ha clasificado. */
  isDeductible: boolean | null
  reason: string | null
  classification: string | null
  classificationId: number | null
  isExpense: boolean | null
  activityId: number | null
  /** Claves prod/serv SAT de los conceptos. */
  productServiceKeys: string[]
  /** Suma de Invoices.Withholds; null si el CFDI no trae retenciones. */
  withheldAmount: number | null
  withheldTaxableAmount: number | null
  /**
   * Periodo que declara la factura global (Publico en General): "Febrero 2025" o
   * "Enero-Febrero 2025". null cuando el CFDI no es global.
   */
  period: string | null
}

/**
 * Lo minimo que necesita la pantalla de detalle del contribuyente. Se arma desde
 * `AllDeclarationItem` mas el RFC/razon social del RFC activo: el cliente no puede
 * pegarle al EP `/general` (es de contadores).
 */
export interface ClientDeclarationSubject {
  declarationId: number
  rfc: string
  legalName: string
  /** Etiqueta ya resuelta del periodo ("Mayo 2025" o "Ejercicio 2025"). */
  periodo: string
  fiscalYear: number
  statusCode: string
  statusLabel: string
  regimeName: string | null
  periodicity: string | null
  acknowledgmentPdfUrl: string | null
  submittedAt: string | null
}

/**
 * CFDI de una declaracion visto por el cliente (`ClientDeclarationInvoiceDto`).
 * A proposito no trae clasificacion: solo el detalle del comprobante y si quedo
 * deducible (sale de `DeclarationInvoice.IsValid`).
 */
export interface ClientDeclarationInvoice {
  id: number
  uuid: string
  folio: string | null
  issuer: { rfc: string; name: string } | null
  receiver: { rfc: string; name: string } | null
  /** Fecha de expedicion del CFDI. */
  invoiceDate: string
  /** Fecha de timbrado. */
  stampDate: string
  total: number
  uso: string | null
  /** Descripcion del tipo de CFDI ("Ingreso", "Egreso", ...). */
  typeId: string
  /** Enum TipoComprobante: 0 desconocido, 1 I, 2 E, 3 T, 4 N, 5 P. */
  tipoComprobante: number
  /** Enum StatusComprobante: 0 desconocido, 1 vigente, 2 cancelado. */
  statusComprobante: number
  status: string
  /** true = el contribuyente es el emisor. */
  isIssued: boolean
  /** null = el clasificador todavia no la evaluo. */
  isDeductible: boolean | null
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
