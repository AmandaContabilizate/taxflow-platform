"use server";

import { ApiError, fetchPost, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { PartnersError, SavePartnerInput, SavePartnerResponse } from "../types";

/**
 * Alta/edición de partner (Procedures). Al crear, el backend genera 3 códigos
 * de descuento automáticos ligados al partner (sin planes: se configuran
 * después en la pantalla de códigos).
 */
export async function savePartner(
  input: SavePartnerInput,
): Promise<Result<SavePartnerResponse, PartnersError>> {
  try {
    const body = {
      name: input.name,
      receivesCommission: input.receivesCommission,
      b2B2CExecutiveUserId: input.b2b2cExecutiveUserId ?? null,
      allianceStartDate: input.allianceStartDate ?? null,
      isActive: input.isActive,
    };
    const data =
      input.id !== undefined
        ? await fetchPut<SavePartnerResponse>(API_ROUTES.PARTNERS.UPDATE(input.id), body, "partners")
        : await fetchPost<SavePartnerResponse>(API_ROUTES.PARTNERS.CREATE, body, "partners");
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[savePartner] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar el partner." });
  }
}
