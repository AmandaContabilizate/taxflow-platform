/**
 * Saldos a favor de IVA del 612 (Procedures, `api/IvaFavorBalances`). Cada saldo guarda su
 * origen (folio, tipo de declaración, fecha, periodo y monto original) y en qué declaraciones
 * se acreditó. El clasificador los aplica del más antiguo al más reciente.
 */

/** `Declarations.IvaFavorApplication`: cuánto de un saldo se acreditó en una declaración. */
export interface IvaFavorApplication {
  id?: number
  declarationId: number
  fiscalYear?: number | null
  month?: number | null
  amount: number
  appliedAt?: string | null
}

export interface IvaFavorBalance {
  id: number
  rfc?: string
  originFiscalYear: number
  originMonth: number
  /** Folio (número de operación) del acuse. Se llena al presentar. */
  operationNumber: string | null
  /** "Normal" o "Complementaria". */
  declarationType: string | null
  presentedDate: string | null
  originalAmount: number
  remainingAmount: number
  /** Declaración del sistema que generó el saldo. `null` = capturado a mano. */
  originDeclarationId?: number | null
  /** "Sistema" o "Manual". */
  source?: string | null
  applications?: IvaFavorApplication[] | null
}

export type IvaFavorDeclarationType = 'Normal' | 'Complementaria'

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

export type UpdateIvaFavorBalanceInput = Partial<Omit<CreateIvaFavorBalanceInput, 'rfc'>>

export interface IvaFavorBalancesError {
  statusCode: number
  message: string
  code?: string
}
