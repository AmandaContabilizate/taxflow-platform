"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { reopenDeclarationSchema } from "../schemas/reopenDeclaration.schema";
import type { ReopenDeclarationResult } from "../types";

interface ReopenError {
  statusCode: number;
  message: string;
  /** DECLARATION_NOT_FOUND | INVALID_STATUS_TRANSITION | UPDATE_FAILED | INVALID_REQUEST. */
  code?: string;
}

/**
 * "Reabrir declaración": Presentada (3), Por autorizar (9) o Por presentar (11)
 * → Reabierta (17), que se trabaja igual que En proceso. El motivo solo va a la
 * bitácora: no se manda correo y el cliente nunca lo ve.
 */
export async function reopenDeclaration(
  declarationId: number,
  reason: string,
): Promise<Result<ReopenDeclarationResult, ReopenError>> {
  const parsed = reopenDeclarationSchema.safeParse({ declarationId, reason });
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
      { reason: parsed.data.reason },
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
