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
  /** Tope de IVA acreditable por activo (AUTOMOVIL 28,000; AUTOMOVIL_ELECTRICO 40,000). Opcional: un back viejo no lo manda. */
  ivaCreditCap?: number | null
}

/**
 * Nombre (español) del catálogo `Declarations.FixedAssetStatus`, el que trae `status`.
 * `Sugerido` solo lo pone el clasificador; `Vendido`/`Perdido` salen de la baja (`/disposal`).
 */
export type FixedAssetStatus = 'Sugerido' | 'Confirmado' | 'Descartado' | 'Vendido' | 'Perdido'

/** Código del mismo catálogo (`statusCode`). */
export type FixedAssetStatusCode = 'Suggested' | 'Confirmed' | 'Discarded' | 'Sold' | 'Lost'

/** Lo que el contador puede mandar en el PUT (el back acepta nombre o código). */
export type FixedAssetDecision = 'Confirmado' | 'Descartado'

/** Tipo de baja (`POST /disposal`). */
export type FixedAssetDisposalKind = 'Sold' | 'Lost'

/** Nombre (español) del catálogo `Declarations.FixedAssetSource`: quién lo sugirió o lo dio de alta. */
export type FixedAssetSource = 'IA' | 'Regla' | 'Contador'

/** Código del mismo catálogo (`sourceCode`). */
export type FixedAssetSourceCode = 'AI' | 'Rule' | 'Accountant'

/** `FixedAssetLayerDto`: cada monto que se deprecia (la factura I PUE o cada pago P de una PPD). */
export interface FixedAssetLayer {
  id: number
  uuid: string
  /** Sin IVA y antes del tope. */
  amount: number
  /** Fecha del comprobante (mes de adquisición para el INPC). `null` si no está descargado. */
  acquisitionDate: string | null
  startFiscalYear: number
  startMonth: number
}

/** `FixedAssetDisposalDto`: venta o pérdida. Precio, comprador y CFDI solo en ventas. */
export interface FixedAssetDisposal {
  /** `DateOnly` → "yyyy-MM-dd". */
  disposalDate: string
  salePrice: number | null
  buyerRfc: string | null
  buyerName: string | null
  saleInvoiceUuid: string | null
  /** El CFDI de venta ya descargado (I emitido por el contribuyente). */
  saleInvoiceId: number | null
  notes: string | null
}

/**
 * `FixedAssetCaptureDto`: activo que el cliente ya venía depreciando y no tiene factura en el
 * sistema (R7). El monto deducible lo deriva el back: mensual × 12 ÷ tasa del tipo.
 */
export interface FixedAssetCapture {
  monthlyAmount: number
  startFiscalYear: number
  startMonth: number
}

/** `FixedAssetDto` (lista, alta y cambio). */
export interface FixedAsset {
  id: number
  /** UUID de la factura I que lo originó. `null` en un activo capturado sin factura. */
  originUuid: string | null
  description: string | null
  assetTypeCode: string
  assetTypeName: string
  annualRate: number
  deductibleCap: number | null
  status: FixedAssetStatus
  statusCode: FixedAssetStatusCode
  source: FixedAssetSource
  sourceCode: FixedAssetSourceCode
  /** Declaración cuyo cálculo lo sugirió. `null` en altas del contador. */
  suggestedInDeclarationId: number | null
  /** Cuándo se confirmó o descartó por última vez. */
  confirmedAt: string | null
  /** `SuggestedAmount`: monto sin IVA que propuso el clasificador. `null` en altas del contador. */
  amount: number | null
  /** `SuggestionReason`: por qué la IA o la regla lo sugirió. */
  motivo: string | null
  /** Detalle de la venta o pérdida; `null` mientras no se dé de baja. */
  disposal: FixedAssetDisposal | null
  layers: FixedAssetLayer[]
  /** Campos del 21-oct (§11). Opcionales: con un back viejo no vienen. */
  /** Tope de IVA acreditable del activo; `null` = sin tope. */
  ivaCreditCap?: number | null
  /** IVA ya acreditado de este activo (Σ `FixedAssetIvaCredits`), contra el tope. */
  ivaCredited?: number | null
  /** Alta sin factura (R7). */
  isCaptured?: boolean | null
  /** Datos de la captura; `null` en activos con factura. */
  capture?: FixedAssetCapture | null
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

/** `POST /api/FixedAssets/captured` y `PUT /api/FixedAssets/captured/{id}` (mismos campos). */
export interface CapturedFixedAssetInput {
  rfc: string
  assetTypeCode: string
  description?: string
  monthlyAmount: number
  startFiscalYear: number
  startMonth: number
}

/** `UpdateFixedAssetRequestDto`. Solo viaja lo que cambia. */
export interface UpdateFixedAssetInput {
  assetTypeCode?: string
  status?: FixedAssetDecision
  description?: string
}

/** `DisposeFixedAssetRequestDto`. En una pérdida no viajan precio, comprador ni CFDI. */
export interface DisposeFixedAssetInput {
  kind: FixedAssetDisposalKind
  disposalDate: string
  salePrice?: number
  buyerRfc?: string
  buyerName?: string
  saleInvoiceUuid?: string
  notes?: string
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

/** Activo capturado sin factura: el flag del back o, si no viene, que traiga `capture`. */
export function fixedAssetIsCaptured(asset: Pick<FixedAsset, 'isCaptured' | 'capture'>): boolean {
  return asset.isCaptured === true || asset.capture != null
}
