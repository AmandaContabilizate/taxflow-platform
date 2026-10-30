"use server";

import { ApiError, fetchGetPublic } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { type AdditionalProceduresCatalog, toAdditionalProceduresCatalog } from "../types";

interface CatalogError {
  statusCode: number;
  message: string;
}

export async function getAdditionalProcedures(): Promise<
  Result<AdditionalProceduresCatalog, CatalogError>
> {
  try {
    const data = await fetchGetPublic<unknown>(
      API_ROUTES.CATALOGS.ADDITIONAL_PROCEDURES,
      "catalogs_procedures",
    );
    return ok(toAdditionalProceduresCatalog(data));
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getAdditionalProcedures] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener los trámites adicionales." });
  }
}
