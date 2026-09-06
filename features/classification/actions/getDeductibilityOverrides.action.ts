"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeductibilityOverridesPage } from "../types";

interface DeductibilityOverridesError {
  statusCode: number;
  message: string;
}

const EMPTY: DeductibilityOverridesPage = { page: 1, pageSize: 20, total: 0, items: [] };

// Bitácora de overrides de deducibilidad forzada (rol Admin, solo lectura).
export async function getDeductibilityOverrides(params: {
  activityId?: number;
  rfc?: string;
  page?: number;
  pageSize?: number;
}): Promise<Result<DeductibilityOverridesPage, DeductibilityOverridesError>> {
  const { activityId, rfc, page = 1, pageSize = 20 } = params;
  try {
    const data = await fetchGet<DeductibilityOverridesPage>(
      API_ROUTES.CLASSIFICATION_RULES_ADMIN.DEDUCTIBILITY_OVERRIDES(
        activityId,
        rfc?.trim() || undefined,
        page,
        pageSize,
      ),
      "classification_rules_admin",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeductibilityOverrides] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los overrides de deducibilidad.",
    });
  }
}
