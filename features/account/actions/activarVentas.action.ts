"use server";

import { ApiError, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";

export interface VentaActivada {
  saleId: number;
  taxpayerId: number;
  rfc: string;
  planes: string[];
  regimenes: number;
}

/** Resultado de la activación tardía (spec-ventas-por-activar, paso 5). */
export interface ActivarVentasResult {
  revisadas: number;
  activadas: VentaActivada[];
  sinConstancia: number[];
  regimenNoCoincide: number[];
  errores: string[];
}

export interface AjustarPlanResult {
  saleId: number;
  planAnterior: string;
  precioAnterior: number;
  planNuevo: string;
  precioNuevo: number;
  /** precioNuevo − precioAnterior. Positivo: falta cobrar; negativo: sobra. */
  diferencia: number;
  regimenes: number;
  activada: boolean;
}

export interface VentasError {
  statusCode: number;
  errorCode?: string;
  message: string;
}

/**
 * Activa ahora las ventas pagadas sin declaraciones de un cliente que ya tiene constancia. Es lo
 * mismo que hace el cron cada 15 minutos; sirve para no esperar.
 */
export async function activarVentasPendientes(
  taxpayerId: number,
): Promise<Result<ActivarVentasResult, VentasError>> {
  try {
    const data = await fetchPost<ActivarVentasResult>(
      API_ROUTES.FINANCES.ACTIVATE_PENDING_SALES(taxpayerId),
      {},
      "finances",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    console.error("[activarVentasPendientes] Error:", e);
    return err({ statusCode: 500, message: "No se pudo activar la venta." });
  }
}

/**
 * Cambia el plan de una venta pagada cuyo plan no cubre el régimen de la constancia y la activa.
 * Lo cobrado no se toca: la diferencia de precio se informa para resolverla comercialmente.
 */
export async function ajustarPlan(
  saleId: number,
  subscriptionId: number,
): Promise<Result<AjustarPlanResult, VentasError>> {
  try {
    const data = await fetchPost<AjustarPlanResult>(
      API_ROUTES.FINANCES.ADJUST_SALE_PLAN(saleId),
      { subscriptionId },
      "finances",
    );
    return ok(data);
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, errorCode: e.errorCode, message: e.message });
    console.error("[ajustarPlan] Error:", e);
    return err({ statusCode: 500, message: "No se pudo ajustar el plan." });
  }
}
