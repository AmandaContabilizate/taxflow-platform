"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface UpdateCiecPayload {
  rfc: string;
  satPassword: string;
  saveOnInvalidCiec?: boolean;
}

interface UpdateCiecError {
  statusCode: number;
  message: string;
}

export async function updateCiec(
  payload: UpdateCiecPayload,
): Promise<Result<void, UpdateCiecError>> {
  try {
    await fetchPost(
      API_ROUTES.TAXPAYERS.UPDATECIEC,
      {
        rfc: payload.rfc,
        satPassword: payload.satPassword,
        saveOnInvalidCiec: payload.saveOnInvalidCiec ?? false,
      },
      "taxpayers",
    );
    return ok(undefined);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[updateCiec] Error:", e);
    return err({ statusCode: 500, message: "No pudimos conectar con el SAT. Intenta de nuevo." });
  }
}
