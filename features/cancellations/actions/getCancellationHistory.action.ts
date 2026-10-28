"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancellationHistory, CancellationsError } from "../types";

/** Bitácora del RFC: bajas/reactivaciones de cuenta y logs `gerencia-%` de sus declaraciones. */
export async function getCancellationHistory(
  taxpayerId: number,
  skip = 0,
  take = 100,
): Promise<Result<CancellationHistory, CancellationsError>> {
  try {
    const data = await fetchGet<CancellationHistory>(
      API_ROUTES.CANCELLATIONS.HISTORY(taxpayerId, skip, take),
      "cancellations_reports",
    );
    return ok({ taxpayer: data?.taxpayer ?? [], declarations: data?.declarations ?? [] });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getCancellationHistory] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el historial de cancelaciones." });
  }
}
