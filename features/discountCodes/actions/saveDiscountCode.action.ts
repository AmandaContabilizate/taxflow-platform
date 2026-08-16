"use server";

import { ApiError, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiscountCodesError, SaveDiscountCodeInput } from "../types";

/** Alta/edición de código de descuento (Procedures). Sin borrado: activar/desactivar. */
export async function saveDiscountCode(
  input: SaveDiscountCodeInput,
): Promise<Result<true, DiscountCodesError>> {
  try {
    const body = {
      code: input.code,
      description: input.description ?? null,
      partnershipId: input.partnershipId ?? null,
      sellerUserId: input.sellerUserId ?? null,
      discountTypeId: input.discountTypeId,
      discountPercent: input.discountPercent ?? null,
      declarationsCount: input.declarationsCount ?? null,
      maxUses: input.maxUses,
      subscriptionPlanIds: input.subscriptionPlanIds,
      whitelistedRfcs: input.whitelistedRfcs,
      isActive: input.isActive,
    };
    if (input.id !== undefined) {
      await fetchPut(API_ROUTES.DISCOUNT_CODES.UPDATE(input.id), body, "discount_codes");
    } else {
      await fetchPost(API_ROUTES.DISCOUNT_CODES.CREATE, body, "discount_codes");
    }
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[saveDiscountCode] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar el código." });
  }
}
