"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiscountCodeAdmin, DiscountCodeLookups, DiscountCodesError } from "../types";

interface GetCodesResponse {
  success: boolean;
  codes: DiscountCodeAdmin[];
}

interface GetLookupsResponse {
  success: boolean;
  lookups: DiscountCodeLookups;
}

/** Listado de códigos de descuento para administración (GET /discount-codes). */
export async function getDiscountCodes(): Promise<Result<DiscountCodeAdmin[], DiscountCodesError>> {
  try {
    const data = await fetchGet<GetCodesResponse>(API_ROUTES.DISCOUNT_CODES.LIST, "discount_codes");
    return ok(data?.codes ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDiscountCodes] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los códigos." });
  }
}

/** Catálogos del modal: dueños (perfiles comerciales), partners y planes. */
export async function getDiscountCodeLookups(): Promise<Result<DiscountCodeLookups, DiscountCodesError>> {
  try {
    const data = await fetchGet<GetLookupsResponse>(API_ROUTES.DISCOUNT_CODES.LOOKUPS, "discount_codes");
    return ok(data.lookups);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDiscountCodeLookups] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los catálogos." });
  }
}
