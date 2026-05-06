"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import type { CurrentUser } from "../types";

/**
 * Devuelve el usuario actual o null si no hay sesión válida.
 * GET /api/auth/validate en el backend Identity.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await fetchGet<CurrentUser>(API_ROUTES.AUTH.VALIDATE, "auth");
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      return null;
    }
    console.error("[getCurrentUser] error:", e);
    return null;
  }
}

/**
 * Verifica si la sesión sigue siendo válida (para client-side guards).
 */
export async function getStatusToken(): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  return { success: user !== null };
}
