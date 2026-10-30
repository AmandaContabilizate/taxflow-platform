"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancellationsError, DeactivationPreview } from "../types";

/** Paso (a) del modal "Cancelar cliente": qué se cancelaría y qué lo bloquea. */
export async function getDeactivationPreview(
  taxpayerId: number,
): Promise<Result<DeactivationPreview, CancellationsError>> {
  try {
    const data = await fetchGet<DeactivationPreview>(
      API_ROUTES.TAXPAYER_DEACTIVATION.PREVIEW(taxpayerId),
      "taxpayer_deactivation",
    );
    return ok({
      ...data,
      declarationsToCancel: data?.declarationsToCancel ?? 0,
      declarationsInFlight: data?.declarationsInFlight ?? [],
      subscription: data?.subscription ?? null,
      prepaid: data?.prepaid ?? null,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getDeactivationPreview] Error:", e);
    return err({ statusCode: 500, message: "No pudimos preparar la baja del contribuyente." });
  }
}
