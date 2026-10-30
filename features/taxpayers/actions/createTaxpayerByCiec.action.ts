"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface CreateTaxpayerByCiecPayload {
  rfc: string;
  ciec: string;
}

interface CreateTaxpayerByCiecResponse {
  taxpayerPublicId: string;
  rfc: string;
  ciecConfirmed: boolean;
}

export interface CreateTaxpayerByCiecError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

export async function createTaxpayerByCiec(
  payload: CreateTaxpayerByCiecPayload,
): Promise<Result<{ ciecConfirmed: boolean }, CreateTaxpayerByCiecError>> {
  try {
    const response = await fetchPost<CreateTaxpayerByCiecResponse>(
      API_ROUTES.TAXPAYERS.CREATE_BY_CIEC,
      { rfc: payload.rfc, ciec: payload.ciec },
      "taxpayers",
    );
    return ok({ ciecConfirmed: response.ciecConfirmed });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    }
    console.error("[createTaxpayerByCiec] Error:", e);
    return err({ statusCode: 500, message: "No pudimos conectar con el SAT. Intenta de nuevo." });
  }
}
