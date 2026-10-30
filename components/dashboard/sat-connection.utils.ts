import type { AvailableRfc } from '@/features/taxpayers/actions/getAvailableRfcs.action'

type SatConnectionInfo = Pick<
  AvailableRfc,
  'ciecState' | 'hasActiveDigitalIdentity' | 'hasSatPassword' | 'hasTaxCertificate' | 'taxCertificateVerified'
>

/**
 * ÚNICA fuente de verdad para "¿este contribuyente ya conectó su SAT?", usada por
 * Declaraciones, Diagnóstico, Documentos y Estatus SAT. CIEC válida (1) o e.firma
 * activa y vigente alcanzan; antes solo miraba la CIEC y dejaba fuera a quien ya
 * había dado de alta su e.firma.
 */
export function isSatConnected(rfcInfo: SatConnectionInfo | null | undefined): boolean {
  return rfcInfo?.ciecState === 1 || rfcInfo?.hasActiveDigitalIdentity === true
}

/** true si pasa la puerta solo por e.firma: su CIEC no sirve y puede fallar algo que dependa de ella. */
export function isConnectedByEfirmaOnly(rfcInfo: SatConnectionInfo | null | undefined): boolean {
  return isSatConnected(rfcInfo) && rfcInfo?.ciecState !== 1
}

export type CiecBlockStatus = 'unverified' | 'invalid'

/**
 * Estado de bloqueo cuando NO hay conexión vigente (ni CIEC válida ni e.firma activa):
 * 'unverified' (CiecState 0, transitorio, no es culpa del cliente) o 'invalid' (CiecState
 * 2, el cliente debe actualizar su CIEC). null si está conectado, o si CiecState 0 no
 * tiene contraseña guardada (D3: nunca capturó CIEC, va por NeedsSatConnect) o si no hay
 * ninguna credencial registrada.
 */
export function getCiecBlockStatus(rfcInfo: SatConnectionInfo | null | undefined): CiecBlockStatus | null {
  if (isSatConnected(rfcInfo)) return null
  if (rfcInfo?.ciecState === 2) return 'invalid'
  if (rfcInfo?.ciecState === 0 && rfcInfo?.hasSatPassword) return 'unverified'
  return null
}

/**
 * ¿Hay régimen documentado? Constancia registrada (del robot o subida por el cliente). Es el
 * candado de VENTA: sin constancia no se vende ningún plan a futuro (spec-venta-con-constancia-subida).
 */
export function hasDocumentedRegime(rfcInfo: SatConnectionInfo | null | undefined): boolean {
  return rfcInfo?.hasTaxCertificate === true
}

/** Constancia subida por el cliente/vendedor que el robot aún no contrastó con el SAT. */
export function hasUnverifiedTaxCertificate(rfcInfo: SatConnectionInfo | null | undefined): boolean {
  return rfcInfo?.hasTaxCertificate === true && rfcInfo?.taxCertificateVerified !== true
}

/**
 * Puerta de las pantallas de COMPRA (Mi plan, Trámites): basta conexión SAT vigente O constancia
 * registrada. Distinta de la puerta de OPERACIÓN (robots, facturas), que sigue siendo isSatConnected.
 */
export function canPurchase(rfcInfo: SatConnectionInfo | null | undefined): boolean {
  return isSatConnected(rfcInfo) || hasDocumentedRegime(rfcInfo)
}

/**
 * Bloqueo de las pantallas de compra: con constancia registrada no se bloquea aunque la CIEC
 * esté sin verificar o inválida (el cliente ya pagó / puede pagar; la CIEC se insiste con banner).
 */
export function getPurchaseBlockStatus(rfcInfo: SatConnectionInfo | null | undefined): CiecBlockStatus | null {
  if (hasDocumentedRegime(rfcInfo)) return null
  return getCiecBlockStatus(rfcInfo)
}
