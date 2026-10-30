"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AssignmentsError, ReassignPayload, ReassignResult } from "../types";

/**
 * Reasigna un contribuyente a otro contador
 * (POST /accountant-assignments/reassign).
 * Errores backend: 400 INVALID_INPUT, 404 TAXPAYER_NOT_FOUND,
 * 404 NOT_AN_ACCOUNTANT, 400 REASSIGN_FAILED.
 */
export async function reassignAccountant(
  payload: ReassignPayload,
): Promise<Result<ReassignResult, AssignmentsError>> {
  try {
    const data = await fetchPost<ReassignResult>(
      API_ROUTES.ACCOUNTANT_ASSIGNMENTS.REASSIGN,
      payload,
      "accountant_assignments",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[reassignAccountant] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos reasignar el contribuyente.",
    });
  }
}
