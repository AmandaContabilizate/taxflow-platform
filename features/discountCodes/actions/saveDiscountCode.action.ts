"use server";

import { ApiError, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiscountCodesError, SaveDiscountCodeInput, SaveDiscountCodeResult } from "../types";

/**
 * Alta/edición de código de descuento (Procedures). Sin borrado: activar/desactivar.
 * Si el código es BASE (molde de asesores), el resultado trae el resumen del reparto:
 * cuántas copias se crearon y cuántos asesores ya tenían la suya.
 */
export async function saveDiscountCode(
  input: SaveDiscountCodeInput,
): Promise<Result<SaveDiscountCodeResult, DiscountCodesError>> {
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
      isBaseTemplate: input.isBaseTemplate ?? false,
      baseTemplateSegmentId: input.baseTemplateSegmentId ?? null,
    };
    const data = input.id !== undefined
      ? await fetchPut<SaveDiscountCodeResult>(API_ROUTES.DISCOUNT_CODES.UPDATE(input.id), body, "discount_codes")
      : await fetchPost<SaveDiscountCodeResult>(API_ROUTES.DISCOUNT_CODES.CREATE, body, "discount_codes");
    return ok(data);
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
