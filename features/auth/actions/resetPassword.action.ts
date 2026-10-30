"use server";

import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { PUBLIC_ROUTES } from "@/lib/routes";
import type { SignInError } from "../types";

interface ResetPasswordInput {
  email: string;
  resetCode: string;
  newPassword: string;
}

/**
 * Server Action que aplica una nueva contraseña dado un código de reset
 * válido. POST /api/users/reset-password.
 */
export async function resetPassword(
  input: ResetPasswordInput,
): Promise<Result<string, SignInError>> {
  try {
    await fetchPostPublic<unknown>(
      API_ROUTES.USERS.RESET_PASSWORD,
      {
        Email: input.email,
        ResetCode: input.resetCode,
        NewPassword: input.newPassword,
      },
      "users",
    );
    return ok(PUBLIC_ROUTES.LOGIN);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        fieldErrors: { root: [e.message || "No se pudo restablecer la contraseña"] },
      });
    }
    console.error("[resetPassword] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al restablecer la contraseña. Intenta de nuevo."] },
    });
  }
}
