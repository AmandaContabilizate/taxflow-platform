"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface AvailableRfc {
  rfc: string;
  legalName: string;
  status69B: string | null;
  /** Estado de la CIEC: 1 = válida, 2 = inválida. Ausente si no se ha validado. */
  ciecState?: number;
}

interface AvailableRfcsResponse {
  success: boolean;
  rfcs: AvailableRfc[];
}

interface GetAvailableRfcsError {
  statusCode: number;
  message: string;
}

export async function getAvailableRfcs(): Promise<
  Result<AvailableRfc[], GetAvailableRfcsError>
> {
  try {
    const data = await fetchGet<AvailableRfcsResponse>(
      API_ROUTES.TAXPAYERS.AVAILABLE_RFCS,
      "taxpayers",
    );
    return ok(data?.rfcs ?? []);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getAvailableRfcs] Error:", e);
    return err({
      statusCode: 500,
      message: "No pudimos obtener los RFC disponibles.",
    });
  }
}
