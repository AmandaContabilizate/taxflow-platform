"use server";

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
  emailChangeBlocked?: boolean;
  emailChangeBlockedReason?: string | null;
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

// Usuario que entró por el iframe de un partner: guarda el nombre del partner (o "1"
// si el back no lo mandó). Ausente = puede cambiar su correo.
const EMAIL_CHANGE_BLOCKED_COOKIE = "emailChangeBlockedBy";

const TOKEN_COOKIE_NAMES = [
  "auth_token",
  "refresh_token",
  "userId",
  "email",
  "fullName",
  "rfc",
  EMAIL_CHANGE_BLOCKED_COOKIE,
] as const;

export async function setSessionCookies(
  sessionData: SessionData,
  options: SetSessionCookiesOptions = {},
): Promise<void> {
  const cookieStore = await cookies();

  const isHttps =
    process.env.NODE_ENV === "production" ||
    process.env.API_URL?.startsWith("https");

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
  if (sessionData.emailChangeBlocked !== undefined) {
    if (sessionData.emailChangeBlocked) {
      cookieStore.set(EMAIL_CHANGE_BLOCKED_COOKIE, sessionData.emailChangeBlockedReason || "1", baseCookie);
    } else {
      cookieStore.delete(EMAIL_CHANGE_BLOCKED_COOKIE);
    }
  }

  // Los claims (rol, permisos, email) se leen del propio JWT con readSessionClaims.
  // Antes se copiaban a cookies claim_* + token_claims: triplicaban el peso del
  // token en el header Cookie y, sumado al JWT en la query del callback SSO,
  // rebasaban el límite de headers de Node (431). Se purgan las que queden.
  deleteLegacyClaimCookies(cookieStore);
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function deleteLegacyClaimCookies(cookieStore: CookieStore): void {
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("claim_")) cookieStore.delete(c.name);
  }
  cookieStore.delete("token_claims");
  cookieStore.delete("token_claim_keys");
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

  deleteLegacyClaimCookies(cookieStore);
}
