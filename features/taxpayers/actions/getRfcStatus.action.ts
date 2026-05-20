"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface RfcStatus {
  rfc: string;
  status69B: string | null;
  legalName?: string | null;
  isInBlacklist?: boolean;
  [key: string]: unknown;
}

interface RfcStatusError {
  statusCode: number;
  message: string;
}

export async function getRfcStatus(
  rfc: string,
): Promise<Result<RfcStatus, RfcStatusError>> {
  try {
    const data = await fetchGet<RfcStatus>(
      API_ROUTES.TAXPAYERS.RFC_STATUS(rfc),
      "taxpayers",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getRfcStatus] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener el estatus del RFC.",
    });
  }
}
