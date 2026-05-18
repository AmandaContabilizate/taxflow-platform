"use server";

import { decodeJwt } from "jose";
import { cookies } from "next/headers";

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
    secure: Boolean(isHttps),
    sameSite: "lax" as const,
    path: "/",
  };

  const sessionMaxAge = options.rememberMe ? 60 * 60 * 24 * 30 : maxAge;

  cookieStore.set("auth_token", sessionData.token, {
    ...baseCookie,
    maxAge: sessionMaxAge,
  });

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
