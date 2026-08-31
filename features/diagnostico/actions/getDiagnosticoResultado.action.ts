"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiagnosticoError, DiagnosticoResultado } from "../types";

/**
 * Declaraciones pendientes (Por Revisar / No Presentada) que el diagnóstico
 * encontró para un contribuyente — vista del backoffice (tab Diagnóstico del
 * expediente). Mismo claim que el flujo vendedor.
 */
export async function getDiagnosticoResultado(
  taxpayerId: number,
): Promise<Result<DiagnosticoResultado, DiagnosticoError>> {
  try {
    const data = await fetchGet<DiagnosticoResultado>(
      API_ROUTES.DIAGNOSTICO.RESULTADO_VENDEDOR(taxpayerId),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el resultado del diagnóstico." });
  }
}
