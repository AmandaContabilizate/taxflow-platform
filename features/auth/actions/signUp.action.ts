"use server";

import {
  ApiError,
  fetchPostPublic,
  getErrorMessage,
  getSystemOriginId,
  hasErrorCode,
} from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { signUpSchema, type SignUpSchema } from "../schemas/signUp.schema";
import type { SignInError } from "../types";

/**
 * Server Action de registro inicial.
 * Llama POST /api/users/SendCode/{systemOriginId} en Identity. El backend crea
 * el usuario (o reusa si ya existe sin confirmar), guarda el origen del alta en
 * AspNetUsers.SystemOriginId y envía un código por email.
 *
 * El origen va en la ruta y también en el body: la ruta manda, el body es el
 * respaldo si algún proxy recorta el segmento. Sin él, el backend asume 1
 * (Contabox) y este front quedaría registrado con un origen ajeno.
 *
 * No genera sesión todavía — el caller debe pedir el código y llamar
 * verifyEmailCode para completar el alta.
 */
export async function signUp(
  input: SignUpSchema,
): Promise<Result<{ email: string }, SignInError>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "root");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return err({ statusCode: 400, fieldErrors });
  }

  const systemOriginId = getSystemOriginId();

  try {
    await fetchPostPublic<{ success: boolean }>(
      API_ROUTES.USERS.SEND_CODE(systemOriginId),
      {
        email: parsed.data.email,
        password: parsed.data.password,
        systemOriginId,
      },
      "users",
    );
    return ok({ email: parsed.data.email });
  } catch (e) {
    if (e instanceof ApiError) {
      const message = hasErrorCode(e.errorCode)
        ? getErrorMessage(e.errorCode)
        : e.message || "No se pudo iniciar el registro";
      return err({ statusCode: e.status, fieldErrors: { root: [message] } });
    }
    console.error("[signUp] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al registrar. Intenta de nuevo."] },
    });
  }
}
