"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AccountantAssignment, AssignmentsError } from "../types";

/**
 * Asignación de un contribuyente (GET /accountant-assignments/{taxpayerId}).
 * Devuelve el contador actual, el historial y el pool de contadores con su carga.
 */
export async function getAccountantAssignment(
  taxpayerId: number,
): Promise<Result<AccountantAssignment, AssignmentsError>> {
  try {
    const data = await fetchGet<AccountantAssignment>(
      API_ROUTES.ACCOUNTANT_ASSIGNMENTS.GET(taxpayerId),
      "accountant_assignments",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getAccountantAssignment] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener la asignación del contribuyente.",
    });
  }
}
