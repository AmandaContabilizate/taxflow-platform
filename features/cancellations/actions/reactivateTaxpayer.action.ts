"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type ReactivateTaxpayerInput, reactivateTaxpayerSchema } from "../schemas/reactivate.schema";
import type { CancellationsError, ReactivateTaxpayerResult } from "../types";

/**
 * Reactiva un contribuyente cancelado por gerencia (Soft). Las credenciales se borraron en la baja:
 * el cliente tendrá que cargarlas de nuevo; el contador no se restaura (queda sin asignar).
 */
export async function reactivateTaxpayer(
  input: ReactivateTaxpayerInput,
): Promise<Result<ReactivateTaxpayerResult, CancellationsError>> {
  const parsed = reactivateTaxpayerSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  try {
    const data = await fetchPost<ReactivateTaxpayerResult>(
      API_ROUTES.TAXPAYER_DEACTIVATION.REACTIVATE(parsed.data.taxpayerId),
      {
        password: parsed.data.password,
        note: parsed.data.note || null,
        reactivateDeclarations: parsed.data.reactivateDeclarations,
      },
      "taxpayer_deactivation",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[reactivateTaxpayer] Error:", e);
    return err({ statusCode: 500, message: "No pudimos reactivar al contribuyente." });
  }
}
