import { ApiError } from './fetchClient'

/**
 * Mensaje de un error de Procedures para pantallas que necesitan el detalle exacto.
 *
 * Los endpoints del 612 (FixedAssets, IvaFavorBalances) responden siempre 400 con
 * `ProblemDetails` + `errorCode` (no hay 404) y ponen en `detail` el motivo concreto en español
 * ("remainingAmount no puede pasar de 1,200.00…"). `fetchClient` prefiere el texto del catálogo
 * cuando el código está catalogado (`INVALID_INPUT` → "Entrada inválida…"), que aquí esconde lo
 * que el contador tiene que corregir. Sin `detail` (p. ej. un ValidationProblemDetails de model
 * binding) se usa el mensaje que ya armó `fetchClient`.
 */
export function problemDetailMessage(e: ApiError): string {
  const body = e.body
  if (body && typeof body === 'object') {
    const detail = (body as { detail?: unknown }).detail
    if (typeof detail === 'string' && detail.trim()) return detail.trim()
  }
  return e.message
}

/** `{ statusCode, message, code }` que devuelven las server actions del 612. */
export function toCalc612Error(e: ApiError): { statusCode: number; message: string; code?: string } {
  return { statusCode: e.status, message: problemDetailMessage(e), code: e.errorCode }
}
