"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type ReactivateDeclarationInput, reactivateDeclarationSchema } from "../schemas/reactivate.schema";
import type { CancellationsError, ReactivateDeclarationResult } from "../types";

/**
 * Reactiva una 19: regresa al estatus previo del log (o a 15 si ya no aplica). No depende de cupo.
 * Rechaza si el RFC está cancelado (TAXPAYER_DEACTIVATED) o la declaración ya no está en 19.
 */
export async function reactivateDeclaration(
  input: ReactivateDeclarationInput,
): Promise<Result<ReactivateDeclarationResult, CancellationsError>> {
  const parsed = reactivateDeclarationSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  try {
    const data = await fetchPost<ReactivateDeclarationResult>(
      API_ROUTES.CANCELLATIONS.REACTIVATE_DECLARATION(parsed.data.declarationId),
      { note: parsed.data.note || null },
      "cancellations",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[reactivateDeclaration] Error:", e);
    return err({ statusCode: 500, message: "No pudimos reactivar la declaración." });
  }
}
