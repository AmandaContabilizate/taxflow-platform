"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Plan } from "../types";

interface PlansError {
  statusCode: number;
  message: string;
}

export async function getPlans(
  rfc: string,
): Promise<Result<Plan[], PlansError>> {
  try {
    const data = await fetchGet<Plan[]>(
      API_ROUTES.CATALOGS.PLANS(rfc),
      "catalogs_procedures",
    );
    const plans = Array.isArray(data) ? data.filter((p) => p.isActive) : [];
    return ok(plans);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPlans] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los planes." });
  }
}
