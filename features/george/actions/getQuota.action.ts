"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface GeorgeQuotaResponse {
  id: string;
  userEmail: string;
  freeTicketsUsed: number;
  freeTicketsAvailable: number;
  paidTicketsBalance: number;
  totalTicketsPurchased: number;
  createdAt: string;
}

export interface GetQuotaError {
  statusCode: number;
  message: string;
}

export async function getQuota(): Promise<Result<GeorgeQuotaResponse, GetQuotaError>> {
  try {
    const data = await fetchGet<GeorgeQuotaResponse>(
      API_ROUTES.GEORGE.QUOTA,
      "george"
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getQuota] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener tu cuota de tickets.",
    });
  }
}
