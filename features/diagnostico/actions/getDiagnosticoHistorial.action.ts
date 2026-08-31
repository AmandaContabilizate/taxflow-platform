"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiagnosticoError, DiagnosticoHistorial } from "../types";

/**
 * Historial de corridas del diagnóstico de un contribuyente (quién lo disparó,
 * cuándo y cómo terminó) — tab Diagnóstico del expediente. Últimas 20.
 */
export async function getDiagnosticoHistorial(
  taxpayerId: number,
): Promise<Result<DiagnosticoHistorial, DiagnosticoError>> {
  try {
    const data = await fetchGet<DiagnosticoHistorial>(
      API_ROUTES.DIAGNOSTICO.HISTORIAL_VENDEDOR(taxpayerId),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el historial del diagnóstico." });
  }
}
