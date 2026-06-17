"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type {
  PromotionCodeValidateRequest,
  PromotionCodeValidateResponse,
} from "../types";

interface PromotionCodeError {
  statusCode: number;
  message: string;
}

export async function validatePromotionCode(
  body: PromotionCodeValidateRequest,
): Promise<Result<PromotionCodeValidateResponse, PromotionCodeError>> {
  try {
    const data = await fetchPost<PromotionCodeValidateResponse>(
      API_ROUTES.STRIPE.PROMOTION_CODE_VALIDATE,
      body,
      "stripe",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[validatePromotionCode] Error:", e);
    return err({
      statusCode: 500,
      message: "No se pudo validar el código de descuento.",
    });
  }
}
