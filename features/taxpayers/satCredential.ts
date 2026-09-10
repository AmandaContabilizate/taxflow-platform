/**
 * Conectado al SAT = CIEC válida (ciecState 1) **o** e.firma vigente.
 *
 * Espeja DiagnosticoEligibilityService.HasValidCredentialAsync del backend, que ya acepta
 * cualquiera de las dos credenciales. Antes las pantallas exigían `ciecState === 1` a secas:
 * quien tecleaba mal su CIEC quedaba con PasswordState=2 (ningún flujo de e.firma lo limpia)
 * y seguía viendo "Falta un paso para empezar" aunque su e.firma fuera válida y su constancia
 * ya estuviera descargada.
 */
export function hasSatCredential(info?: {
  ciecState?: number
  hasValidEfirma?: boolean
} | null): boolean {
  return info?.ciecState === 1 || info?.hasValidEfirma === true
}
