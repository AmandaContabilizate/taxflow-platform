"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type {
  AprovisionamientoError,
  ProviderCallLog,
  ProvisioningCycleResult,
  ProvisioningJob,
  ProvisioningQueue,
} from "../types";

const API = "aprovisionamiento" as const;

function toError(e: unknown, fallback: string): AprovisionamientoError {
  if (e instanceof ApiError) {
    const body = e.body as { title?: string; detail?: string } | null | undefined;
    const message = (typeof body === "object" && body && (body.detail || body.title)) || e.message || fallback;
    return { statusCode: e.status, message };
  }
  console.error("[aprovisionamiento] Error:", e);
  return { statusCode: 500, message: fallback };
}

export async function getProvisioningQueue(params: { status?: number; provider?: string; take?: number } = {}): Promise<Result<ProvisioningQueue, AprovisionamientoError>> {
  try {
    const data = await fetchGet<ProvisioningQueue>(API_ROUTES.APROVISIONAMIENTO.COLA(params), API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos cargar la cola de aprovisionamiento."));
  }
}

export async function getProviderCallLog(params: { subscriptionId?: number; provider?: string; take?: number } = {}): Promise<Result<ProviderCallLog[], AprovisionamientoError>> {
  try {
    const data = await fetchGet<ProviderCallLog[]>(API_ROUTES.APROVISIONAMIENTO.BITACORA(params), API);
    return ok(Array.isArray(data) ? data : []);
  } catch (e) {
    return err(toError(e, "No pudimos cargar la bitácora."));
  }
}

/** Soporte hizo la tarea en el portal del proveedor. */
export async function completeProvisioningJob(jobId: number, externalRef: string | null): Promise<Result<ProvisioningJob, AprovisionamientoError>> {
  try {
    const data = await fetchPost<ProvisioningJob>(API_ROUTES.APROVISIONAMIENTO.HECHO(jobId), { externalRef }, API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos marcar la tarea como hecha."));
  }
}

export async function retryProvisioningJob(jobId: number): Promise<Result<ProvisioningJob, AprovisionamientoError>> {
  try {
    const data = await fetchPost<ProvisioningJob>(API_ROUTES.APROVISIONAMIENTO.REINTENTAR(jobId), {}, API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos reencolar la tarea."));
  }
}

export async function runProvisioningJobNow(jobId: number): Promise<Result<ProvisioningJob, AprovisionamientoError>> {
  try {
    const data = await fetchPost<ProvisioningJob>(API_ROUTES.APROVISIONAMIENTO.PROCESAR(jobId), {}, API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos procesar la tarea."));
  }
}

export async function runProvisioningCycle(): Promise<Result<ProvisioningCycleResult, AprovisionamientoError>> {
  try {
    const data = await fetchPost<ProvisioningCycleResult>(API_ROUTES.APROVISIONAMIENTO.CICLO, {}, API);
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos correr el ciclo."));
  }
}
