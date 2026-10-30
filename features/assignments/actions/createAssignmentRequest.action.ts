"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AssignmentsError, CreateAssignmentRequestInput } from "../types";

/**
 * Crea una solicitud de asignación de venta (POST /assignments/requests).
 * Queda Pendiente hasta que Administración la apruebe o rechace; NO cambia
 * al propietario de la operación.
 */
export async function createAssignmentRequest(
  input: CreateAssignmentRequestInput,
): Promise<Result<true, AssignmentsError>> {
  try {
    await fetchPost(
      API_ROUTES.ASSIGNMENTS.REQUESTS,
      {
        operationId: input.operationId,
        proposedExecutiveUserId: input.proposedExecutiveUserId,
        reason: input.reason,
        evidenceUrl: input.evidenceUrl?.trim() || null,
      },
      "assignments",
    );
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[createAssignmentRequest] Error:", e);
    return err({ statusCode: 500, message: "No pudimos enviar la solicitud." });
  }
}

/**
 * Retira una solicitud PENDIENTE (POST /assignments/requests/{id}/cancel).
 * Solo quien la creó puede retirarla; libera la operación para volver a solicitar.
 */
export async function cancelAssignmentRequest(
  requestId: number,
): Promise<Result<true, AssignmentsError>> {
  try {
    await fetchPost(API_ROUTES.ASSIGNMENTS.CANCEL(requestId), {}, "assignments");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[cancelAssignmentRequest] Error:", e);
    return err({ statusCode: 500, message: "No pudimos retirar la solicitud." });
  }
}

/**
 * Aprueba o rechaza una solicitud (solo Administración; policy Admin.ApproveAssignments).
 * Aprobar aplica el propietario en la operación + bitácora + IdVendor del comprador.
 */
export async function reviewAssignmentRequest(
  requestId: number,
  approve: boolean,
  reviewNotes?: string,
): Promise<Result<true, AssignmentsError>> {
  try {
    const route = approve
      ? API_ROUTES.ASSIGNMENTS.APPROVE(requestId)
      : API_ROUTES.ASSIGNMENTS.REJECT(requestId);
    await fetchPost(route, { reviewNotes: reviewNotes?.trim() || null }, "assignments");
    return ok(true);
  } catch (e) {
    if (e instanceof ApiError) {
      const detail =
        typeof e.body === "object" && e.body !== null && "detail" in e.body
          ? String((e.body as { detail?: string }).detail)
          : e.message;
      return err({ statusCode: e.status, message: detail });
    }
    console.error("[reviewAssignmentRequest] Error:", e);
    return err({ statusCode: 500, message: "No pudimos procesar la revisión." });
  }
}
