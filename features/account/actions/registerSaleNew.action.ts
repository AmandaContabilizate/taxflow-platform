"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { RegisterSaleNewRequest, RegisterSaleNewResponse } from "../types";

interface RegisterSaleError {
  statusCode: number;
  message: string;
}

/**
 * Registra la venta ANTES de presentar el pago (paso 5 de la spec).
 * Si falla, el llamador debe abortar el cobro y no mostrar el formulario.
 */
export async function registerSaleNew(
  body: RegisterSaleNewRequest,
): Promise<Result<RegisterSaleNewResponse, RegisterSaleError>> {
  try {
    const response = await fetchPost<RegisterSaleNewResponse>(
      API_ROUTES.FINANCES.REGISTER_SALE_NEW,
      {
        ...body,
        discountCode: body.discountCode?.trim() || null,
      },
      "finances",
    );
    return ok(response);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[registerSaleNew] Error:", e);
    return err({ statusCode: 500, message: "No se pudo registrar la venta." });
  }
}
