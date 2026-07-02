/**
 * Contratos del Centro de Operaciones (microservicio Reports).
 * - Declaraciones pagadas pendientes (`/declarations/paid-pending`).
 * - Trámites adicionales vendidos (`/sales/procedures`).
 * - Resumen de ventas (`/sales/summary`).
 */

/** Respuesta paginada del backend (skip/take/total). */
export interface Paged<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
}

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

/** Producto incluido en una venta (`SaleItem` + plan). */
export interface ProductoVenta {
  subscriptionId: number;
  nombre: string;
  descripcion: string;
  cantidad: number;
}

/** Item de `/sales/summary` (VentaResumenCuentaDto). */
export interface VentaResumen {
  saleId: number;
  saleDate: string;
  amount: number;
  rfc: string;
  taxpayerId: number;
  userId: string;
  userFullName: string;
  userEmail: string;
  productos: ProductoVenta[];
}
