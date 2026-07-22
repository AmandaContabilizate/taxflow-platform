"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AccountantByRfc, AssignmentsError } from "../types";

// Contador activo asignado a un RFC (GET /accountant-assignments/by-rfc).
export async function getAccountantByRfc(
  rfc: string,
): Promise<Result<AccountantByRfc, AssignmentsError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: "Falta el RFC." });
  }

  try {
    const data = await fetchGet<AccountantByRfc>(
      API_ROUTES.ACCOUNTANT_ASSIGNMENTS.BY_RFC(rfc),
      "accountant_assignments",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getAccountantByRfc] Error:", e);
    return err({ statusCode: 500, message: "No pudimos obtener tu contador asignado." });
  }
}
