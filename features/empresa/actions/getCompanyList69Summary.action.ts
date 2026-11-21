"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyList69Summary, EmpresaError } from "../types";

/** Tablero "Listas del SAT" de mi empresa (Procedures, permiso Empresa.VerExpediente). */
export async function getCompanyList69Summary(partnershipId?: number): Promise<Result<CompanyList69Summary, EmpresaError>> {
  try {
    const query = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<{ success: boolean; listas: CompanyList69Summary }>(`${API_ROUTES.EMPRESA.LISTAS_SAT}${query}`, "empresa");
    return ok(data.listas);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string; message?: string } | null;
      return err({ statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message });
    }
    console.error("[getCompanyList69Summary] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar las listas del SAT." });
  }
}
