/**
 * Contratos del Centro de Operaciones (microservicio Reports).
 * - Declaraciones pagadas pendientes (`/declarations/paid-pending`).
 * - Trámites adicionales vendidos (`/sales/procedures`).
 */

/** Tipo de declaración pendiente. 2 = plan a futuro, 1 = regularización. */
export const DECLARATION_KIND = {
  REGULARIZATION: 1,
  FUTURE_PLAN: 2,
} as const;

export type DeclarationKind =
  (typeof DECLARATION_KIND)[keyof typeof DECLARATION_KIND];

/** Item de `/declarations/paid-pending` (mismo DTO para kind 1 y 2). */
export interface PaidPendingDeclaration {
  declarationId: number;
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string;
  fiscalYear: number;
  periodValueId: number;
  periodo: string;
  statusId: number;
  statusCode: string;
  declarationKind: number;
  saleItemId: number;
  saleId: number;
  saleDate: string;
  assignedAt: string | null;
}

/** Item de `/sales/procedures` (trámites adicionales vendidos). */
export interface ProcedureSale {
  id: number;
  saleItemId: number;
  saleId: number;
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string;
  productId: number;
  productName: string;
  statusId: number;
  status: string;
  assignedToUserId: number | null;
  resultPdfUrl: string | null;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}
