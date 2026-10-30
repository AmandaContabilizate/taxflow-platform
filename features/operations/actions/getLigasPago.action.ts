"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { LigasPagoPage } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: LigasPagoPage = { items: [], total: 0, skip: 0, take: 0, porEstado: {} };

/**
 * Ligas de pago emitidas desde el backoffice con su estado derivado. Pestaña "Ligas de pago" de
 * Ventas por activar. `soloMias` acota a las emitidas por el usuario de la sesión.
 */
export async function getLigasPago(params: {
  skip?: number;
  take?: number;
  search?: string;
  estado?: string;
  soloMias?: boolean;
}): Promise<Result<LigasPagoPage, OpsError>> {
  const { skip = 0, take = 100, search, estado, soloMias = false } = params;
  try {
    const data = await fetchGet<LigasPagoPage>(
      API_ROUTES.SALES_OPS.LIGAS_PAGO(skip, take, search?.trim() || undefined, estado || undefined, soloMias),
      "sales_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getLigasPago] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las ligas de pago." });
  }
}
