"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { ClienteConstanciaEstado, DiagnosticoError } from "../types";

/**
 * Estado de la espera al SAT del propio cliente + actividad de sus robots
 * (verificación de CIEC / constancia / evaluación). La pantalla de bloqueo
 * "Estamos validando tu CIEC" lo sondea para pintar progreso, la cuenta
 * regresiva y el botón "Subir mi constancia" cuando toca.
 */
export async function getClienteConstanciaEstado(
  rfc: string,
): Promise<Result<ClienteConstanciaEstado, DiagnosticoError>> {
  try {
    const data = await fetchGet<ClienteConstanciaEstado>(
      API_ROUTES.DIAGNOSTICO.ACTIVIDAD_CLIENTE(rfc),
      "diagnostico",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, errorCode: e.errorCode });
    }
    console.error("[diagnostico] Error:", e);
    return err({ statusCode: 500, message: "No pudimos consultar el estado de tu conexión con el SAT." });
  }
}
