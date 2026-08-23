"use server";

import { ApiError, fetchPostPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { deleteAccountPublicSchema } from "../schemas/deleteAccountPublic.schema";

interface DeleteAccountPublicError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

/**
 * Desactiva la cuenta (isActive = 0) desde la página pública: el back valida
 * email + contraseña, así que no hace falta sesión previa.
 */
export async function deleteAccountPublic(
  email: string,
  password: string,
): Promise<Result<true, DeleteAccountPublicError>> {
  const parsed = deleteAccountPublicSchema.safeParse({ email, password });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    });
  }

  try {
    await fetchPostPublic<unknown>(
      API_ROUTES.AUTH.DELETE_ACCOUNT,
      { Email: parsed.data.email, Password: parsed.data.password },
      "auth",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[deleteAccountPublic] Error:", e);
    return err({ statusCode: 500, message: "No pudimos eliminar tu cuenta." });
  }
}
