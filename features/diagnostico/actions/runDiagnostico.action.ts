"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { diagnosticoErrorMessage, type DiagnosticoError, type RunDiagnosticoResult } from "../types";

function toError(e: unknown, fallback: string): DiagnosticoError {
  if (e instanceof ApiError) {
    return {
      statusCode: e.status,
      message: diagnosticoErrorMessage(e.errorCode, e.message || fallback),
      errorCode: e.errorCode,
    };
  }
  console.error("[diagnostico] Error:", e);
  return { statusCode: 500, message: fallback };
}

/**
 * Dispara el diagnóstico del RFC del cliente autenticado (máx 1 corrida por día
 * calendario, hora de México). triggered=false = ya estaba al corriente.
 */
export async function runDiagnosticoCliente(
  rfc: string,
): Promise<Result<RunDiagnosticoResult, DiagnosticoError>> {
  try {
    const data = await fetchPost<RunDiagnosticoResult>(
      API_ROUTES.DIAGNOSTICO.RUN_CLIENTE(rfc),
      undefined,
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos ejecutar el diagnóstico."));
  }
}

/** Dispara el diagnóstico de un contribuyente desde el backoffice (cooldown 6h). */
export async function runDiagnosticoVendedor(
  taxpayerId: number,
): Promise<Result<RunDiagnosticoResult, DiagnosticoError>> {
  try {
    const data = await fetchPost<RunDiagnosticoResult>(
      API_ROUTES.DIAGNOSTICO.RUN_VENDEDOR(taxpayerId),
      undefined,
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos ejecutar el diagnóstico."));
  }
}
