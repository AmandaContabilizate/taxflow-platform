"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { DeclarationCalculations } from "../types";

interface OpsError {
  statusCode: number;
  message: string;
}

// Cálculos fiscales (IVA/ISR) de una declaración. Solo contadores.
export async function getDeclarationCalculations(
  declarationId: number,
): Promise<Result<DeclarationCalculations, OpsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: "Declaración inválida." });
  }

  try {
    const data = await fetchGet<DeclarationCalculations>(
      API_ROUTES.DECLARATIONS_OPS.CALCULATIONS(declarationId),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationCalculations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los cálculos de la declaración." });
  }
}
