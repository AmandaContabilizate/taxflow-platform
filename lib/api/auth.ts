import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { readAuthToken } from "./tokenCookie";

export async function getAuthToken(): Promise<string> {
  try {
    // El token viaja troceado en cookies (auth_token + auth_token_1..n)
    const cookieStore = await cookies();
    return readAuthToken((name) => cookieStore.get(name)?.value) || "";
  } catch (e) {
    console.warn("[getAuthToken] Failed to get auth token:", e);
    return "";
  }
}

export interface SessionClaims {
  role: string | null;
  permissions: string[];
  email: string | null;
  /** Alianza del usuario de empresa (claim partnership_id, Perfil Empresa). Null para internos y clientes. */
  partnershipId: number | null;
}

/**
 * Rol, permisos y email del usuario, decodificados del JWT de la cookie (sin
 * verificar firma: solo decide qué mostrar; los endpoints validan el token).
 */
export async function readSessionClaims(): Promise<SessionClaims> {
  const empty: SessionClaims = { role: null, permissions: [], email: null, partnershipId: null };
  const token = await getAuthToken();
  if (!token) return empty;
  try {
    const claims = decodeJwt(token) as Record<string, unknown>;
    const permission = claims.permission;
    const permissions = Array.isArray(permission)
      ? permission.filter((p): p is string => typeof p === "string")
      : typeof permission === "string"
        ? [permission]
        : [];
    return {
      role: typeof claims.role === "string" ? claims.role : null,
      permissions,
      email: typeof claims.email === "string" ? claims.email : null,
      partnershipId: Number.isInteger(Number(claims.partnership_id)) && Number(claims.partnership_id) > 0
        ? Number(claims.partnership_id)
        : null,
    };
  } catch {
    return empty;
  }
}
