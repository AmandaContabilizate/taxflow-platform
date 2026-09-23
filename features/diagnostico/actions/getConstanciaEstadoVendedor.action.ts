"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ClienteConstanciaEstado, DiagnosticoError } from "../types";

/**
 * Backoffice: estado de la espera al SAT y de la constancia de un contribuyente
 * (tab Diagnóstico del expediente). Misma regla que ve el cliente: dice si la
 * constancia vigente es del SAT o subida sin verificar y si ya toca ofrecer
 * "Subir constancia del cliente".
 */
export async function getConstanciaEstadoVendedor(
  taxpayerId: number,
): Promise<Result<ClienteConstanciaEstado, DiagnosticoError>> {
  try {
    const data = await fetchGet<ClienteConstanciaEstado>(
      API_ROUTES.DIAGNOSTICO.CONSTANCIA_ESTADO_VENDEDOR(taxpayerId),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos consultar el estado de la constancia." });
  }
}
