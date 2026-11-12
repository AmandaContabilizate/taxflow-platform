"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ActivatePersonResult, ActivationCandidate, EmpresaError } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

/** Cola del gerente: personas listas para activar (Procedures, claim GerenciaComercial.ActivarPersonasEmpresa). */
export async function getActivationQueue(partnershipId?: number): Promise<Result<ActivationCandidate[], EmpresaError>> {
  try {
    const query = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<{ success: boolean; candidatas: ActivationCandidate[] }>(
      `${API_ROUTES.EMPRESAS.ACTIVACIONES_PENDIENTES}${query}`,
      "empresas",
    );
    return ok(data.candidatas ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar la cola de activaciones.", "getActivationQueue"));
  }
}

/** Activa a una persona con el plan elegido: venta a futuro con cupón 100 % de la alianza, pagada por la empresa. */
export async function activateCompanyPerson(
  partnershipId: number,
  personId: number,
  planId: number,
): Promise<Result<ActivatePersonResult, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; resultado: ActivatePersonResult }>(
      API_ROUTES.EMPRESAS.ACTIVAR_PERSONA(partnershipId, personId),
      { planId },
      "empresas",
    );
    return ok(data.resultado);
  } catch (e) {
    if (e instanceof ApiError && e.body && typeof e.body === "object" && "resultado" in e.body) {
      const r = (e.body as { resultado: ActivatePersonResult }).resultado;
      return err({ statusCode: e.status, errorCode: r.errorCode ?? undefined, message: r.errorMessage ?? e.message });
    }
    return err(toError(e, "No pudimos activar a la persona.", "activateCompanyPerson"));
  }
}
