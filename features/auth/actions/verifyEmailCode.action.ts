"use server";

import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { PROTECTED_ROUTES } from "@/lib/routes";
import type { LoginResponse, SignInError } from "../types";
import { setSessionCookies } from "./setSessionCookies.action";

interface VerifyInput {
  email: string;
  code: string;
}

/**
 * Server Action que valida el código de confirmación de email.
 * POST /api/users/ValidateConfirmationCode → si OK devuelve LoginResponse
 * (token + refreshToken). Aquí seteamos las cookies de sesión y devolvemos
 * la ruta a la que redirigir.
 */
export async function verifyEmailCode(
  input: VerifyInput,
  redirectPath: string = PROTECTED_ROUTES.DASHBOARD,
): Promise<Result<string, SignInError>> {
  try {
    const response = await fetchPostPublic<LoginResponse>(
      API_ROUTES.USERS.VALIDATE_CODE,
      { email: input.email, code: input.code },
      "users",
    );

    if (!response?.token) {
      return err({
        statusCode: 400,
        fieldErrors: { code: ["Código inválido"] },
      });
    }

    await setSessionCookies({
      token: response.token,
      refreshToken: response.refreshToken,
      email: response.email,
      fullName: response.fullName,
      userId: response.userId,
      rfc: response.rfc,
      expiresAt: response.expiresAt,
    });

    return ok(redirectPath);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as
        | { detail?: string; title?: string }
        | undefined;
      const message =
        body?.detail || body?.title || "Código inválido o expirado";
      return err({
        statusCode: e.status,
        fieldErrors: { code: [message] },
      });
    }
    console.error("[verifyEmailCode] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al verificar el código. Intenta de nuevo."] },
    });
  }
}
