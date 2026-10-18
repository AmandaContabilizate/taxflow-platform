"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type ReopenComplementaryReasonId, reopenDeclarationSchema } from "../schemas/reopenDeclaration.schema";
import type { ReopenDeclarationResult } from "../types";

interface ReopenError {
  statusCode: number;
  message: string;
  /** DECLARATION_NOT_FOUND | INVALID_STATUS_TRANSITION | UPDATE_FAILED | INVALID_REQUEST | SALE_NOT_PAID. */
  code?: string;
}

/**
 * "Reabrir declaración". El motivo solo va a la bitácora: no se manda correo y el
 * cliente nunca lo ve.
 * - Presentada (3): la original se queda presentada y se crea su complementaria en
 *   En proceso, con el vínculo de venta. Exige `complementaryReasonId`.
 * - Por autorizar (9) o Por presentar (11): → Reabierta (17), que se trabaja igual
 *   que En proceso.
 */
export async function reopenDeclaration(
  declarationId: number,
  reason: string,
  complementaryReasonId?: ReopenComplementaryReasonId,
): Promise<Result<ReopenDeclarationResult, ReopenError>> {
  const parsed = reopenDeclarationSchema.safeParse({ declarationId, reason, complementaryReasonId });
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  try {
    const data = await fetchPost<ReopenDeclarationResult>(
      API_ROUTES.DECLARATIONS_PROCEDURES.REOPEN(parsed.data.declarationId),
      { reason: parsed.data.reason, complementaryReasonId: parsed.data.complementaryReasonId ?? null },
      "declarations_procedures",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[reopenDeclaration] Error:", e);
    return err({ statusCode: 500, message: "No pudimos reabrir la declaración." });
  }
}
