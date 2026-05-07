"use server";

import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SignInError } from "../types";

interface SignUpInput {
  email: string;
  password: string;
}

/**
 * Server Action de registro inicial.
 * Llama POST /api/users/SendCode en Identity. El backend crea el usuario
 * (o reusa si ya existe sin confirmar) y envía un código por email.
 *
 * No genera sesión todavía — el caller debe pedir el código y llamar
 * verifyEmailCode para completar el alta.
 */
export async function signUp(
  input: SignUpInput,
): Promise<Result<{ email: string }, SignInError>> {
  try {
    await fetchPostPublic<{ success: boolean }>(
      API_ROUTES.USERS.SEND_CODE,
      { email: input.email, password: input.password },
      "users",
    );
    return ok({ email: input.email });
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as
        | { detail?: string; title?: string; extensions?: { errorCode?: string } }
        | undefined;
      const message =
        body?.detail || body?.title || "No se pudo iniciar el registro";
      return err({
        statusCode: e.status,
        fieldErrors: { root: [message] },
      });
    }
    console.error("[signUp] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al registrar. Intenta de nuevo."] },
    });
  }
}
