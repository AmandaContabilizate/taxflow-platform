"use server";

import { ApiError, fetchGetPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SignInError } from "../types";

interface ExistEmailResponse {
  exists: boolean;
}

/**
 * GET /api/users/ExistEmail/{email} — se llama ANTES de SendCode al
 * registrar una cuenta nueva.
 *
 * `exists: true` significa que ese correo ya pertenece a un usuario con
 * registro completado (RegistrationStatus.BasicInfoCompleted) — es decir,
 * el correo ya está tomado y NO se debe continuar con el alta. `exists:
 * false` significa que el correo está libre o pertenece a un registro
 * pendiente sin terminar, por lo que sí se puede continuar (SendCode).
 */
export async function checkEmailExists(email: string): Promise<Result<boolean, SignInError>> {
  try {
    const response = await fetchGetPublic<ExistEmailResponse>(
      API_ROUTES.USERS.EXIST_EMAIL(email),
      "users",
    );
    return ok(Boolean(response?.exists));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        fieldErrors: { root: [e.message || "No se pudo validar el correo"] },
      });
    }
    console.error("[checkEmailExists] Error:", e);
    return err({
      statusCode: 500,
      fieldErrors: { root: ["Error al validar el correo. Intenta de nuevo."] },
    });
  }
}
