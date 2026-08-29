"use server";

import { ApiError, fetchGet } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import { getSatPassword } from "./getSatPassword.action";
import type { ExpedienteCliente, SatCredentials } from "../types";

interface TaxpayersError {
  statusCode: number;
  message: string;
}

/**
 * Expediente del cliente para la pantalla Clientes (gerencia comercial).
 * Requiere GerenciaComercial.ReadExpedienteCliente.
 */
export async function getExpedienteCliente(
  taxpayerId: number,
): Promise<Result<ExpedienteCliente, TaxpayersError>> {
  try {
    const data = await fetchGet<ExpedienteCliente>(
      API_ROUTES.TAXPAYERS_OPS.EXPEDIENTE(taxpayerId),
      "taxpayers_reports",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message });
    console.error("[getExpedienteCliente] Error:", e);
    return err({ statusCode: 500, message: "No pudimos cargar el expediente del cliente." });
  }
}

/**
 * Credenciales SAT del contribuyente (Identity, policy Contador.GetSatPassword):
 * contraseña CIEC + si tiene e.firma cargada. Se pide BAJO DEMANDA — nunca viaja
 * junto con el expediente ni se guarda en estado más tiempo del necesario.
 * Delega en `getSatPassword` para no duplicar la llamada al endpoint.
 */
export async function getSatCredentials(
  rfc: string,
): Promise<Result<SatCredentials, TaxpayersError>> {
  const res = await getSatPassword(rfc);
  if (!res.success) return err(res.error);
  return ok({ satPassword: res.value.satPassword, tieneEfirma: res.value.tieneEfirma });
}
