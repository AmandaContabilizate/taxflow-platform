"use server";

import { decodeJwt } from "jose";
import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { setSessionCookies } from "@/features/auth/actions/setSessionCookies.action";
import { toRolesError } from "../errors";
import type { RolesError, SwitchRoleResponse } from "../types";

/**
 * Cambia el rol activo del usuario autenticado. El backend devuelve un JWT
 * nuevo (con el rol/claims actualizados); refrescamos las cookies de sesión
 * para que `claim_role` y `claim_permission` reflejen el rol activo.
 * El caller debe recargar/refrescar la vista tras un ok.
 */
export async function switchRole(
  roleId: string,
): Promise<Result<true, RolesError>> {
  try {
    const data = await fetchPost<SwitchRoleResponse>(
      API_ROUTES.USERS.SWITCH_ROLE,
      { roleId },
      "users",
    );
    if (!data?.token) {
      return err({
        statusCode: 500,
        message: "El servidor no devolvió un token válido.",
      });
    }
    // El JWT nuevo trae rmb=1 si la sesión es "Recuérdame"; setSessionCookies
    // vuelve a calcular el maxAge a 30 d en ese caso.
    let rememberMe = false;
    try {
      rememberMe = (decodeJwt(data.token) as Record<string, unknown>).rmb === "1";
    } catch {
      // claim opcional
    }
    await setSessionCookies({ token: data.token, expiresAt: data.expiresAt }, { rememberMe });
    return ok(true);
  } catch (e) {
    return err(toRolesError(e, "No pudimos cambiar el rol activo."));
  }
}
