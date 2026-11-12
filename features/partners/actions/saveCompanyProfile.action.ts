"use server";

import { ApiError, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyPriceInput, PartnersError, SaveCompanyProfileInput } from "../types";

function detailOf(e: ApiError): string {
  return typeof e.body === "object" && e.body !== null && "detail" in e.body
    ? String((e.body as { detail?: string }).detail)
    : e.message;
}

/** Crea o actualiza el perfil de empresa de la alianza (PUT empresas/{id}/perfil). */
export async function saveCompanyProfile(input: SaveCompanyProfileInput): Promise<Result<true, PartnersError>> {
  try {
    const { partnershipId, ...body } = input;
    await fetchPut<unknown>(API_ROUTES.EMPRESAS.PERFIL(partnershipId), body, "empresas");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: detailOf(e) });
    console.error("[saveCompanyProfile] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar el perfil de la empresa." });
  }
}

/** Reemplaza la lista de precios pactados (PUT empresas/{id}/precios). */
export async function saveCompanyPrices(
  partnershipId: number,
  prices: CompanyPriceInput[],
): Promise<Result<true, PartnersError>> {
  try {
    await fetchPut<unknown>(API_ROUTES.EMPRESAS.PRECIOS(partnershipId), { prices }, "empresas");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: detailOf(e) });
    console.error("[saveCompanyPrices] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar los precios." });
  }
}
