"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { GerenciaContableDashboard } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

/**
 * Panel de gerencia contable (GET /declarations/gerencia-contable-dashboard):
 * totales del área para el periodo y desglose por contador. `accountantUserId`
 * filtra los totales a un solo contador.
 */
export async function getGerenciaContableDashboard(
  year: number,
  month: number,
  accountantUserId?: string,
): Promise<Result<GerenciaContableDashboard, OpsError>> {
  try {
    const data = await fetchGet<GerenciaContableDashboard>(
      API_ROUTES.DECLARATIONS_OPS.GERENCIA_CONTABLE_DASHBOARD(year, month, accountantUserId),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getGerenciaContableDashboard] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el panel del área." });
  }
}
