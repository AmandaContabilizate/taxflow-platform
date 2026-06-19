"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ProcedureSale } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

export async function getProcedureSales(
  skip = 0,
  take = 500,
): Promise<Result<ProcedureSale[], OpsError>> {
  try {
    const data = await fetchGet<ProcedureSale[]>(
      API_ROUTES.SALES_OPS.PROCEDURES(skip, take),
      "sales_reports",
    );
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getProcedureSales] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los trámites adicionales.",
    });
  }
}
