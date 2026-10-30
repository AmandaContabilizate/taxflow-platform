"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type {
  CommissionOperationRow,
  CommissionsError,
  MyCommissionSummary,
  TeamCommissionSummary,
} from "../types";

function toError(e: unknown, fallback: string): CommissionsError {
  if (e instanceof ApiError) {
    return { statusCode: e.status, message: e.message };
  }
  console.error("[commissions] Error:", e);
  return { statusCode: 500, message: fallback };
}

/**
 * Resumen de comisiones del usuario para un periodo (GET /commissions/my-summary).
 * Cifras del cierre si el periodo cerró; proyección en vivo si no.
 * 404 = el usuario no tiene perfil comercial configurado.
 */
export async function getMyCommissionSummary(
  period: string,
): Promise<Result<MyCommissionSummary, CommissionsError>> {
  try {
    const data = await fetchGet<{ success: boolean; summary: MyCommissionSummary }>(
      API_ROUTES.COMMISSIONS.MY_SUMMARY(period),
      "commissions",
    );
    return ok(data.summary);
  } catch (e) {
    return err(toError(e, "No pudimos obtener tu resumen de comisiones."));
  }
}

/** Operaciones del usuario en el periodo (GET /commissions/my-operations). */
export async function getMyCommissionOperations(
  period: string,
): Promise<Result<CommissionOperationRow[], CommissionsError>> {
  try {
    const data = await fetchGet<{ success: boolean; operations: CommissionOperationRow[] }>(
      API_ROUTES.COMMISSIONS.MY_OPERATIONS(period),
      "commissions",
    );
    return ok(data?.operations ?? []);
  } catch (e) {
    return err(toError(e, "No pudimos obtener tus operaciones."));
  }
}

/**
 * Recalcula las metas dinámicas de los gerentes del periodo (Regla 10) —
 * POST /commissions/goals/recalculate. Claim Admin.RunCommissionClose.
 * Necesario cuando cambia la plantilla/elegibilidad a media mes; el cierre
 * mensual también lo dispara solo.
 */
export async function recalculateManagerGoals(
  period: string,
): Promise<Result<number, CommissionsError>> {
  try {
    const data = await fetchPost<{ success: boolean; managersProcessed: number }>(
      API_ROUTES.COMMISSIONS.RECALC_GOALS(period),
      {},
      "commissions",
    );
    return ok(data.managersProcessed);
  } catch (e) {
    return err(toError(e, "No pudimos recalcular las metas."));
  }
}

/** Panel de equipo del gerente (GET /commissions/team-summary). */
export async function getTeamCommissionSummary(
  period: string,
): Promise<Result<TeamCommissionSummary, CommissionsError>> {
  try {
    const data = await fetchGet<{ success: boolean; summary: TeamCommissionSummary }>(
      API_ROUTES.COMMISSIONS.TEAM_SUMMARY(period),
      "commissions",
    );
    return ok(data.summary);
  } catch (e) {
    return err(toError(e, "No pudimos obtener el panel de tu equipo."));
  }
}
