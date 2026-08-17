"use server";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";
import { MAX_TOKEN_CHUNKS, splitAuthToken } from "@/lib/api/tokenCookie";

interface SessionData {
  token: string;
  refreshToken?: string;
  email?: string;
  fullName?: string;
  userId?: string;
  rfc?: string;
  expiresAt?: string;
}

interface SetSessionCookiesOptions {
  rememberMe?: boolean;
  /**
   * true cuando la sesión se crea dentro del puente SSO/iframe (partner
   * embebiendo ContaboxPro). Requiere SameSite=None para que las cookies
   * sobrevivan en contexto cross-site, lo que a su vez obliga Secure=true
   * sin importar el chequeo de `isHttps`.
   */
  embedded?: boolean;
}

const RESERVED_CLAIMS = new Set(["iat", "nbf", "exp", "iss", "aud", "jti"]);

const TOKEN_COOKIE_NAMES = [
  "auth_token",
  "refresh_token",
  "userId",
  "email",
  "fullName",
  "rfc",
  "token_claims",
] as const;

export async function setSessionCookies(
  sessionData: SessionData,
  options: SetSessionCookiesOptions = {},
): Promise<void> {
  const cookieStore = await cookies();

  const isHttps =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_API_URL?.startsWith("https");

  let maxAge: number | undefined;
  if (sessionData.expiresAt) {
    const seconds = Math.floor(
      (new Date(sessionData.expiresAt).getTime() - Date.now()) / 1000,
    );
    if (seconds > 0) maxAge = seconds;
  }

  const baseCookie = {
    httpOnly: true,
    secure: options.embedded ? true : Boolean(isHttps),
    sameSite: options.embedded ? ("none" as const) : ("lax" as const),
    path: "/",
  };

  const sessionMaxAge = options.rememberMe ? 60 * 60 * 24 * 30 : maxAge;

  // El JWT crece con cada permiso del rol y puede rebasar los 4,096 bytes por
  // cookie del navegador (el de Administrador ya lo hizo): se guarda troceado.
  // `auth_token` lleva el primer tramo — el middleware solo checa su presencia —
  // y `auth_token_1..n` el resto; los lectores lo reconstruyen con readAuthToken.
  const chunks = splitAuthToken(sessionData.token);
  cookieStore.set("auth_token", chunks[0], {
    ...baseCookie,
    maxAge: sessionMaxAge,
  });
  for (let i = 1; i < MAX_TOKEN_CHUNKS; i++) {
    if (i < chunks.length) {
      cookieStore.set(`auth_token_${i}`, chunks[i], {
        ...baseCookie,
        maxAge: sessionMaxAge,
      });
    } else if (cookieStore.get(`auth_token_${i}`)) {
      // Tramos sobrantes de un token anterior más largo
      cookieStore.delete(`auth_token_${i}`);
    }
  }

  if (sessionData.refreshToken) {
    cookieStore.set("refresh_token", sessionData.refreshToken, baseCookie);
  }
  if (sessionData.userId) cookieStore.set("userId", sessionData.userId, baseCookie);
  if (sessionData.email) cookieStore.set("email", sessionData.email, baseCookie);
  if (sessionData.fullName) cookieStore.set("fullName", sessionData.fullName, baseCookie);
  if (sessionData.rfc) cookieStore.set("rfc", sessionData.rfc, baseCookie);

  const dynamicCookies: string[] = [];
  try {
    const claims = decodeJwt(sessionData.token) as Record<string, unknown>;

    for (const [rawKey, value] of Object.entries(claims)) {
      if (value === null || value === undefined) continue;
      if (RESERVED_CLAIMS.has(rawKey)) continue;

      const key = sanitizeClaimKey(rawKey);
      if (!key) continue;

      const serialized =
        typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value);

      cookieStore.set(`claim_${key}`, serialized, {
        ...baseCookie,
        maxAge: sessionMaxAge,
      });
      dynamicCookies.push(`claim_${key}`);
    }

    cookieStore.set("token_claims", JSON.stringify(claims), {
      ...baseCookie,
      maxAge: sessionMaxAge,
    });
  } catch (e) {
    console.error("[setSessionCookies] No se pudo decodificar el JWT:", e);
  }

  if (dynamicCookies.length > 0) {
    cookieStore.set("token_claim_keys", dynamicCookies.join(","), {
      ...baseCookie,
      maxAge: sessionMaxAge,
    });
  }
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();

  for (const name of TOKEN_COOKIE_NAMES) {
    cookieStore.delete(name);
  }

  // Tramos del token (auth_token_1..n)
  for (let i = 1; i < MAX_TOKEN_CHUNKS; i++) {
    cookieStore.delete(`auth_token_${i}`);
  }

  const claimKeys = cookieStore.get("token_claim_keys")?.value;
  if (claimKeys) {
    for (const key of claimKeys.split(",").filter(Boolean)) {
      cookieStore.delete(key);
    }
    cookieStore.delete("token_claim_keys");
  }
}

function sanitizeClaimKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, "_");
}
