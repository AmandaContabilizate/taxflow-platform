/**
 * Espejo de los DTOs del módulo Cancelaciones (gerencia comercial). Contratos de §4.1 del
 * requerimiento "Cancelación lógica de declaraciones y clientes": Reports (búsqueda, listado,
 * historial), Procedures (motivos, cancelar, reactivar) e Identity (baja/reactivación del RFC).
 */

/** `Catalogs.AccountStatus`: 1 Active, 2 DeactivatedSoft, 3 DeactivatedHard. */
export const ACCOUNT_STATUS = {
  ACTIVE: 1,
  DEACTIVATED_SOFT: 2,
  DEACTIVATED_HARD: 3,
} as const

/** `Catalogs.StatusDeclaration`: 19 CommercialCancelled ("Cancelada"); 18 la escriben los robots. */
export const DECLARATION_STATUS_CANCELLED = 19
export const DECLARATION_STATUS_REGIME_CANCELLED = 18
/** 16 En proceso en Legacy: se puede cancelar aquí, pero no cancela nada en Contabox Legacy. */
export const DECLARATION_STATUS_LEGACY = 16
/** El contador ya trabajó estas (9 Por autorizar, 10 Rechazada, 11 Por presentar). */
export const DECLARATION_STATUSES_WORKED = new Set<number>([9, 10, 11])

/** Motivo 99 "Otro" del catálogo de cancelación de declaraciones: exige nota. */
export const CANCELLATION_REASON_OTHER = 99
/** `Catalogs.DeactivationReason` 7 CommercialCancellation (baja de cliente por gerencia). */
export const DEACTIVATION_REASON_COMMERCIAL = 7

/** Fila de `GET cancellations/taxpayers/search`. */
export interface CancellationTaxpayer {
  taxpayerId: number
  rfc: string
  legalName: string | null
  email: string | null
  accountStatusId: number
  deactivatedAt: string | null
  accountantName: string | null
  sellerName: string | null
}

export interface CancellationTaxpayerSearch {
  items: CancellationTaxpayer[]
  total: number
}

/** Fila de `GET cancellations/taxpayers/{id}/declarations`. */
export interface CancellationDeclaration {
  declarationId: number
  fiscalYear: number
  /** `Catalogs.Period`: 101-112 mensual, 201-206 bimestral, 501 anual. */
  periodValueId: number | null
  taxRegimeId: number | null
  regimeSatCode: string | null
  statusId: number
  statusCode: string
  statusLabel: string
  complementNumber: number
  saleItemId: number | null
  planName: string | null
  accountantName: string | null
  cancellable: boolean
  /** Por qué no se puede cancelar (texto del back), null si `cancellable`. */
  notCancellableReason: string | null
  /** En 6 o en 11 con intento de posteo vivo: el back la rechaza con DECLARATION_IN_FLIGHT. */
  inFlight: boolean
}

/** Saldo prepagado, solo informativo: el reembolso se decide fuera del sistema. */
export interface PrepaidBalance {
  assignedNotPresented: number
  unassignedCredits: number
}

export interface CancellationDeclarationsResponse {
  items: CancellationDeclaration[]
  prepaid: PrepaidBalance | null
}

/** `Catalogs.DeclarationCancellationReason`. */
export interface CancellationReason {
  id: number
  code: string
  description: string
  requiresNote: boolean
}

export interface CancelDeclarationsResult {
  cancelled: { declarationId: number; oldStatusId: number }[]
  rejected: { declarationId: number; errorCode: string; message: string }[]
}

export interface ReactivateDeclarationResult {
  declarationId: number
  statusId: number
}

/** `GET taxpayers/{id}/deactivation-preview` (origin/dev + campos de gerencia). */
export interface DeactivationPreview {
  currentStatus: number
  hasDeclarationInFlight: boolean
  prepaid: PrepaidBalance | null
  canHardDelete: boolean
  hardAllowedFrom: string | null
  declarationsToCancel: number
  declarationsInFlight: number[]
  subscription: { found: boolean; id: string | null; sharedWithOtherRfc: boolean } | null
}

/** `DeactivateTaxpayersResult` del back; solo se pinta lo que importa a gerencia. */
export interface DeactivateTaxpayerResult {
  taxpayerId?: number
  accountStatusId?: number
  affectedRows?: Record<string, unknown> | null
  warnings?: string[] | null
}

export interface ReactivateTaxpayerResult {
  taxpayerId: number
  deactivationId: number
  accountStatus: number
  userReactivated: boolean
  /** Ids de las declaraciones que regresaron de 19. */
  declarationsReactivated: number[]
  credentialsMustBeReloaded: boolean
  warnings: string[] | null
}

/** Renglón de `Users.TaxpayerDeactivation` en el historial (incluye reactivaciones, AccountStatusId = 1). */
export interface TaxpayerDeactivationLog {
  id: number
  taxpayerId: number
  accountStatusId: number
  deactivationReasonId: number | null
  reasonCode?: string | null
  reasonDescription?: string | null
  deactivationOriginId: number | null
  reasonNote: string | null
  requestReference: string | null
  affectedRowsJson: string | null
  createdAt: string
  createdBy: string | null
  createdByName: string | null
}

/** `DeclarationLog` con `Source LIKE 'gerencia-%'` más el periodo y régimen de la declaración. */
export interface CancellationDeclarationLog {
  logId: number
  declarationId: number
  oldStatusId: number | null
  newStatusId: number
  changedAt: string
  changedBy: string | null
  changedByName: string | null
  /** gerencia-cancel | gerencia-cancel-cliente | gerencia-reactivate */
  source: string
  note: string | null
  fiscalYear: number | null
  periodValueId: number | null
  regimeSatCode: string | null
  complementNumber: number | null
  /** Estatus actual de la declaración, para saber si todavía se puede reactivar. */
  currentStatusId: number | null
}

export interface CancellationHistory {
  taxpayer: TaxpayerDeactivationLog[]
  declarations: CancellationDeclarationLog[]
}

export interface CancellationsError {
  statusCode: number
  message: string
  code?: string
}
