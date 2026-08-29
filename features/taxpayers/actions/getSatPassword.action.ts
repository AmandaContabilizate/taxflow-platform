"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { satPasswordSchema } from "../schemas/satPassword.schema";
import type { SatPassword } from "../types";

interface SatPasswordError {
  statusCode: number;
  message: string;
}

interface SatPasswordResponse {
  satPassword?: string | null;
  publicId?: string | null;
  rfc?: string | null;
  digitalIdentities?: { identityCertPath: string }[] | null;
}

/**
 * CIEC del contribuyente (Identity, apiType `taxpayers`, policy
 * `Contador.GetSatPassword`). Se pide SIEMPRE bajo demanda: la respuesta trae la
 * contraseña en claro, así que no se cachea, no se loguea y quien la consuma la
 * borra del estado en cuanto la oculta.
 */
export async function getSatPassword(
  rfc: string,
): Promise<Result<SatPassword, SatPasswordError>> {
  const parsed = satPasswordSchema.safeParse({ rfc });
  if (!parsed.success) {
    return err({ statusCode: 400, message: "RFC inválido." });
  }

  try {
    const data = await fetchGet<SatPasswordResponse>(
      API_ROUTES.TAXPAYERS.SAT_PASSWORD(parsed.data.rfc),
      "taxpayers",
    );
    return ok({
      satPassword: data?.satPassword ?? "",
      publicId: data?.publicId ?? "",
      rfc: data?.rfc ?? parsed.data.rfc,
      tieneEfirma: (data?.digitalIdentities?.length ?? 0) > 0,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message });
    }
    console.error("[getSatPassword] Error al consultar credenciales SAT.");
    return err({
      statusCode: 500,
      message: "No pudimos obtener las credenciales SAT.",
    });
  }
}
