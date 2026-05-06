"use server";

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

  cookieStore.set("auth_token", sessionData.token, {
    ...baseCookie,
    maxAge: options.rememberMe ? 60 * 60 * 24 * 30 : maxAge,
  });

  if (sessionData.refreshToken) {
    cookieStore.set("refresh_token", sessionData.refreshToken, baseCookie);
  }
  if (sessionData.userId) cookieStore.set("userId", sessionData.userId, baseCookie);
  if (sessionData.email) cookieStore.set("email", sessionData.email, baseCookie);
  if (sessionData.fullName) cookieStore.set("fullName", sessionData.fullName, baseCookie);
  if (sessionData.rfc) cookieStore.set("rfc", sessionData.rfc, baseCookie);
}

export async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies();
  ["auth_token", "refresh_token", "userId", "email", "fullName", "rfc"].forEach(
    (name) => cookieStore.delete(name),
  );
}
