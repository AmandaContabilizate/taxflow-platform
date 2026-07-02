/**
 * Asignación de contador a contribuyente (microservicio Procedures).
 * - GET  /accountant-assignments/{taxpayerId}  → asignación actual + historial + pool.
 * - POST /accountant-assignments/reassign      → reasignar a otro contador.
 *
 * NOTA: los sub-shapes de la respuesta de GET (`current`, `history[]`, `pool[]`)
 * están INFERIDOS de la descripción del backend — ajustar si el backend difiere.
 * El shape de `reassign` (request/response) sí está confirmado.
 */

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
