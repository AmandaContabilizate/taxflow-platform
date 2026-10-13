"use server";

import { ApiError, fetchGet, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type {
  InactiveRegimeActivitiesResponse,
  PendingActivityAssignment,
  PendingActivityKind,
  RegimeActivityMatrixItem,
} from "../types";

interface TaxpayersError {
  statusCode: number;
  message: string;
}

/**
 * Matriz régimen × actividad de un contribuyente (GET /Taxpayers/regime-activities).
 * Requiere el permiso AccountingManager.GetRegimeActivities (gerencia de contabilidad).
 */
export async function getRegimeActivities(
  rfc: string,
): Promise<Result<RegimeActivityMatrixItem[], TaxpayersError>> {
  try {
    const data = await fetchGet<{ success: boolean; matrix: RegimeActivityMatrixItem[] }>(
      API_ROUTES.TAXPAYERS.REGIME_ACTIVITIES(rfc),
      "taxpayers",
    );
    return ok(data?.matrix ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getRegimeActivities] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las actividades." });
  }
}

/**
 * Activa o desactiva una actividad dentro de un régimen del contribuyente
 * (PUT /Taxpayers/regime-activities/activate|deactivate). El backend valida
 * que el régimen esté activo y la actividad exista en la última CSF leída.
 */
export async function setRegimeActivityActive(
  rfc: string,
  regimeId: number,
  activityId: number,
  active: boolean,
): Promise<Result<true, TaxpayersError>> {
  try {
    const route = active
      ? API_ROUTES.TAXPAYERS.REGIME_ACTIVITY_ACTIVATE(rfc, regimeId, activityId)
      : API_ROUTES.TAXPAYERS.REGIME_ACTIVITY_DEACTIVATE(rfc, regimeId, activityId);
    await fetchPut(route, {}, "taxpayers");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[setRegimeActivityActive] Error:", e);
    return err({ statusCode: 500, message: "No pudimos actualizar la actividad." });
  }
}

/**
 * Regímenes dados de baja del contribuyente, con actividades asignadas, sugeridas por IDC y el
 * catálogo completo (GET /Taxpayers/regime-activities/inactive).
 */
export async function getInactiveRegimeActivities(
  rfc: string,
): Promise<Result<InactiveRegimeActivitiesResponse, TaxpayersError>> {
  try {
    const data = await fetchGet<{ success: boolean } & InactiveRegimeActivitiesResponse>(
      API_ROUTES.TAXPAYERS.REGIME_ACTIVITIES_INACTIVE(rfc),
      "taxpayers",
    );
    return ok({ regimes: data?.regimes ?? [], catalog: data?.catalog ?? [] });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getInactiveRegimeActivities] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los regímenes dados de baja." });
  }
}

/**
 * Reemplaza las actividades de un régimen dado de baja (PUT /Taxpayers/regime-activities/inactive).
 * Devuelve los ids que el catálogo no permite para ese régimen: se guardan igual, solo es aviso.
 */
export async function updateInactiveRegimeActivities(
  rfc: string,
  taxPayerTaxRegimeId: number,
  activityIds: number[],
): Promise<Result<{ notAllowedByRegime: number[] }, TaxpayersError>> {
  try {
    const data = await fetchPut<{ success: boolean; notAllowedByRegime: number[] }>(
      API_ROUTES.TAXPAYERS.REGIME_ACTIVITIES_INACTIVE_UPDATE(rfc, taxPayerTaxRegimeId),
      activityIds,
      "taxpayers",
    );
    return ok({ notAllowedByRegime: data?.notAllowedByRegime ?? [] });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[updateInactiveRegimeActivities] Error:", e);
    return err({ statusCode: 500, message: "No pudimos guardar las actividades." });
  }
}

/**
 * Bandeja global de contribuyentes con actividades pendientes de asignar
 * (GET /Taxpayers/regime-activities/pending). Requiere Operaciones.ReadActividadesPendientes.
 */
export async function getPendingActivityAssignments(params: {
  rfc?: string;
  kind?: PendingActivityKind;
  skip?: number;
  take?: number;
}): Promise<Result<{ total: number; items: PendingActivityAssignment[] }, TaxpayersError>> {
  try {
    const data = await fetchGet<{ success: boolean; total: number; items: PendingActivityAssignment[] }>(
      API_ROUTES.TAXPAYERS.REGIME_ACTIVITIES_PENDING(params),
      "taxpayers",
    );
    return ok({ total: data?.total ?? 0, items: data?.items ?? [] });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPendingActivityAssignments] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los pendientes." });
  }
}
