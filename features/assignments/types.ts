/**
 * Asignación de contador a contribuyente (microservicio Procedures).
 * - GET  /accountant-assignments/{taxpayerId}  → asignación actual + historial + pool.
 * - POST /accountant-assignments/reassign      → reasignar a otro contador.
 *
 * NOTA: los sub-shapes de la respuesta de GET (`current`, `history[]`, `pool[]`)
 * están INFERIDOS de la descripción del backend — ajustar si el backend difiere.
 * El shape de `reassign` (request/response) sí está confirmado.
 */

/** Contador activo por RFC (GET /accountant-assignments/by-rfc). */
export interface AccountantByRfc {
  rfc: string;
  accountantName: string;
}

/** Contador (base para current / history / pool). */
export interface AccountantRef {
  accountantUserId: string;
  accountantName: string;
  accountantEmail: string;
}

/** Entrada del historial de asignaciones. */
export interface AssignmentHistoryItem extends AccountantRef {
  assignedAt: string; // ISO
  unassignedAt: string | null;
}

/** Contador disponible con su carga actual (pool). */
export interface AccountantPoolItem extends AccountantRef {
  /** Cantidad de contribuyentes activos asignados a este contador. */
  activeClients: number;
}

/** Respuesta de GET /accountant-assignments/{taxpayerId}. */
export interface AccountantAssignment {
  taxpayerId: number;
  current: AccountantRef | null;
  history: AssignmentHistoryItem[];
  pool: AccountantPoolItem[];
}

/** Request de POST /accountant-assignments/reassign. */
export interface ReassignPayload {
  taxpayerId: number;
  accountantUserId: string;
}

/** Respuesta de POST /accountant-assignments/reassign. */
export interface ReassignResult {
  success: boolean;
  message: string;
}

/** Error uniforme de las acciones de asignación. */
export interface AssignmentsError {
  statusCode: number;
  message: string;
}

// =====================================================================
// Asignaciones de VENTA (módulo de comisiones, spec §6.4).
// - GET  /assignments/unassigned → operaciones sin vendedor.
// - POST /assignments/requests   → solicitud con aprobación de Administración.
// =====================================================================

export interface UnassignedOperation {
  operationId: number;
  rfc: string;
  clientName: string | null;
  clientEmail: string | null;
  saleDate: string;
  operationType: string;
  amountNet: number;
  products: string;
  pendingReview: boolean;
  hasPendingRequest: boolean;
}

/** Ids del catálogo Catalogs.AssignmentRequestStatus. */
export const REQUEST_STATUS = {
  Pending: 1,
  Approved: 2,
  Rejected: 3,
  /** Retirada por el gerente solicitante antes de la revisión. */
  Cancelled: 4,
} as const;

export interface AssignmentRequest {
  id: number;
  operationId: number;
  rfc: string;
  clientName: string | null;
  requestedByName: string;
  proposedExecutiveName: string;
  reason: string;
  evidenceUrl: string | null;
  statusId: number;
  status: string;
  reviewNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CreateAssignmentRequestInput {
  operationId: number;
  proposedExecutiveUserId: string;
  reason: string;
  evidenceUrl?: string;
}
