/**
 * Aprovisionamiento de servicios adicionales (backoffice GESTIÓN → "Aprovisionamiento").
 * Backend: Procedures api/aprovisionamiento (claim Backoffice.AprovisionamientoServicios).
 */

export interface AprovisionamientoError {
  statusCode: number;
  message: string;
}

/** ProvisioningAction. */
export const JOB_ACTIONS: Record<number, string> = {
  1: "Alta",
  2: "Baja",
  3: "Verificar",
  4: "Renovar",
};

/** ProvisioningJobStatus. */
export const JOB_STATUSES: Record<number, { label: string; kind: "default" | "brand" | "amber" | "coral" | "sky" | "danger" }> = {
  1: { label: "Pendiente", kind: "sky" },
  2: { label: "En curso", kind: "sky" },
  3: { label: "Hecho", kind: "brand" },
  4: { label: "Fallido", kind: "danger" },
  5: { label: "Agotado", kind: "danger" },
  6: { label: "Por hacer (manual)", kind: "amber" },
};

/** ServiceSubscriptionStatus. */
export const SUBSCRIPTION_STATUSES: Record<number, string> = {
  1: "Pendiente de alta",
  2: "Activo",
  3: "Alta fallida",
  4: "Cancelado",
  5: "Terminado",
  6: "Suspendido",
};

export interface ProvisioningJob {
  id: number;
  subscriptionId: number;
  providerKey: string;
  action: number;
  status: number;
  attempts: number;
  nextAttemptAt: string;
  lastError: string | null;
  payload: string | null;
  createdAt: string;
  completedAt: string | null;
  completedByUserId: string | null;
  subscriptionStatus: number;
  externalRef: string | null;
  planName: string;
  priceMxn: number;
  /** 1 Cliente · 2 Empresa. */
  payerType: number;
  payerName: string | null;
  userId: string;
  userEmail: string | null;
  userName: string | null;
  rfc: string | null;
  legalName: string | null;
}

export interface ProvisioningQueue {
  counts: Record<string, number>;
  items: ProvisioningJob[];
  /** manual | api por proveedor. */
  providerModes: Record<string, string>;
}

export interface ProviderCallLog {
  id: number;
  providerKey: string;
  subscriptionId: number | null;
  action: string;
  httpStatus: number | null;
  durationMs: number;
  success: boolean;
  error: string | null;
  at: string;
}

export interface ProvisioningCycleResult {
  taken: number;
  done: number;
  manual: number;
  failed: number;
  exhausted: number;
  details: string[];
}
