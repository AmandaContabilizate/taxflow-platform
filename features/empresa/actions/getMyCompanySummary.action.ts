"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanySummary, EmpresaError } from "../types";

interface GetMyCompanySummaryResponse {
  success: boolean;
  resumen: CompanySummary;
  /** true cuando quien consulta es interno (vista de seguimiento) y eligió la empresa. */
  esInterno: boolean;
}

/**
 * Resumen de mi empresa (Procedures, permiso Empresa.VerResumen). La empresa sale del token;
 * `partnershipId` solo lo usan internos con GerenciaComercial.VistaEmpresa / Backoffice.SoporteEmpresas.
 */
export async function getMyCompanySummary(
  partnershipId?: number,
): Promise<Result<{ resumen: CompanySummary; esInterno: boolean }, EmpresaError>> {
  try {
    const query = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<GetMyCompanySummaryResponse>(`${API_ROUTES.EMPRESA.RESUMEN}${query}`, "empresa");
    return ok({ resumen: data.resumen, esInterno: data.esInterno });
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string } | null;
      return err({ statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: e.message });
    }
    console.error("[getMyCompanySummary] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar el resumen de tu empresa." });
  }
}
