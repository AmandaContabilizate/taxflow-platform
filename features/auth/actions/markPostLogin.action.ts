"use server";

import { cookies } from "next/headers";
import { POST_LOGIN_COOKIE, POST_LOGIN_MAX_AGE_S } from "../lib/postLoginCookie";

/** Deja la marca de login para que el dashboard decida si manda al Guest a Diagnóstico. */
export async function markPostLogin() {
  const cookieStore = await cookies();
  cookieStore.set(POST_LOGIN_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: POST_LOGIN_MAX_AGE_S,
    secure: process.env.NODE_ENV === "production",
  });
}

/** Quita la marca: el SSO pidió una pantalla de llegada y no debe mandarse a Diagnóstico. */
export async function clearPostLogin() {
  const cookieStore = await cookies();
  cookieStore.delete(POST_LOGIN_COOKIE);
}
