"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { SalePaymentInstructions } from "../types";

interface PaymentInstructionsError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

// Mensajes propios: estos errorCode no viven en el catálogo compartido (getErrorMessage).
const ERROR_MESSAGES: Record<string, string> = {
  SALE_NOT_FOUND: "No encontramos esta compra.",
  PAYMENT_INSTRUCTIONS_NOT_AVAILABLE: "Esta compra no tiene datos de pago disponibles.",
  PAYMENT_INTENT_NOT_FOUND: "No pudimos consultar el estado del pago con Stripe. Intenta de nuevo.",
};

// Instrucciones de pago (SPEI/OXXO) de una venta pendiente.
export async function getSalePaymentInstructions(
  saleId: number,
): Promise<Result<SalePaymentInstructions, PaymentInstructionsError>> {
  try {
    const data = await fetchGet<SalePaymentInstructions>(
      API_ROUTES.SALES.PAYMENT_INSTRUCTIONS(saleId),
      "sales_procedures",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      const message = (e.errorCode && ERROR_MESSAGES[e.errorCode]) || e.message;
      return err({ statusCode: e.status, message, errorCode: e.errorCode });
    }
    console.error("[getSalePaymentInstructions] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los datos de pago." });
  }
}
