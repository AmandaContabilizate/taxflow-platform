"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiscountCodePreview } from "../types";

interface PreviewDiscountError {
  statusCode: number;
  message: string;
}

/**
 * Valida un código de descuento ANTES de pagar y regresa sus datos para
 * mostrar el preview en el carrito (mismas validaciones que el registro:
 * activo, whitelist de RFCs y usos disponibles). 404 = código inválido,
 * agotado o no autorizado para ese RFC.
 */
export async function previewDiscountCode(
  code: string,
  rfc: string,
): Promise<Result<DiscountCodePreview, PreviewDiscountError>> {
  try {
    const data = await fetchGet<DiscountCodePreview>(
      API_ROUTES.FINANCES.DISCOUNT_CODE_PREVIEW(code.trim().toUpperCase(), rfc),
      "finances",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({
        statusCode: e.status,
        message:
          e.status === 404
            ? "Código inválido, agotado o no disponible para este RFC."
            : e.message,
      });
    }
    console.error("[previewDiscountCode] Error:", e);
    return err({ statusCode: 500, message: "No pudimos validar el código." });
  }
}
