"use server";

import { cookies } from "next/headers";
import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { PaymentSheetParams, RegisterSaleItem } from "../types";

interface PaymentSheetError {
  statusCode: number;
  message: string;
}

/**
 * Crea el PaymentSheet en Stripe (paso 4 de la spec). El `email` se toma de la
 * cookie de sesión (httpOnly), no se recibe del cliente.
 */
export async function createPaymentSheet(
  rfc: string,
  items: RegisterSaleItem[],
): Promise<Result<PaymentSheetParams, PaymentSheetError>> {
  try {
    const cookieStore = await cookies();
    const email = cookieStore.get("email")?.value ?? "";

    const data = await fetchPost<PaymentSheetParams>(
      API_ROUTES.STRIPE.PAYMENT_SHEET,
      { rfc, email, items },
      "stripe",
    );

    if (!data?.paymentIntentClientSecret) {
      return err({
        statusCode: 422,
        message: data?.error ?? "No se pudo iniciar el pago.",
      });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[createPaymentSheet] Error:", e);
    return err({ statusCode: 500, message: "No se pudo iniciar el pago." });
  }
}
