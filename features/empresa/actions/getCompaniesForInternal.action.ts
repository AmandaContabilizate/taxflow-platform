"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyListItem, EmpresaError } from "../types";

/** Empresas con perfil para la vista interna (Gerencia Comercial / soporte). */
export async function getCompaniesForInternal(onlyWithProfile = true): Promise<Result<CompanyListItem[], EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; empresas: CompanyListItem[] }>(
      `${API_ROUTES.EMPRESAS.LIST}?soloConPerfil=${onlyWithProfile ? "true" : "false"}`,
      "empresas",
    );
    return ok(data.empresas ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      const body = e.body as { errorCode?: string; message?: string } | null;
      return err({ statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message });
    }
    console.error("[getCompaniesForInternal] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar las empresas." });
  }
}
