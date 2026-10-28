"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type CancelTaxpayerInput, cancelTaxpayerSchema } from "../schemas/cancelTaxpayer.schema";
import type { CancellationsError, DeactivateTaxpayerResult } from "../types";

/**
 * Baja Soft del contribuyente por gerencia comercial. Borra CIEC, e.firma y cuentas bancarias,
 * desasigna al contador, cancela las declaraciones abiertas (→ 19) y la suscripción de Stripe al
 * fin de periodo. `Hard` siempre false por esta vía. La contraseña viaja solo al back; nunca se
 * guarda ni se loguea.
 */
export async function deactivateTaxpayer(
  input: CancelTaxpayerInput,
): Promise<Result<DeactivateTaxpayerResult, CancellationsError>> {
  const parsed = cancelTaxpayerSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? "Parámetros inválidos.",
      code: "INVALID_REQUEST",
    });
  }

  const { taxpayerId, confirmRfc, reasonId, reasonNote, requestReference, password, cancelOpenDeclarations, cancelSubscription } =
    parsed.data;
  try {
    const data = await fetchPost<DeactivateTaxpayerResult>(
      API_ROUTES.TAXPAYER_DEACTIVATION.DEACTIVATE(taxpayerId),
      {
        hard: false,
        confirmRfc,
        reasonId,
        reasonNote: reasonNote || null,
        requestReference,
        password,
        cancelOpenDeclarations,
        cancelSubscription,
      },
      "taxpayer_deactivation",
    );
    return ok(data ?? {});
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[deactivateTaxpayer] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cancelar al contribuyente." });
  }
}
