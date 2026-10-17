/**
 * Activos fijos del 612 (Procedures, `api/FixedAssets`). La IA o la regla por clave de
 * producto los sugiere al calcular; el contador los confirma, les cambia el tipo, los
 * descarta o da de alta uno a mano. Solo los Confirmados entran a la depreciación.
 *
 * Contrato: `FixedAssetDtos.cs` del back (System.Text.Json, camelCase). Montos y tasas como
 * número; fechas ISO; UUID en mayúsculas.
 */

/** `FixedAssetTypeDto` (`GET /api/FixedAssets/types`). `annualRate` es fracción (0.25). */
export interface FixedAssetType {
  id: number
  code: string
  name: string
  annualRate: number
  /** Tope deducible (automóvil 175,000). `null` = sin tope. */
  deductibleCap: number | null
}

/** `FixedAssetStatuses` del back. `Sugerido` solo lo pone el clasificador. */
export type FixedAssetStatus = 'Sugerido' | 'Confirmado' | 'Descartado'

/** Lo que el contador puede mandar en el PUT. */
export type FixedAssetDecision = Exclude<FixedAssetStatus, 'Sugerido'>

/** `FixedAssetSources` del back: quién lo sugirió o lo dio de alta. */
export type FixedAssetSource = 'IA' | 'Regla' | 'Contador'

/** `FixedAssetLayerDto`: cada monto que se deprecia (la factura I PUE o cada pago P de una PPD). */
export interface FixedAssetLayer {
  id: number
  uuid: string
  /** Sin IVA y antes del tope. */
  amount: number
  startFiscalYear: number
  startMonth: number
}

/** `FixedAssetDto` (lista, alta y cambio). */
export interface FixedAsset {
  id: number
  /** UUID de la factura I que lo originó. */
  originUuid: string
  description: string | null
  assetTypeCode: string
  assetTypeName: string
  annualRate: number
  deductibleCap: number | null
  status: FixedAssetStatus
  source: FixedAssetSource
  /** Declaración cuyo cálculo lo sugirió. `null` en altas del contador. */
  suggestedInDeclarationId: number | null
  /** Cuándo se confirmó o descartó por última vez. */
  confirmedAt: string | null
  /** `SuggestedAmount`: monto sin IVA que propuso el clasificador. `null` en altas del contador. */
  amount: number | null
  /** `SuggestionReason`: por qué la IA o la regla lo sugirió. */
  motivo: string | null
  layers: FixedAssetLayer[]
}

/** `CreateFixedAssetRequestDto`. Solo facturas I recibidas por el contribuyente. */
export interface CreateFixedAssetInput {
  rfc: string
  /** Opcional en el back: solo valida que la declaración sea del RFC. */
  declarationId?: number
  invoiceUuid: string
  assetTypeCode: string
  description?: string
}

/** `UpdateFixedAssetRequestDto`. Solo viaja lo que cambia. */
export interface UpdateFixedAssetInput {
  assetTypeCode?: string
  status?: FixedAssetDecision
  description?: string
}

export interface FixedAssetsError {
  statusCode: number
  message: string
  /** `errorCode` del ProblemDetails (p. ej. `FIXED_ASSET_ALREADY_EXISTS`). */
  code?: string
}

export function fixedAssetStatusIs(asset: Pick<FixedAsset, 'status'>, status: FixedAssetStatus): boolean {
  return asset.status === status
}
