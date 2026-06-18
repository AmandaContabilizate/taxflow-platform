"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type PlansCatalog, toPlansCatalog } from "../types";

interface PlansError {
  statusCode: number;
  message: string;
}

export async function getPlans(
  rfc: string,
): Promise<Result<PlansCatalog, PlansError>> {
  try {
    const data = await fetchGet<unknown>(
      API_ROUTES.CATALOGS.PLANS(rfc),
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
