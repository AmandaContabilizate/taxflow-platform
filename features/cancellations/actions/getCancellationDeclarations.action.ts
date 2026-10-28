"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancellationDeclarationsResponse, CancellationsError } from "../types";

export interface CancellationDeclarationsFilters {
  taxRegimeId?: number;
  fiscalYear?: number;
  statusId?: number;
  onlyCancellable?: boolean;
}

/**
 * Todas las declaraciones del RFC (normales y complementarias) con `cancellable` resuelto por el
 * back, más el saldo prepagado informativo. Sin paginar: es un solo contribuyente.
 */
export async function getCancellationDeclarations(
  taxpayerId: number,
  filters: CancellationDeclarationsFilters = {},
): Promise<Result<CancellationDeclarationsResponse, CancellationsError>> {
  try {
    const data = await fetchGet<CancellationDeclarationsResponse>(
      API_ROUTES.CANCELLATIONS.TAXPAYER_DECLARATIONS(taxpayerId, filters),
      "cancellations_reports",
    );
    return ok({ items: data?.items ?? [], prepaid: data?.prepaid ?? null });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[getCancellationDeclarations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las declaraciones del contribuyente." });
  }
}
