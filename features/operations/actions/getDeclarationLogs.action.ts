"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationLog } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

/**
 * Bitácora de cambios de estatus de una declaración (`Declarations.DeclarationLog`).
 * OJO: el backend devuelve un array plano, no `PagedResult` — no envolver.
 * Solo contadores (policy Contador.ReadDeclaracionLogs).
 */
export async function getDeclarationLogs(
  declarationId: number,
  skip = 0,
  take = 100,
): Promise<Result<DeclarationLog[], OpsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }

  try {
    const data = await fetchGet<DeclarationLog[]>(
      API_ROUTES.DECLARATIONS_OPS.LOGS(declarationId, skip, take),
      "declarations_reports",
    );
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationLogs] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener la bitácora de la declaración." });
  }
}
