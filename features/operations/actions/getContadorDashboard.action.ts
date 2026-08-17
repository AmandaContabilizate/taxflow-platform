"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ContadorDashboard } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

/**
 * Panel del contador (GET /declarations/contador-dashboard): su cartera asignada,
 * declaraciones por presentar/presentadas del periodo y estado de CIEC. El backend
 * siempre acota a la cartera del token (Users.TaxpayerAccountant).
 */
export async function getContadorDashboard(
  year: number,
  month: number,
): Promise<Result<ContadorDashboard, OpsError>> {
  try {
    const data = await fetchGet<ContadorDashboard>(
      API_ROUTES.DECLARATIONS_OPS.CONTADOR_DASHBOARD(year, month),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getContadorDashboard] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tu panel." });
  }
}
