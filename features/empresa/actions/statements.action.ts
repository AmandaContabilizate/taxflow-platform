"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CloseStatementsResult, CompanyStatement, CompanyStatementDetail, EmpresaError } from "../types";

function toError(e: unknown, fallback: string, tag: string): EmpresaError {
  if (e instanceof ApiError) {
    const body = e.body as { errorCode?: string; message?: string } | null;
    return { statusCode: e.status, errorCode: e.errorCode ?? body?.errorCode, message: body?.message ?? e.message };
  }
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

// ───────────── Lado empresa (permiso Empresa.VerFacturacion) ─────────────

export async function getMyCompanyStatements(partnershipId?: number): Promise<Result<CompanyStatement[], EmpresaError>> {
  try {
    const q = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<{ success: boolean; estados: CompanyStatement[] }>(`${API_ROUTES.EMPRESA.FACTURACION}${q}`, "empresa");
    return ok(data.estados ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar la facturación de tu empresa.", "getMyCompanyStatements"));
  }
}

export async function getMyCompanyStatementDetail(statementId: number, partnershipId?: number): Promise<Result<CompanyStatementDetail, EmpresaError>> {
  try {
    const q = partnershipId ? `?partnershipId=${partnershipId}` : "";
    const data = await fetchGet<{ success: boolean; estado: CompanyStatementDetail }>(`${API_ROUTES.EMPRESA.FACTURACION_DETALLE(statementId)}${q}`, "empresa");
    return ok(data.estado);
  } catch (e) {
    return err(toError(e, "No pudimos cargar el estado de cuenta.", "getMyCompanyStatementDetail"));
  }
}

// ───────────── Lado backoffice / Finanzas (claim Backoffice.ManageEmpresas) ─────────────

export async function getCompanyStatements(partnershipId?: number, status?: number): Promise<Result<CompanyStatement[], EmpresaError>> {
  try {
    const qs = new URLSearchParams();
    if (partnershipId) qs.set("partnershipId", String(partnershipId));
    if (status) qs.set("status", String(status));
    const q = qs.toString();
    const data = await fetchGet<{ success: boolean; estados: CompanyStatement[] }>(`${API_ROUTES.EMPRESAS.ESTADOS_CUENTA}${q ? `?${q}` : ""}`, "empresas");
    return ok(data.estados ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar los estados de cuenta.", "getCompanyStatements"));
  }
}

export async function getCompanyStatementDetail(statementId: number): Promise<Result<CompanyStatementDetail, EmpresaError>> {
  try {
    const data = await fetchGet<{ success: boolean; estado: CompanyStatementDetail }>(API_ROUTES.EMPRESAS.ESTADO_CUENTA(statementId), "empresas");
    return ok(data.estado);
  } catch (e) {
    return err(toError(e, "No pudimos cargar el estado de cuenta.", "getCompanyStatementDetail"));
  }
}

/** Corte manual del periodo (YYYY-MM; vacío = mes anterior), todas las empresas o una. */
export async function closeCompanyStatements(period?: string, partnershipId?: number): Promise<Result<CloseStatementsResult, EmpresaError>> {
  try {
    const qs = new URLSearchParams();
    if (period) qs.set("period", period);
    if (partnershipId) qs.set("partnershipId", String(partnershipId));
    const q = qs.toString();
    const data = await fetchPost<{ success: boolean; resultado: CloseStatementsResult }>(`${API_ROUTES.EMPRESAS.ESTADOS_CUENTA_CERRAR}${q ? `?${q}` : ""}`, {}, "empresas");
    return ok(data.resultado);
  } catch (e) {
    return err(toError(e, "No pudimos hacer el corte.", "closeCompanyStatements"));
  }
}

export async function markCompanyStatementPaid(statementId: number, referencia: string | null): Promise<Result<true, EmpresaError>> {
  try {
    await fetchPost<{ success: boolean }>(API_ROUTES.EMPRESAS.ESTADO_CUENTA_PAGADO(statementId), { referencia }, "empresas");
    return ok(true);
  } catch (e) {
    return err(toError(e, "No pudimos marcar el pago.", "markCompanyStatementPaid"));
  }
}
