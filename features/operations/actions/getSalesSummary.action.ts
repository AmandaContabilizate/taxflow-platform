"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Paged, VentaResumen } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

const EMPTY: Paged<VentaResumen> = { items: [], total: 0, skip: 0, take: 0 };

export async function getSalesSummary(params: {
  skip?: number;
  take?: number;
  rfc?: string;
}): Promise<Result<Paged<VentaResumen>, OpsError>> {
  const { skip = 0, take = 100, rfc } = params;
  try {
    const data = await fetchGet<Paged<VentaResumen>>(
      API_ROUTES.SALES_OPS.SUMMARY(skip, take, rfc?.trim() || undefined),
      "sales_reports",
    );
    return ok(data ?? EMPTY);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getSalesSummary] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener las ventas.",
    });
  }
}
