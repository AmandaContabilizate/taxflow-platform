"use server";

import { decodeJwt } from "jose";
import { ApiError, API_ROUTES, fetchPost } from "@/lib/api";
import { getAuthToken } from "@/lib/api/auth";
import type { LoginResponse } from "../types";
import { setSessionCookies } from "./setSessionCookies.action";

type RefreshStatus = "refreshed" | "valid" | "expired";

/**
 * Sesión deslizante. Decodifica el JWT de la cookie y:
 *  - `expired`   → no hay token, ya caducó, o el backend rechazó el refresh
 *                  (tope absoluto alcanzado / cuenta inactiva). El caller
 *                  debe expulsar a login.
 *  - `valid`     → el token sigue vivo y aún no ha consumido el 50 % de su vida.
 *  - `refreshed` → se re-emitió el token y se reescribieron las cookies.
 *
 * El backend (`POST /api/auth/refresh`) exige un JWT AÚN válido, por eso el
 * refresh se dispara al 50 % de vida y no al caducar.
 */
let inFlight: Promise<RefreshStatus> | null = null;

/**
 * @param embedded true cuando la app corre dentro del iframe SSO de un partner —
 *   obliga SameSite=None/Secure al reescribir las cookies (ver setSessionCookies).
 */
export async function refreshSession(embedded = false): Promise<{ status: RefreshStatus }> {
  if (!inFlight) {
    inFlight = doRefresh(embedded).finally(() => {
      inFlight = null;
    });
  }
  return { status: await inFlight };
}

async function doRefresh(embedded: boolean): Promise<RefreshStatus> {
  const token = await getAuthToken();
  if (!token) return "expired";

  let iat: number | undefined;
  let exp: number | undefined;
  try {
    const claims = decodeJwt(token);
    iat = typeof claims.iat === "number" ? claims.iat : undefined;
    exp = typeof claims.exp === "number" ? claims.exp : undefined;
  } catch {
    return "expired";
  }
  if (!exp) return "expired";

  const now = Date.now() / 1000;
  if (now >= exp) return "expired";

  // Solo refrescar cuando se consumió >= 50 % de la vida del token.
  const issued = iat ?? exp - 15 * 60;
  if (now - issued < (exp - issued) * 0.5) return "valid";

  try {
    const data = await fetchPost<LoginResponse>(API_ROUTES.AUTH.REFRESH, undefined, "auth");
    if (!data?.token) return "valid";

    let rememberMe = false;
    try {
      rememberMe = (decodeJwt(data.token) as Record<string, unknown>).rmb === "1";
    } catch {
      // claim opcional; si no se puede leer, cookie no persistente
    }

    await setSessionCookies({ token: data.token, expiresAt: data.expiresAt }, { rememberMe, embedded });
    return "refreshed";
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) return "expired";
    // Fallo transitorio (red / 5xx): el token viejo sigue vivo un rato, no expulsar.
    return "valid";
  }
}
