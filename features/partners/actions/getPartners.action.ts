"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { Partner, PartnersError } from "../types";

interface GetPartnersResponse {
  success: boolean;
  partners: Partner[];
}

/** Listado de partners y alianzas B2B2C (GET /partners, Procedures). */
export async function getPartners(): Promise<Result<Partner[], PartnersError>> {
  try {
    const data = await fetchGet<GetPartnersResponse>(API_ROUTES.PARTNERS.LIST, "partners");
    return ok(data?.partners ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPartners] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los partners." });
  }
}
