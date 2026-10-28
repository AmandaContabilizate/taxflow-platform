"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type CancelDeclarationsInput, cancelDeclarationsSchema } from "../schemas/cancelDeclarations.schema";
import type { CancelDeclarationsResult, CancellationsError } from "../types";

/**
 * Cancelación comercial de declaraciones (→ 19 Cancelada). Resultado PARCIAL: cada declaración va
 * en su propia transacción; el back responde 200 con `cancelled`/`rejected` y 400 solo si todas
 * se rechazaron. El crédito del paquete se queda consumido.
 */
export async function cancelDeclarations(
  input: CancelDeclarationsInput,
): Promise<Result<CancelDeclarationsResult, CancellationsError>> {
  const parsed = cancelDeclarationsSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  try {
    const data = await fetchPost<CancelDeclarationsResult>(
      API_ROUTES.CANCELLATIONS.CANCEL_DECLARATIONS,
      parsed.data,
      "cancellations",
    );
    return ok({ cancelled: data?.cancelled ?? [], rejected: data?.rejected ?? [] });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[cancelDeclarations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cancelar las declaraciones." });
  }
}
