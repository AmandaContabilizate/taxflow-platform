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

interface UpdateCiecApiResponse {
  success: boolean;
  message?: string;
  state?: string;
}

export interface UpdateCiecResult {
  /** CiecState resultante: 1 válida, 2 inválida, 0 el portal del SAT falló al validar. */
  ciecState: 0 | 1 | 2;
}

/**
 * El endpoint no manda un CiecState numérico consistente: Válida/Inválida solo traen
 * `message`, y Unverified es el único caso que trae `state`. Se infiere del `message`
 * porque es lo único que el back expone hoy (ver Bloqueo por estado de CIEC, SALIDA DEL FRONT).
 */
function resolveCiecState(data: UpdateCiecApiResponse | null | undefined): 0 | 1 | 2 {
  if (data?.state === "Unverified") return 0;
  if (data?.message === "Password can't be validated") return 2;
  return 1;
}

export async function updateCiec(
  payload: UpdateCiecPayload,
): Promise<Result<UpdateCiecResult, UpdateCiecError>> {
  try {
    const data = await fetchPost<UpdateCiecApiResponse>(
      API_ROUTES.TAXPAYERS.UPDATECIEC,
      {
        rfc: payload.rfc,
        satPassword: payload.satPassword,
        saveOnInvalidCiec: payload.saveOnInvalidCiec ?? false,
      },
      "taxpayers",
    );
    return ok({ ciecState: resolveCiecState(data) });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[updateCiec] Error:", e);
    return err({ statusCode: 500, message: "No pudimos conectar con el SAT. Intenta de nuevo." });
  }
}
