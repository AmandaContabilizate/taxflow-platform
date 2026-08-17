"use server";

import { ApiError, fetchGet, fetchPut } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { RegimeActivityMatrixItem } from "../types";

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
