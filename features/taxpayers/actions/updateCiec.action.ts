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
  /** Estado resultante explicito: 0 sin verificar, 1 valida, 2 invalida. */
  ciecState?: number;
  message?: string;
  state?: string;
}

export interface UpdateCiecResult {
  /** CiecState resultante: 1 válida, 2 inválida, 0 el portal del SAT falló al validar. */
  ciecState: 0 | 1 | 2;
}

/**
 * El back manda `ciecState` numérico explícito (0 sin verificar, 1 válida, 2 inválida) —
 * `TaxpayersController.UpdateCIEC` lo agregó justamente para que el cliente no tenga que
 * adivinar el estado del texto. `message`/`state` siguen llegando por compatibilidad y solo
 * se leen como respaldo si la respuesta no trae el campo.
 */
function resolveCiecState(data: UpdateCiecApiResponse | null | undefined): 0 | 1 | 2 {
  if (data?.ciecState === 0 || data?.ciecState === 1 || data?.ciecState === 2) {
    return data.ciecState;
  }
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
