"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { resendDeclarationSchema } from "../schemas/resendDeclaration.schema";
import type { ResendDeclarationResult } from "../types";

interface ResendError {
  statusCode: number;
  message: string;
  /** DECLARATION_NOT_FOUND | INVALID_STATUS_TRANSITION | TAXPAYER_EMAIL_NOT_FOUND
   *  | REPORT_LINK_NOT_AVAILABLE | UPDATE_FAILED | INVALID_REQUEST. */
  code?: string;
}

/**
 * "Enviar Predeclaración": reenvía la declaración corregida a revisión del
 * cliente (10|15 → 9) y dispara el correo con el link a `/reporte`. Idempotente:
 * repetirlo con la declaración ya en 9 no mueve el estatus (`changed: false`)
 * pero sí reintenta el correo. Siempre manda un body JSON (aunque sea `{}`): el
 * parámetro del back es `[FromBody]` y un body vacío puede dar 400.
 */
export async function resendDeclarationToClient(
  declarationId: number,
  note?: string,
): Promise<Result<ResendDeclarationResult, ResendError>> {
  const parsed = resendDeclarationSchema.safeParse({ declarationId, note });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  try {
    const data = await fetchPost<ResendDeclarationResult>(
      API_ROUTES.DECLARATIONS_PROCEDURES.RESEND_TO_CLIENT(parsed.data.declarationId),
      { note: parsed.data.note ?? null },
      "declarations_procedures",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[resendDeclarationToClient] Error:", e);
    return err({ statusCode: 500, message: "No pudimos reenviar la declaración al cliente." });
  }
}
