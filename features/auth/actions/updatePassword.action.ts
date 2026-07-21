"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface UpdatePasswordError {
  statusCode: number;
  message: string;
}

// Cambia la contraseña del usuario autenticado. El email sale del token.
export async function updatePassword(
  newPassword: string,
): Promise<Result<true, UpdatePasswordError>> {
  if (!newPassword) {
    return err({ statusCode: 400, message: "La contraseña es obligatoria." });
  }

  try {
    await fetchPost<unknown>(
      API_ROUTES.USERS.UPDATE_PASSWORD,
      { NewPassword: newPassword },
      "users",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[updatePassword] Error:", e);
    return err({ statusCode: 500, message: "No pudimos actualizar tu contraseña." });
  }
}
