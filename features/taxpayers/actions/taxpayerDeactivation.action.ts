"use server";

import { ApiError, fetchGet, fetchPost } from "@/lib/api";
import { API_ROUTES } from "@/lib/api/apiRoutes";
import { type Result, err, ok } from "@/lib/common";
import type { AccountStatusId } from "../types";

/**
 * Baja de contribuyente / cuenta (derecho ARCO de cancelación). Identity:
 * - Staff (expediente, tab Credenciales): Soft con Contador.DeactivateTaxpayer; Hard además
 *   Admin.HardDeleteTaxpayer y solo sobre un Soft con antigüedad mínima.
 * - Cliente (Mi cuenta): siempre Soft, sobre sus propios contribuyentes.
 * Todas piden contraseña del que ejecuta + RFC escrito de nuevo + motivo.
 */

export interface DeactivationError {
  statusCode: number;
  message: string;
  errorCode?: string;
}

export interface DeactivationReason {
  id: number;
  code: string;
  description: string;
  requiresNote: boolean;
}

export interface PrepaidBalance {
  /** Declaraciones ligadas a un paquete pagado y aún no presentadas. */
  assignedNotPresented: number;
  /** Créditos de paquete pagado sin declaración ligada. */
  unassignedCredits: number;
}

export interface StaffDeactivationPreview {
  taxpayerId: number;
  rfc: string;
  currentStatus: AccountStatusId;
  deactivatedAt: string | null;
  /** Desde cuándo se permite Hard (null = ya se permite o no aplica). */
  hardAllowedFrom: string | null;
  hasDeclarationInFlight: boolean;
  prepaid: PrepaidBalance;
  canHardDelete: boolean;
  hardMinDaysAfterSoft: number;
}

export interface ClientDeactivationPreview {
  taxpayerId: number;
  rfc: string;
  hasDeclarationInFlight: boolean;
  prepaid: PrepaidBalance;
}

export interface DeactivationOutcome {
  taxpayerId: number;
  mode: number;
  userDeactivated: boolean;
  pendingBlobs: number;
  prepaid: PrepaidBalance;
  warnings: string[];
}

export interface DeactivationResult {
  taxpayers: DeactivationOutcome[];
  userDeactivated: boolean;
  warnings: string[];
}

function toError(e: unknown, fallback: string, tag: string): DeactivationError {
  if (e instanceof ApiError) return { statusCode: e.status, message: e.message, errorCode: e.errorCode };
  console.error(`[${tag}] Error:`, e);
  return { statusCode: 500, message: fallback };
}

export async function getDeactivationReasons(): Promise<Result<DeactivationReason[], DeactivationError>> {
  try {
    return ok(await fetchGet<DeactivationReason[]>(API_ROUTES.TAXPAYERS.DEACTIVATION_REASONS, "taxpayers"));
  } catch (e) {
    return err(toError(e, "No pudimos cargar los motivos de baja.", "getDeactivationReasons"));
  }
}

export async function getStaffDeactivationPreview(
  taxpayerId: number,
): Promise<Result<StaffDeactivationPreview, DeactivationError>> {
  try {
    return ok(await fetchGet<StaffDeactivationPreview>(API_ROUTES.TAXPAYERS.DEACTIVATION_PREVIEW(taxpayerId), "taxpayers"));
  } catch (e) {
    return err(toError(e, "No pudimos consultar el estado de baja.", "getStaffDeactivationPreview"));
  }
}

export interface StaffDeactivatePayload {
  taxpayerId: number;
  hard: boolean;
  confirmRfc: string;
  reasonId: number;
  reasonNote?: string;
  requestReference: string;
  password: string;
}

export async function deactivateTaxpayerAsStaff(
  payload: StaffDeactivatePayload,
): Promise<Result<DeactivationResult, DeactivationError>> {
  try {
    const data = await fetchPost<DeactivationResult>(
      API_ROUTES.TAXPAYERS.DEACTIVATE(payload.taxpayerId),
      {
        hard: payload.hard,
        confirmRfc: payload.confirmRfc,
        reasonId: payload.reasonId,
        reasonNote: payload.reasonNote ?? null,
        requestReference: payload.requestReference,
        password: payload.password,
      },
      "taxpayers",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos dar de baja al contribuyente.", "deactivateTaxpayerAsStaff"));
  }
}

export async function getMyTaxpayersDeactivationPreview(): Promise<Result<ClientDeactivationPreview[], DeactivationError>> {
  try {
    return ok(await fetchGet<ClientDeactivationPreview[]>(API_ROUTES.USERS.MY_TAXPAYERS_DEACTIVATION_PREVIEW, "users"));
  } catch (e) {
    return err(toError(e, "No pudimos cargar tus RFC.", "getMyTaxpayersDeactivationPreview"));
  }
}

export interface ClientDeactivatePayload {
  allTaxpayers: boolean;
  taxpayerIds: number[];
  confirmRfcs: string[];
  reasonId: number;
  reasonNote?: string;
  password: string;
}

export async function deactivateMyTaxpayers(
  payload: ClientDeactivatePayload,
): Promise<Result<DeactivationResult, DeactivationError>> {
  try {
    const data = await fetchPost<DeactivationResult>(
      API_ROUTES.USERS.MY_TAXPAYERS_DEACTIVATE,
      {
        allTaxpayers: payload.allTaxpayers,
        taxpayerIds: payload.taxpayerIds,
        confirmRfcs: payload.confirmRfcs,
        reasonId: payload.reasonId,
        reasonNote: payload.reasonNote ?? null,
        password: payload.password,
      },
      "users",
    );
    return ok(data);
  } catch (e) {
    return err(toError(e, "No pudimos procesar tu baja.", "deactivateMyTaxpayers"));
  }
}
