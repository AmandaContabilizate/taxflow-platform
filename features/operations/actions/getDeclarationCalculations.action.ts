"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { getBaseUrl } from "@/lib/api/apiUrls";
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

  const endpoint = API_ROUTES.DECLARATIONS_OPS.CALCULATIONS(declarationId);
  // fetchClient arma la URL igual: getBaseUrl(apiType) + endpoint.
  const url = `${getBaseUrl("declarations_reports")}${endpoint}`;
  console.log("[getDeclarationCalculations] GET", url);

  try {
    const data = await fetchGet<DeclarationCalculations>(
      endpoint,
      "declarations_reports",
    );
    console.log(
      "[getDeclarationCalculations] respuesta:",
      JSON.stringify(data),
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      console.error(
        `[getDeclarationCalculations] ${e.status} en ${url} ·`,
        JSON.stringify(e.body),
      );
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getDeclarationCalculations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los cálculos de la declaración." });
  }
}
