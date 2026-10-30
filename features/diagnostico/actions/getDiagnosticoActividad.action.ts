"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiagnosticoActividad, DiagnosticoError } from "../types";

/**
 * Actividad de los robots SAT del contribuyente (constancia / evaluación /
 * decl-*): qué se ejecutó y en qué paso va. Complementa el historial de
 * corridas — incluye el trabajo del onboarding, que el historial no registra.
 * Últimos 20 intentos, el más reciente primero.
 */
export async function getDiagnosticoActividad(
  taxpayerId: number,
): Promise<Result<DiagnosticoActividad, DiagnosticoError>> {
  try {
    const data = await fetchGet<DiagnosticoActividad>(
      API_ROUTES.DIAGNOSTICO.ACTIVIDAD_VENDEDOR(taxpayerId),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener la actividad de robots." });
  }
}
