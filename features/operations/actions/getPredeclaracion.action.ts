"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationGeneral } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

/**
 * Reporte de predeclaración de una declaración para perfiles comerciales
 * (SAC / Renovaciones). Solo lectura — bajo el claim Comercial.ReadPredeclaracion.
 * Misma respuesta que getDeclarationGeneral (reusa el DTO del contador).
 */
export async function getPredeclaracion(
  declarationId: number,
): Promise<Result<DeclarationGeneral, OpsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }

  try {
    const data = await fetchGet<DeclarationGeneral>(
      API_ROUTES.DECLARATIONS_OPS.PREDECLARACION(declarationId),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getPredeclaracion] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener el reporte de predeclaración." });
  }
}
