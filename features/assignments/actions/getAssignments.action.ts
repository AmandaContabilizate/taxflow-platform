"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AssignmentRequest, AssignmentsError, UnassignedOperation } from "../types";

interface UnassignedResponse {
  success: boolean;
  operations: UnassignedOperation[];
}

interface RequestsResponse {
  success: boolean;
  requests: AssignmentRequest[];
}

/** Clientes/operaciones sin vendedor asignado (GET /assignments/unassigned). */
export async function getUnassignedOperations(): Promise<Result<UnassignedOperation[], AssignmentsError>> {
  try {
    const data = await fetchGet<UnassignedResponse>(API_ROUTES.ASSIGNMENTS.UNASSIGNED, "assignments");
    return ok(data?.operations ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getUnassignedOperations] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las operaciones sin asignar." });
  }
}

/** Solicitudes de asignación del gerente (GET /assignments/requests). */
export async function getAssignmentRequests(): Promise<Result<AssignmentRequest[], AssignmentsError>> {
  try {
    const data = await fetchGet<RequestsResponse>(API_ROUTES.ASSIGNMENTS.REQUESTS, "assignments");
    return ok(data?.requests ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getAssignmentRequests] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener las solicitudes." });
  }
}
