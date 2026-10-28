"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CancellationTaxpayerSearch, CancellationsError } from "../types";

const EMPTY: CancellationTaxpayerSearch = { items: [], total: 0 };

/** Busca contribuyentes por RFC / nombre / correo (mínimo 3 caracteres; el back también lo exige). */
export async function searchCancellationTaxpayers(params: {
  q: string;
  skip?: number;
  take?: number;
}): Promise<Result<CancellationTaxpayerSearch, CancellationsError>> {
  const q = params.q.trim();
  if (q.length < 3) return ok(EMPTY);
  try {
    const data = await fetchGet<CancellationTaxpayerSearch>(
      API_ROUTES.CANCELLATIONS.TAXPAYERS_SEARCH(q, params.skip ?? 0, params.take ?? 20),
      "cancellations_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode });
    }
    console.error("[searchCancellationTaxpayers] Error:", e);
    return err({ statusCode: 500, message: "No pudimos buscar contribuyentes." });
  }
}
