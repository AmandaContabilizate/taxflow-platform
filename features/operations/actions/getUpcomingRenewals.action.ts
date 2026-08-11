"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Paged, TipoRenovacion, VentaPorVencer } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<VentaPorVencer> = { items: [], total: 0, skip: 0, take: 0 };

/** Planes por vencer en los próximos `dias`, del vencimiento más cercano al más lejano. */
export async function getUpcomingRenewals(params: {
  skip?: number;
  take?: number;
  dias?: number;
  tipo?: TipoRenovacion;
  rfc?: string;
  incluirVencidas?: boolean;
}): Promise<Result<Paged<VentaPorVencer>, OpsError>> {
  const { skip = 0, take = 100, dias = 30, tipo, rfc, incluirVencidas = false } = params;
  try {
    const data = await fetchGet<Paged<VentaPorVencer>>(
      API_ROUTES.SALES_OPS.UPCOMING_RENEWALS(
        skip,
        take,
        dias,
        tipo,
        rfc?.trim() || undefined,
        incluirVencidas,
      ),
      "sales_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getUpcomingRenewals] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los planes por vencer.",
    });
  }
}
