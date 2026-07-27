"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationGeneral } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

// Datos generales de una declaración. Solo contadores.
export async function getDeclarationGeneral(
  declarationId: number,
): Promise<Result<DeclarationGeneral, OpsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }

  try {
    const data = await fetchGet<DeclarationGeneral>(
      API_ROUTES.DECLARATIONS_OPS.GENERAL(declarationId),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationGeneral] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los datos de la declaración." });
  }
}
