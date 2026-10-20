/**
 * Saldos a favor de IVA del 612 (Procedures, `api/IvaFavorBalances`). Cada saldo guarda su
 * origen (folio, tipo de declaración, fecha, periodo y monto original) y en qué declaraciones
 * se acreditó. El clasificador los aplica del más antiguo al más reciente.
 *
 * Contrato: `IvaFavorBalanceFeature.cs` del back (System.Text.Json, camelCase).
 * Remanente = `originalAmount − appliedOutsideAmount − Σ applications.appliedAmount`.
 */

/** `IvaFavorApplicationDto`: cuánto de un saldo se acreditó en una declaración del sistema. */
export interface IvaFavorApplication {
  declarationId: number
  fiscalYear: number
  /** `null` si la declaración no es mensual. */
  month: number | null
  appliedAmount: number
}

/** `IvaFavorBalanceSources` del back. */
export type IvaFavorBalanceSource = 'Clasificador' | 'Manual' | 'Robot'

export type IvaFavorDeclarationType = 'Normal' | 'Complementaria'

/** Código del catálogo `Declarations.IvaFavorBalanceSource`. */
export type IvaFavorBalanceSourceCode = 'Classifier' | 'Manual' | 'Robot'

/**
 * `IvaFavorBalanceDto`. Periodo, folio, tipo y fecha no se guardan en el saldo: el back los lee
 * de la declaración de origen (`originDeclarationId`) o, en capturas manuales, de su origen externo.
 */
export interface IvaFavorBalance {
  id: number
  /** Declaración del sistema que generó el saldo. `null` = capturado a mano. */
  originDeclarationId: number | null
  originFiscalYear: number
  originMonth: number
  /** Folio (número de operación) del acuse. Se llena al presentar. */
  operationNumber: string | null
  /** 0 = Normal, >0 = número de complementaria. */
  complementNumber: number
  /** Derivado de `complementNumber`. */
  declarationType: IvaFavorDeclarationType | null
  /** `DateOnly` → "yyyy-MM-dd". */
  presentedDate: string | null
  originalAmount: number
  /** Acreditado en declaraciones que el sistema no tiene (capturas manuales). */
  appliedOutsideAmount: number
  remainingAmount: number
  /** Nombre para mostrar. */
  source: IvaFavorBalanceSource
  sourceCode: IvaFavorBalanceSourceCode
  applications: IvaFavorApplication[]
}

/**
 * `SaveIvaFavorBalanceRequestDto` del POST. En el back folio, tipo, fecha y remanente son
 * opcionales (remanente = original); el front pide todos en la captura manual.
 */
export interface CreateIvaFavorBalanceInput {
  rfc: string
  originFiscalYear: number
  originMonth: number
  operationNumber: string
  declarationType: IvaFavorDeclarationType
  presentedDate: string
  originalAmount: number
  remainingAmount: number
}

/**
 * PUT: todos opcionales. Solo saldos con origen externo (`originDeclarationId` null); uno
 * generado por una declaración del sistema se corrige en esa declaración (→ INVALID_INPUT). En
 * saldos que no son `Manual` solo se aceptan folio, tipo y fecha (periodo o montos → INVALID_INPUT).
 * `declarationType` lo traduce el back a `complementNumber` (Complementaria sin número = 1).
 */
export type UpdateIvaFavorBalanceInput = Partial<Omit<CreateIvaFavorBalanceInput, 'rfc'>>

export interface IvaFavorBalancesError {
  statusCode: number
  message: string
  code?: string
}

/** Suma de lo acreditado en declaraciones del sistema. */
export function appliedInSystem(b: Pick<IvaFavorBalance, 'applications'>): number {
  return (b.applications ?? []).reduce((acc, a) => acc + (Number(a.appliedAmount) || 0), 0)
}
