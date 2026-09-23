"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { RegisterSaleItem } from "../types";

export interface RegisterSaleOnBehalfRequest {
  items: RegisterSaleItem[];
  discountCode: string | null;
}

/** Liga de pago emitida al cliente (spec-liga-de-pago-vendedor): URL de /pago + texto para WhatsApp. */
export interface VendorPaymentLink {
  saleId: number;
  amount: number;
  paymentUrl: string;
  /** Vencimiento en UTC (ISO). */
  expiresAt: string;
  whatsAppText: string;
}

export interface RegisterSaleOnBehalfResponse {
  success: boolean;
  discountApplied: boolean;
  discountMessage: string | null;
  saleId: number;
  amount: number;
  /** 1 Abierta (con liga de pago) · 2 Pagada (total $0: nace pagada y activada). */
  statusSaleId: number;
  /** Solo cuando la venta quedó con saldo. */
  paymentLink: VendorPaymentLink | null;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export interface RegisterSaleOnBehalfError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

/**
 * Backoffice: arma una venta en nombre de un cliente ya registrado, firmada por el vendedor.
 * Sin saldo nace pagada y activada; con saldo el backend crea el cobro en Stripe y devuelve la
 * liga de 48 h. Los 400 traen el mismo cuerpo con errorCode.
 */
export async function registerSaleOnBehalf(
  taxpayerId: number,
  body: RegisterSaleOnBehalfRequest,
): Promise<Result<RegisterSaleOnBehalfResponse, RegisterSaleOnBehalfError>> {
  try {
    const response = await fetchPost<RegisterSaleOnBehalfResponse>(
      API_ROUTES.FINANCES.REGISTER_SALE_ON_BEHALF(taxpayerId),
      { ...body, discountCode: body.discountCode?.trim() || null },
      "finances",
    );
    return ok(response);
  } catch (e) {
    if (e instanceof ApiError) {
      // El 400 del registro devuelve RegisterSaleResult (errorCode/errorMessage), no ProblemDetails.
      const payload = (e as ApiError & { body?: RegisterSaleOnBehalfResponse }).body;
      return err({
        statusCode: e.status,
        errorCode: payload?.errorCode ?? e.errorCode,
        message: payload?.errorMessage ?? e.message,
      });
    }
    console.error("[registerSaleOnBehalf] Error:", e);
    return err({ statusCode: 500, message: "No se pudo registrar la venta." });
  }
}

/**
 * Re-emite la liga de pago (48 h) de una venta abierta armada desde el expediente. No crea cobro
 * nuevo. PAYMENT_SALE_NOT_OPEN si el cliente ya pagó o la venta se canceló.
 */
export async function reissuePaymentLinkOnBehalf(
  saleId: number,
): Promise<Result<VendorPaymentLink, RegisterSaleOnBehalfError>> {
  try {
    const response = await fetchPost<VendorPaymentLink>(
      API_ROUTES.FINANCES.REISSUE_PAYMENT_LINK_ON_BEHALF(saleId),
      {},
      "finances",
    );
    return ok(response);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    }
    console.error("[reissuePaymentLinkOnBehalf] Error:", e);
    return err({ statusCode: 500, message: "No se pudo emitir la liga de pago." });
  }
}
