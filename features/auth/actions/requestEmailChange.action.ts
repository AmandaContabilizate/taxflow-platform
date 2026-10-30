"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toEmailChangeError } from "../lib/emailChangeError";
import { emailChangeRequestSchema } from "../schemas/emailChange.schema";
import type { EmailChangeError, EmailChangeRequestResponse } from "../types";

/** Paso 1: contraseña actual + correo nuevo. El back manda el código al correo nuevo. */
export async function requestEmailChange(
  currentPassword: string,
  newEmail: string,
): Promise<Result<EmailChangeRequestResponse, EmailChangeError>> {
  const parsed = emailChangeRequestSchema.safeParse({ currentPassword, newEmail });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Datos inválidos.",
    });
  }

  try {
    const response = await fetchPost<EmailChangeRequestResponse>(
      API_ROUTES.USERS.EMAIL_CHANGE_REQUEST,
      parsed.data,
      "users",
    );
    return ok(response);
  } catch (e) {
    return err(toEmailChangeError(e, "No pudimos enviar el código. Intenta de nuevo."));
  }
}
