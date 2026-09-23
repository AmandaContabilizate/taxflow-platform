"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type PlansCatalog, toPlansCatalog } from "../types";

interface PlansError {
  statusCode: number;
  message: string;
}

/**
 * Catálogo de planes y trámites para un RFC.
 * @param backoffice Solo desde Armar venta (claim Comercial.EmitirLigaPago): sin régimen documentado
 * devuelve todo el catálogo. En la app del cliente sin constancia no se devuelve ningún plan.
 */
export async function getPlans(
  rfc: string,
  backoffice = false,
): Promise<Result<PlansCatalog, PlansError>> {
  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.CATALOGS.PLANS(rfc, backoffice),
      "catalogs_procedures",
    );
    return ok(toPlansCatalog(data));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPlans] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los planes." });
  }
}
