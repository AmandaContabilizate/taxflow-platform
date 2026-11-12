"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyPersonFile, EmpresaError } from "../types";

/** Expediente de una persona de mi empresa (Procedures, permiso Empresa.VerExpediente). Cada lectura deja bitácora. */
export async function getCompanyPersonFile(personId: number, partnershipId?: number): Promise<Result<CompanyPersonFile, EmpresaError>> {
  try {
    const query = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<{ success: boolean; expediente: CompanyPersonFile }>(
      `${API_ROUTES.EMPRESA.PERSONA_EXPEDIENTE(personId)}${query}`,
      "empresa",
    );
    return ok(data.expediente);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string; message?: string } | null;
      return err({ statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message });
    }
    console.error("[getCompanyPersonFile] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar el expediente." });
  }
}
