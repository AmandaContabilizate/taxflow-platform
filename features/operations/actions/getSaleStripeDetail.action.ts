"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { VentaDetalleStripe } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

export async function getSaleStripeDetail(
  saleId: number,
): Promise<Result<VentaDetalleStripe, OpsError>> {
  try {
    const data = await fetchGet<VentaDetalleStripe>(
      API_ROUTES.SALES_OPS.DETAIL(saleId),
      "sales_reports",
    );
    if (!data) {
      return err({ statusCode: 404, message: "No encontramos esa venta." });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string } | null;
      if (body?.errorCode === "SALE_NOT_FOUND") {
        return err({ statusCode: e.status, message: "La venta no existe." });
      }
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getSaleStripeDetail] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los datos de Stripe de esta venta.",
    });
  }
}
