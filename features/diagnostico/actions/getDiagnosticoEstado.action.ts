"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DiagnosticoError, DiagnosticoEstadoCliente } from "../types";

/** ¿Terminó el diagnóstico del RFC del cliente autenticado? Candado de compra del portal. */
export async function getDiagnosticoEstadoCliente(
  rfc: string,
): Promise<Result<DiagnosticoEstadoCliente, DiagnosticoError>> {
  try {
    const data = await fetchGet<DiagnosticoEstadoCliente>(
      API_ROUTES.DIAGNOSTICO.ESTADO_CLIENTE(rfc),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos consultar el estado del diagnóstico." });
  }
}
