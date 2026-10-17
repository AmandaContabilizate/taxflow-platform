/**
 * Activos fijos del 612 (Procedures, `api/FixedAssets`). La IA o la regla por clave de
 * producto los sugiere al calcular; el contador los confirma, les cambia el tipo, los
 * descarta o da de alta uno a mano. Solo los Confirmados entran a la depreciación.
 */

/** `Catalogs.FixedAssetType`. `annualRate` viene como fracción (0.25). */
export interface FixedAssetType {
  code: string
  name: string
  annualRate: number
  /** Tope deducible (automóvil 175,000). `null` = sin tope. */
  deductibleCap: number | null
}

export type FixedAssetStatus = 'Sugerido' | 'Confirmado' | 'Descartado'

/** Cada monto que se deprecia: la factura I (PUE) o cada pago P de una PPD. */
export interface FixedAssetLayer {
  id?: number
  uuid: string
  amount: number
  startFiscalYear: number
  startMonth: number
}

export interface FixedAsset {
  id: number
  rfc?: string
  /** Declaración en la que se detectó o se marcó. */
  declarationId?: number | null
  /** UUID de la factura que lo originó. */
  originUuid: string
  assetTypeCode: string
  assetTypeName?: string | null
  annualRate?: number | null
  deductibleCap?: number | null
  description: string | null
  /** El back podría mandarlo con otra capitalización; se compara normalizado. */
  status: FixedAssetStatus | string
  /** Quién lo marcó: "IA", "Regla" o "Contador". */
  source?: string | null
  /** Monto sugerido a depreciar sin IVA (sugerencias). */
  amount?: number | null
  /** Por qué la IA o la regla lo sugirió. */
  motivo?: string | null
  layers?: FixedAssetLayer[] | null
}

export interface CreateFixedAssetInput {
  rfc: string
  declarationId: number
  invoiceUuid: string
  assetTypeCode: string
  description: string
}

export interface UpdateFixedAssetInput {
  assetTypeCode?: string
  status?: FixedAssetStatus
  description?: string
}

export interface FixedAssetsError {
  statusCode: number
  message: string
  code?: string
}

/** El back podría mandar "CONFIRMADO" o "confirmado": se compara sin casing. */
export function fixedAssetStatusIs(asset: Pick<FixedAsset, 'status'>, status: FixedAssetStatus): boolean {
  return String(asset.status ?? '').trim().toLowerCase() === status.toLowerCase()
}
