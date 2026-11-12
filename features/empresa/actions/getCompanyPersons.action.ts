"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyPersonsPage, EmpresaError, GetCompanyPersonsParams } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

/** Personas de mi empresa con filtros y paginación (Procedures, permiso Empresa.VerExpediente). */
export async function getCompanyPersons(params: GetCompanyPersonsParams = {}): Promise<Result<CompanyPersonsPage, EmpresaError>> {
  try {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.stage) qs.set("stage", String(params.stage));
    if (params.relationType) qs.set("relationType", String(params.relationType));
    if (params.includeInactive) qs.set("includeInactive", "true");
    if (params.invitedOnly) qs.set("invitedOnly", "true");
    qs.set("page", String(params.page ?? 1));
    qs.set("pageSize", String(params.pageSize ?? 50));
    if (params.partnershipId) qs.set("partnershipId", String(params.partnershipId));
    const data = await fetchGet<{ success: boolean; personas: CompanyPersonsPage }>(
      `${API_ROUTES.EMPRESA.PERSONAS}?${qs.toString()}`,
      "empresa",
    );
    return ok(data.personas);
  } catch (e) {
    return err(toError(e, "No pudimos cargar las personas de tu empresa.", "getCompanyPersons"));
  }
}
