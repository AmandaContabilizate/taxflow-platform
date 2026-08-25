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
 * `discountCode` (opcional) se valida server-side: si aplica, el cobro de
 * Stripe sale ya descontado (coincide con el Sale.Amount del registro).
 *
 * La cookie `email` es de sesión (muere al cerrar el navegador) mientras que
 * `auth_token`/`claim_*` sobreviven: al reabrir Chrome la sesión sigue viva
 * pero sin `email`, y el back respondía 500 "Value cannot be null
 * (Parameter 'email')". Por eso se cae al claim del token y, si tampoco está,
 * se corta aquí con un mensaje claro en vez de pegarle al back con vacío.
 */
export async function createPaymentSheet(
  rfc: string,
  items: RegisterSaleItem[],
  discountCode?: string | null,
): Promise<Result<PaymentSheetParams, PaymentSheetError>> {
  try {
    const cookieStore = await cookies();
    const email = (
      cookieStore.get("email")?.value ||
      cookieStore.get("claim_email")?.value ||
      ""
    ).trim();

    if (!email) {
      return err({
        statusCode: 401,
        message: "Tu sesión ya no tiene tu correo. Vuelve a iniciar sesión para pagar.",
      });
    }

    const data = await fetchPost<PaymentSheetParams>(
      API_ROUTES.STRIPE.PAYMENT_SHEET,
      { rfc, email, items, discountCode: discountCode?.trim() || null },
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
