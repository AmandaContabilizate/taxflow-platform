"use server";

import { decodeJwt } from "jose";
import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toEmailChangeError } from "../lib/emailChangeError";
import { emailChangeConfirmSchema } from "../schemas/emailChange.schema";
import type { EmailChangeError, LoginResponse } from "../types";
import { setSessionCookies } from "./setSessionCookies.action";

/**
 * Paso 2: valida el código y aplica el cambio. El back revoca las demás sesiones y devuelve
 * un LoginResponse nuevo; se reescriben las cookies (auth_token, email, …) porque Bóveda y
 * dashboard mandan la cookie `email` como query. Devuelve el correo nuevo.
 */
export async function confirmEmailChange(
  newEmail: string,
  code: string,
): Promise<Result<string, EmailChangeError>> {
  const parsed = emailChangeConfirmSchema.safeParse({ newEmail, code });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    });
  }

  try {
    const response = await fetchPost<LoginResponse>(
      API_ROUTES.USERS.EMAIL_CHANGE_CONFIRM,
      parsed.data,
      "users",
    );
    if (!response?.token) {
      return err({ statusCode: 500, message: "No pudimos actualizar tu sesión. Vuelve a iniciar sesión." });
    }

    // rmb=1 si la sesión era "Recuérdame" (mismo criterio que el refresh y switchRole).
    let rememberMe = false;
    try {
      rememberMe = (decodeJwt(response.token) as Record<string, unknown>).rmb === "1";
    } catch {
      // claim opcional
    }

    await setSessionCookies(
      {
        token: response.token,
        refreshToken: response.refreshToken,
        email: response.email ?? parsed.data.newEmail,
        fullName: response.fullName,
        userId: response.userId,
        rfc: response.rfc,
        expiresAt: response.expiresAt,
        emailChangeBlocked: response.emailChangeBlocked,
        emailChangeBlockedReason: response.emailChangeBlockedReason,
      },
      { rememberMe },
    );

    return ok(response.email ?? parsed.data.newEmail);
  } catch (e) {
    return err(toEmailChangeError(e, "No pudimos confirmar el cambio. Intenta de nuevo."));
  }
}
