"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancellationReason, CancellationsError } from "../types";

/** Catálogo `Catalogs.DeclarationCancellationReason` (1..5 y 99 Otro, que exige nota). */
export async function getCancellationReasons(): Promise<Result<CancellationReason[], CancellationsError>> {
  try {
    const data = await fetchGet<CancellationReason[]>(API_ROUTES.CANCELLATIONS.REASONS, "cancellations");
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getCancellationReasons] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los motivos de cancelación." });
  }
}
