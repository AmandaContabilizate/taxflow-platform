"use server"

import { fetchGet } from "@/lib/api/fetchClient"
import { API_ROUTES } from "@/lib/api/apiRoutes"
import { ok, err, type Result } from "@/lib/common"
import type { TimbramePortalAccess, TimbrameError } from "../types"

/**
 * Server Action: obtiene el token SSO y la URL del portal de Timbrame.
 * El email se extrae del JWT en el backend — no requiere parámetros.
 *
 * Flujo backend:
 * 1. Valida usuario + perfil fiscal + plan activo.
 * 2. Auth integrador → login usuario → auto-registro si no existe.
 * 3. Retorna { token, portalUrl }.
 */
export async function getTimbramePortalAccess(): Promise<
  Result<TimbramePortalAccess, TimbrameError>
> {
  try {
    const data = await fetchGet<TimbramePortalAccess>(
      API_ROUTES.TIMBRAME.PORTAL_ACCESS,
      "timbrame"
    )
    return ok(data)
  } catch (error: unknown) {
    const apiErr = error as { message?: string; errorCode?: string }
    return err({
      message:
        apiErr.message ??
        "Error al conectar con el servicio de Facturación.",
      errorCode: apiErr.errorCode,
    })
  }
}
