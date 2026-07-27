/**
 * Contratos del Centro de Operaciones (microservicio Reports).
 * - Declaraciones pagadas pendientes (`/declarations/paid-pending`).
 * - Trámites adicionales vendidos (`/sales/procedures`).
 * - Resumen de ventas (`/sales/summary`).
 */

/** Cálculos fiscales de una declaración (IVA/ISR ya parseados). */
export interface DeclarationCalculations {
  declarationId: number;
  iva: Record<string, unknown> | null;
  isr: Record<string, unknown> | null;
}

/** Montos del backend: number o string decimal ("438.49"). */
export type Money = number | string | null;

/** Datos generales de una declaración (DeclaracionGeneralDto). */
export interface DeclarationGeneral {
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string | null;
  phone: string | null;
  fiscalYear: number;
  periodValueId: number;
  periodo: string;
  periodicityId: number;
  periodicity: string;
  taxRegimeId: number;
  regimeSatCode: string | null;
  regimeName: string | null;
  statusId: number;
  statusCode: string;
  statusDescription: string;
  accumulatedIncome: Money;
  personalDeductions: Money;
  taxableBase: Money;
  lowerLimit: Money;
  surplus: Money;
  rate: Money;
  result: Money;
  fixedQuota: Money;
  annualTax: Money;
  employmentSubsidy: Money;
  withheldTax: Money;
  favorableTax: Money;
  totalDeclaration: Money;
  createdAt: string | null;
  updatedAt: string | null;
  submittedAt: string | null;
  assignedAt: string | null;
  acknowledgmentPdfUrl: string | null;
  paymentLinePdfUrl: string | null;
  paymentAcknowledgmentPdfUrl: string | null;
  accountantUserId: string | null;
  accountantName: string | null;
}

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

/**
 * Item de `/declarations/paid-pending` (mismo DTO para kind 1 y 2).
 *
 * Teléfono/correo/nombre salen del usuario dueño de la cuenta (Taxpayer.User).
 * El contador es el snapshot histórico fijado al activarse el pago (Stripe).
 */
export interface PaidPendingDeclaration {
  declarationId: number;
  taxpayerId: number;
  rfc: string;
  legalName: string;
  email: string;
  phone: string | null;
  fiscalYear: number;
  periodValueId: number | null;
  periodo: string;
  /** 1 = Mensual, 2 = Bimestral, 3 = Anual. */
  periodicityId: number | null;
  /** "Mensual" / "Bimestral" / "Anual". */
  periodicity: string | null;
  statusId: number;
  statusCode: string;
  declarationKind: number;
  saleItemId: number;
  saleId: number;
  saleDate: string;
  /** Fecha de activación (pago Stripe). */
  assignedAt: string;
  accountantUserId: string | null;
  accountantName: string | null;
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
