"use server";

import { redirect } from "next/navigation";
import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { PUBLIC_ROUTES } from "@/lib/routes";
import { clearSessionCookies } from "./setSessionCookies.action";

/**
 * Cierra sesión: notifica al backend, limpia cookies y redirige a /auth/login.
 */
export async function signOut(): Promise<void> {
  try {
    await fetchPost(API_ROUTES.AUTH.SIGN_OUT, undefined, "auth");
  } catch (e) {
    console.warn("[signOut] backend signOut failed (ignorando):", e);
  } finally {
    await clearSessionCookies();
  }
  redirect(PUBLIC_ROUTES.LOGIN);
}
