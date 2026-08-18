"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { EquipoOperaciones } from "../types";

interface OperationsError {
  statusCode: number;
  message: string;
}

/**
 * Equipo de operaciones (gerencia de contabilidad): pool de contadores con su
 * cartera y carga del periodo. Requiere GerenciaContable.ReadEquipoOperaciones.
 */
export async function getEquipoOperaciones(
  year: number,
  month: number,
): Promise<Result<EquipoOperaciones, OperationsError>> {
  try {
    const data = await fetchGet<EquipoOperaciones>(
      API_ROUTES.DECLARATIONS_OPS.EQUIPO_OPERACIONES(year, month),
      "declarations_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message });
    console.error("[getEquipoOperaciones] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar el equipo de operaciones." });
  }
}
