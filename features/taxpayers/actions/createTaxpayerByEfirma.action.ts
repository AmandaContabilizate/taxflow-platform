"use server";

import { ApiError, fetchPostMultipart } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface CreateTaxpayerByEfirmaPayload {
  rfc: string;
  cerFile: File;
  keyFile: File;
  authSecret: string;
}

interface CreateTaxpayerByEfirmaResponse {
  taxpayerPublicId: string;
  rfc: string;
}

export interface CreateTaxpayerByEfirmaError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

export async function createTaxpayerByEfirma(
  payload: CreateTaxpayerByEfirmaPayload,
): Promise<Result<void, CreateTaxpayerByEfirmaError>> {
  try {
    const formData = new FormData();
    formData.append("rfc", payload.rfc);
    formData.append("identityCer", payload.cerFile);
    formData.append("signKey", payload.keyFile);
    formData.append("authSecret", payload.authSecret);

    await fetchPostMultipart<CreateTaxpayerByEfirmaResponse>(
      API_ROUTES.TAXPAYERS.CREATE_BY_EFIRMA,
      formData,
      "taxpayers",
    );
    return ok(undefined);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    }
    console.error("[createTaxpayerByEfirma] Error:", e);
    return err({ statusCode: 500, message: "No pudimos conectar con el SAT. Intenta de nuevo." });
  }
}
