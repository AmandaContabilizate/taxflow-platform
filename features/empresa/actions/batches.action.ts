"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CompanyBatch, CompanyBatchDetail, EmpresaError, ProposeBatchesResult, RunBatchResult } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

/** Lotes de activación (todas las empresas o una). Claim GerenciaComercial.ActivarPersonasEmpresa. */
export async function getCompanyBatches(partnershipId?: number, status?: number): Promise<Result<CompanyBatch[], EmpresaError>> {
  try {
    const qs = new URLSearchParams();
    if (partnershipId) qs.set("partnershipId", String(partnershipId));
    if (status) qs.set("status", String(status));
    const q = qs.toString();
    const data = await fetchGet<{ success: boolean; lotes: CompanyBatch[] }>(`${API_ROUTES.EMPRESAS.LOTES}${q ? `?${q}` : ""}`, "empresas");
    return ok(data.lotes ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar los lotes.", "getCompanyBatches"));
  }
}

export async function getCompanyBatchDetail(batchId: number): Promise<Result<CompanyBatchDetail, EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; lote: CompanyBatchDetail }>(API_ROUTES.EMPRESAS.LOTE(batchId), "empresas");
    return ok(data.lote);
  } catch (e) {
    return err(toError(e, "No pudimos cargar el lote.", "getCompanyBatchDetail"));
  }
}

/** Propone el lote de hoy sin esperar al cron (todas las empresas o una). */
export async function proposeCompanyBatches(partnershipId?: number): Promise<Result<ProposeBatchesResult, EmpresaError>> {
  try {
    const q = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchPost<{ success: boolean; resultado: ProposeBatchesResult }>(`${API_ROUTES.EMPRESAS.LOTES_PROPONER}${q}`, {}, "empresas");
    return ok(data.resultado);
  } catch (e) {
    return err(toError(e, "No pudimos proponer los lotes.", "proposeCompanyBatches"));
  }
}

export async function approveCompanyBatch(batchId: number, excludedPersonIds: number[]): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(API_ROUTES.EMPRESAS.LOTE_APROBAR(batchId), { excluir: excludedPersonIds }, "empresas");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos aprobar el lote.", "approveCompanyBatch"));
  }
}

export async function cancelCompanyBatch(batchId: number): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(API_ROUTES.EMPRESAS.LOTE_CANCELAR(batchId), {}, "empresas");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos cancelar el lote.", "cancelCompanyBatch"));
  }
}

/** Ejecuta o continúa un lote aprobado; devuelve el avance (puede quedar "En proceso" si se agota el tiempo). */
export async function runCompanyBatch(batchId: number): Promise<Result<RunBatchResult, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; avance: RunBatchResult }>(API_ROUTES.EMPRESAS.LOTE_EJECUTAR(batchId), {}, "empresas");
    return ok(data.avance);
  } catch (e) {
    return err(toError(e, "No pudimos ejecutar el lote.", "runCompanyBatch"));
  }
}

export async function retryCompanyBatch(batchId: number): Promise<Result<number, EmpresaError>> {
  try {
    const data = await fetchPost<{ success: boolean; reintentadas: number }>(API_ROUTES.EMPRESAS.LOTE_REINTENTAR(batchId), {}, "empresas");
    return ok(data.reintentadas);
  } catch (e) {
    return err(toError(e, "No pudimos reintentar el lote.", "retryCompanyBatch"));
  }
}
