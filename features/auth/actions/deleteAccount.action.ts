"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { deleteAccountSchema } from "../schemas/deleteAccount.schema";

interface DeleteAccountError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

/**
 * Desactiva la cuenta del usuario autenticado (isActive = 0). El email sale del
 * token; el back solo pide la contraseña como confirmación.
 */
export async function deleteAccount(
  password: string,
): Promise<Result<true, DeleteAccountError>> {
  const parsed = deleteAccountSchema.safeParse({ password });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Contraseña inválida.",
    });
  }

  try {
    await fetchPost<unknown>(
      API_ROUTES.USERS.DELETE_ACCOUNT,
      { Password: parsed.data.password },
      "users",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[deleteAccount] Error:", e);
    return err({ statusCode: 500, message: "No pudimos eliminar tu cuenta." });
  }
}
