"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

interface ValidateCiecPayload {
  rfc: string;
}

interface ValidateCiecError {
  statusCode: number;
  message: string;
}

interface ValidateCiecApiResponse {
  success?: boolean;
  isValid: boolean;
  ciecState: 0 | 1 | 2;
  rfc: string;
  message?: string;
  validatedAt?: string;
}

export interface ValidateCiecResult {
  isValid: boolean;
  ciecState: 0 | 1 | 2;
  message: string;
  rfc: string;
}

/**
 * Valida bajo demanda la contraseña CIEC almacenada de un contribuyente contra el SAT.
 * Utilizado por contadores y analistas desde el backoffice (expediente, tablas operativas).
 */
export async function validateTaxpayerCiec(
  payload: ValidateCiecPayload,
): Promise<Result<ValidateCiecResult, ValidateCiecError>> {
  const trimmedRfc = payload.rfc?.trim().toUpperCase();
  if (!trimmedRfc) {
    return err({ statusCode: 400, message: "RFC es requerido." });
  }

  try {
    const data = await fetchPost<ValidateCiecApiResponse>(
      API_ROUTES.TAXPAYERS.VALIDATE_CIEC,
      { rfc: trimmedRfc },
      "taxpayers",
    );

    return ok({
      isValid: data?.isValid ?? false,
      ciecState: data?.ciecState ?? (data?.isValid ? 1 : 2),
      message: data?.message ?? (data?.isValid ? "CIEC validada exitosamente" : "El SAT rechazó la contraseña CIEC"),
      rfc: trimmedRfc,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[validateTaxpayerCiec] Error:", e);
    return err({ statusCode: 500, message: "No pudimos conectar con el SAT para validar la CIEC. Intenta de nuevo." });
  }
}
