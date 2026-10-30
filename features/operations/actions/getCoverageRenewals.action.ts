"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Paged, RenovacionCobertura } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<RenovacionCobertura> = { items: [], total: 0, skip: 0, take: 0 };

/** Reporte ejecutivo SAC: Cobertura de declaraciones por régimen (Declarations.vw_RenovacionesCobertura). */
export async function getCoverageRenewals(params: {
  margen?: number;
  regimen?: string;
  search?: string;
  skip?: number;
  take?: number;
}): Promise<Result<Paged<RenovacionCobertura>, OpsError>> {
  const { margen = 2, regimen, search, skip = 0, take = 1000 } = params;
  try {
    const data = await fetchGet<Paged<RenovacionCobertura>>(
      API_ROUTES.SALES_OPS.COVERAGE_RENEWALS(
        margen,
        regimen?.trim() || undefined,
        search?.trim() || undefined,
        skip,
        take,
      ),
      "sales_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getCoverageRenewals] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener el reporte de cobertura de renovaciones.",
    });
  }
}
