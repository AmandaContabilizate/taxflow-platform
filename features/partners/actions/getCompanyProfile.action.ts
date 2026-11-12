"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyProfile, PartnersError } from "../types";

/** Perfil de empresa de una alianza (Procedures, claim Backoffice.ManageEmpresas). */
export async function getCompanyProfile(partnershipId: number): Promise<Result<CompanyProfile, PartnersError>> {
  try {
    const data = await fetchGet<{ success: boolean; perfil: CompanyProfile }>(
      API_ROUTES.EMPRESAS.PERFIL(partnershipId),
      "empresas",
    );
    return ok(data.perfil);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message });
    console.error("[getCompanyProfile] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar el perfil de la empresa." });
  }
}
