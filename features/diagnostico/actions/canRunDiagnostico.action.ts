"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { CanRunDiagnostico, DiagnosticoError } from "../types";

function toError(e: unknown, fallback: string): DiagnosticoError {
  if (e instanceof ApiError) {
    return { statusCode: e.status, message: e.message, errorCode: e.errorCode };
  }
  console.error("[diagnostico] Error:", e);
  return { statusCode: 500, message: fallback };
}

/**
 * ¿El RFC del cliente autenticado puede correr su diagnóstico ahora?
 * Solo lectura — llamar SIEMPRE antes de pintar el botón (el POST revalida igual).
 */
export async function canRunDiagnosticoCliente(
  rfc: string,
): Promise<Result<CanRunDiagnostico, DiagnosticoError>> {
  try {
    const data = await fetchGet<CanRunDiagnostico>(
      API_ROUTES.DIAGNOSTICO.CAN_RUN_CLIENTE(rfc),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos consultar el estado del diagnóstico."));
  }
}

/** ¿El vendedor puede correr el diagnóstico de este contribuyente ahora? (cooldown 6h) */
export async function canRunDiagnosticoVendedor(
  taxpayerId: number,
): Promise<Result<CanRunDiagnostico, DiagnosticoError>> {
  try {
    const data = await fetchGet<CanRunDiagnostico>(
      API_ROUTES.DIAGNOSTICO.CAN_RUN_VENDEDOR(taxpayerId),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos consultar el estado del diagnóstico."));
  }
}
