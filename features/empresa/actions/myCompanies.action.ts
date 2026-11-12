"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { EmpresaError, MyCompanyLink } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

/** Empresas vinculadas a mi cuenta y qué les autoricé (Procedures, cualquier usuario autenticado). */
export async function getMyCompanies(): Promise<Result<MyCompanyLink[], EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; empresas: MyCompanyLink[] }>(API_ROUTES.MIS_EMPRESAS.LIST, "mis_empresas");
    return ok(data.empresas ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar tus empresas.", "getMyCompanies"));
  }
}

/** Autorizo (o cambio) lo que la empresa puede ver. `scope` = bits de CONSENT_SCOPES. */
export async function grantCompanyConsent(personId: number, scope: number): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(API_ROUTES.MIS_EMPRESAS.CONSENTIMIENTO(personId), { scope }, "mis_empresas");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos guardar tu autorización.", "grantCompanyConsent"));
  }
}

/** Retiro la autorización: la empresa vuelve a ver solo mi etapa. */
export async function revokeCompanyConsent(personId: number): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(API_ROUTES.MIS_EMPRESAS.REVOCAR(personId), {}, "mis_empresas");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos retirar la autorización.", "revokeCompanyConsent"));
  }
}
