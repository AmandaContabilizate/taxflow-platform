"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyServices, ContractServicesResult, EmpresaError } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

const withCompany = (path: string, partnershipId?: number) => (partnershipId ? `${path}?partnershipId=${partnershipId}` : path);

/** Catálogo de servicios con precio pactado + servicios vivos por persona (permiso Empresa.VerServicios). */
export async function getCompanyServices(partnershipId?: number): Promise<Result<CompanyServices, EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; servicios: CompanyServices }>(withCompany(API_ROUTES.EMPRESA.SERVICIOS, partnershipId), "empresa");
    return ok(data.servicios);
  } catch (e) {
    return err(toError(e, "No pudimos cargar los servicios.", "getCompanyServices"));
  }
}

/** Contrata un servicio para una o varias personas: venta en $0 con el cupón de la empresa (permiso Empresa.ContratarServicios). */
export async function contractCompanyService(planId: number, personIds: number[], partnershipId?: number): Promise<Result<ContractServicesResult, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; resultado: ContractServicesResult }>(
      withCompany(API_ROUTES.EMPRESA.SERVICIOS_CONTRATAR, partnershipId),
      { planId, personIds },
      "empresa",
    );
    return ok(data.resultado);
  } catch (e) {
    return err(toError(e, "No pudimos contratar el servicio.", "contractCompanyService"));
  }
}

/** Baja de un servicio pagado por la empresa: sigue vigente hasta el fin del periodo. */
export async function cancelCompanyService(subscriptionId: number, partnershipId?: number): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(withCompany(API_ROUTES.EMPRESA.SERVICIO_BAJA(subscriptionId), partnershipId), {}, "empresa");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos dar de baja el servicio.", "cancelCompanyService"));
  }
}
