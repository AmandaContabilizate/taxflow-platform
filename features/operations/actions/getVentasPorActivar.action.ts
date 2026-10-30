"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { VentasPorActivarPage } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: VentasPorActivarPage = { items: [], total: 0, skip: 0, take: 0, porMotivo: {} };

/**
 * Ventas pagadas cuyo cumplimiento quedó incompleto (plan sin régimen o sin declaraciones
 * ligadas), con el motivo derivado. Pantalla "Ventas por activar".
 */
export async function getVentasPorActivar(params: {
  skip?: number;
  take?: number;
  search?: string;
  queFalta?: string;
}): Promise<Result<VentasPorActivarPage, OpsError>> {
  const { skip = 0, take = 100, search, queFalta } = params;
  try {
    const data = await fetchGet<VentasPorActivarPage>(
      API_ROUTES.SALES_OPS.POR_ACTIVAR(skip, take, search?.trim() || undefined, queFalta || undefined),
      "sales_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getVentasPorActivar] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las ventas por activar." });
  }
}
