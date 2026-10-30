"use server";

import { fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { getSystemOriginId } from "@/lib/api/apiUrls";
import { type Result, ok } from "@/lib/common";

/**
 * Server Action de recuperación de contraseña.
 * POST /api/users/forgot-password/{systemOriginId} (body: email como string plano).
 * El systemOriginId decide a que front apunta el enlace del correo.
 *
 * Siempre devuelve éxito, exista o no la cuenta — evita enumeración de
 * emails registrados (mismo comportamiento que contaboxpro-frontend-next).
 */
export async function forgotPassword(email: string): Promise<Result<true, never>> {
  try {
    await fetchPostPublic<unknown>(
      API_ROUTES.USERS.FORGOT_PASSWORD(getSystemOriginId()),
      email,
      "users",
    );
  } catch (e) {
    console.error("[forgotPassword] Error:", e);
  }
  return ok(true);
}
