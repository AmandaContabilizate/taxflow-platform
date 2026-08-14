/**
 * Respuesta del backend al solicitar acceso SSO al portal de Timbrame.
 */
export interface TimbramePortalAccess {
  token: string
  portalUrl: string
}

/**
 * Error tipado para el flujo SSO de Timbrame.
 */
export interface TimbrameError {
  message: string
  errorCode?: string
}
