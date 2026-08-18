"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type {
  DiscountCodeAdmin,
  DiscountCodeAuthorization,
  DiscountCodeLookups,
  DiscountCodesError,
} from "../types";

interface GetCodesResponse {
  success: boolean;
  codes: DiscountCodeAdmin[];
}

interface GetLookupsResponse {
  success: boolean;
  lookups: DiscountCodeLookups;
}

/**
 * Bitácora de autorizaciones de códigos fuera de tope (GET /discount-codes/authorizations):
 * quién activó/desactivó cada código con más de 20% o 3 declaraciones, cuándo y con qué snapshot.
 */
export async function getDiscountCodeAuthorizations(): Promise<
  Result<DiscountCodeAuthorization[], DiscountCodesError>
> {
  try {
    const data = await fetchGet<DiscountCodeAuthorization[]>(
      API_ROUTES.DISCOUNT_CODES.AUTHORIZATIONS,
      "discount_codes",
    );
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDiscountCodeAuthorizations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener la bitácora de autorizaciones." });
  }
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
