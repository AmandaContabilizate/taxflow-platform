"use server";

import { fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { toEmailChangeError } from "../lib/emailChangeError";
import { emailChangeResendSchema } from "../schemas/emailChange.schema";
import type { EmailChangeError, EmailChangeRequestResponse } from "../types";

/** Regenera el código para el mismo correo nuevo; no vuelve a pedir contraseña. */
export async function resendEmailChange(
  newEmail: string,
): Promise<Result<EmailChangeRequestResponse, EmailChangeError>> {
  const parsed = emailChangeResendSchema.safeParse({ newEmail });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Correo inválido.",
    });
  }

  try {
    const response = await fetchPost<EmailChangeRequestResponse>(
      API_ROUTES.USERS.EMAIL_CHANGE_RESEND,
      parsed.data,
      "users",
    );
    return ok(response);
  } catch (e) {
    return err(toEmailChangeError(e, "No pudimos reenviar el código. Intenta de nuevo."));
  }
}
