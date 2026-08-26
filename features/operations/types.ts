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

/**
 * Item de `GET /declarations` (DeclaracionListItemDto). Desde 2026-07 viene
 * envuelto en `Paged<T>`; antes era un array pelón.
 */
export interface DeclarationListItem {
  id: number;
  taxpayerId: number;
  rfc: string;
  fiscalYear: number;
  /** Catalogs.Period: 101-112 mensual, 201-206 bimestral, 501 anual. */
  periodValueId: number;
  statusId: number;
  statusCode: string;
  totalDeclaration: Money;
  assignedAt: string | null;
  submittedAt: string | null;
  consumoStatusId: number | null;
}

/**
 * Renglón de `WithholdsDetails` dentro de un CFDI de retenciones.
 */
export interface RetencionDetalle {
  /** c_Impuesto del SAT: "001", "002", "003". */
  retentionTaxCode: string | null;
  /** Ya resuelto por el backend: 001 ISR, 002 IVA, 003 IEPS. */
  impuesto: string | null;
  retentionBaseAmount: Money;
  retentionAmount: Money;
  retentionPaymentType: string | null;
}

/**
 * Bloque `Invoices.Withholds` de un CFDI de retenciones. El periodo que declara
 * el propio comprobante puede NO coincidir con el de la declaración.
 */
export interface Retencion {
  year: number;
  beginMonth: number;
  endMonth: number;
  totalOperationAmount: Money;
  totalTaxableAmount: Money;
  totalExemptAmount: Money;
  totalWithheldAmount: Money;
  detalle: RetencionDetalle[];
}

/**
 * Item de `GET /declarations/{id}/invoices` (DeclaracionFacturaDto): factura del
 * periodo + su clasificación (LEFT JOIN, por eso `clasificada`).
 */
export interface DeclarationInvoice {
  invoiceId: number;
  uuid: string;
  serie: string | null;
  folio: string | null;
  /** Fecha del CFDI. Para nómina NO es la que define el periodo. */
  invoiceDate: string;
  emitterRfc: string;
  emitterName: string;
  /** Ojo: en la tabla es ReceivedRfc, no Receiver. */
  receivedRfc: string;
  receiverName: string;
  /** true = emitida, false = recibida. */
  isIssued: boolean;
  subTotal: Money;
  total: Money;
  /** 1 I, 2 E, 3 T, 4 P, 5 N. */
  invoiceTypeId: number;
  tipoComprobante: string;
  esNomina: boolean;
  /** Solo si es nómina; es la fecha que define el periodo. */
  fechaPagoNomina: string | null;
  cfdiUsageId: number | null;
  wayOfPaymentId: number | null;
  paymentMethodId: number | null;
  /**
   * `DeclarationInvoice.IsValid`: la validez con la que la factura entró a esta
   * declaración. Es la que usó el cálculo.
   */
  isValid: boolean | null;
  /** Bandera explícita: no inferir por nulls. */
  clasificada: boolean;
  isDeducible: boolean | null;
  /**
   * true = gasto, false = ingreso. NO habla de deducibilidad: un ingreso
   * clasificado puede traer isGasto=false con isDeducible=true.
   */
  isGasto: boolean | null;
  clasificacion: string | null;
  actividad: string | null;
  /** Viene de `DeclarationInvoice.Note`, con fallback al motivo de uuid_clasificado. */
  motivo: string | null;
  /**
   * true si el CFDI tiene renglones en `Invoices.Withholds`. Los comprobantes de
   * retenciones no traen TipoDeComprobante, así que esta es la única marca.
   */
  esRetencion?: boolean;
  /** Suma de `TotalWithheldAmount`. null si no es retención. */
  totalRetenido?: Money;
  /** Vacío si no es retención (1-N: un CFDI puede traer varios bloques). */
  retenciones?: Retencion[];
}

/**
 * Mínimo que necesita `DeclarationDetail` para pintarse. `PaidPendingDeclaration`
 * lo cumple estructuralmente; el flujo por contribuyente lo arma a mano.
 */
export interface DeclarationSubject {
  declarationId: number;
  rfc: string;
  legalName: string;
  periodo: string;
  fiscalYear: number;
  accountantName: string | null;
}

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
  paymentIntentId: string | null;
  productos: ProductoVenta[];
  /** Estatus (Catalogs.StatusSale): 1 En proceso, 2 Pagado, 3 Cancelado. */
  statusSaleId: number;
  /** Nombre del estatus tal como está en el catálogo de la BD. */
  estatus: string | null;
  /** Código de promoción/descuento aplicado en la compra (null si no usó). */
  discountCode: string | null;
  /** % del código tipo Porcentaje (null en códigos tipo Declaraciones). */
  discountPercent: number | null;
  /** Teléfono de contacto del usuario titular de la cuenta. */
  userPhone?: string | null;
}

/** Declaración pendiente de la cartera (panel del contador). */
export interface DeclaracionPendiente {
  declarationId: number;
  rfc: string | null;
  legalName: string | null;
  fiscalYear: number;
  periodValueId: number;
  totalDeclaration: number | null;
  estatus: string;
  fechaLimite: string;
}

/** CIEC actualizada recientemente en la cartera. */
export interface CiecActualizada {
  rfc: string | null;
  legalName: string | null;
  fecha: string;
}

/** Respuesta de `/declarations/contador-dashboard`. */
export interface ContadorDashboard {
  carteraAsignada: number;
  porPresentar: number;
  vencenEstaSemana: number;
  /** Compradas aún sin trabajar (estatus 15 EnProceso). */
  enProceso: number;
  presentadas: number;
  ciecInvalidas: number;
  declaracionesPorPresentar: DeclaracionPendiente[];
  ciecActualizadas: CiecActualizada[];
}

/** Fila del desglose por contador (panel de gerencia contable). */
export interface ContadorDesglose {
  accountantUserId: string;
  nombre: string;
  email: string;
  cartera: number;
  porPresentar: number;
  presentadas: number;
  ciecBloqueadas: number;
  avancePorcentaje: number;
}

/** Respuesta de `/declarations/gerencia-contable-dashboard`. */
export interface GerenciaContableDashboard {
  carteraTotal: number;
  porPresentar: number;
  presentadas: number;
  ciecInvalidas: number;
  /** Compradas aún sin trabajar (estatus 15 EnProceso); subconjunto de porPresentar. */
  enProceso: number;
  desglose: ContadorDesglose[];
}

/** Colaborador del equipo de operaciones (contador) con su carga del periodo. */
export interface EquipoOperacionesMiembro {
  userId: string;
  nombre: string;
  email: string;
  cartera: number;
  porPresentar: number;
  vencidas: number;
  presentadas: number;
  ciecInvalidas: number;
  avancePorcentaje: number;
}

/** Respuesta de `/declarations/equipo-operaciones`. */
export interface EquipoOperaciones {
  poolContadores: number;
  contadoresConCartera: number;
  carteraTotal: number;
  porPresentarTotal: number;
  vencidasTotal: number;
  presentadasTotal: number;
  ciecInvalidasTotal: number;
  avanceArea: number;
  miembros: EquipoOperacionesMiembro[];
}

export type TipoRenovacion = "subscription" | "one_time";

/**
 * Item de `/sales/upcoming-renewals` (VentaPorVencerDto).
 * En `one_time` los campos de suscripción vienen null y `fechaEstimada` es true.
 */
export interface VentaPorVencer {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  taxpayerId: number;
  rfc: string;
  legalName: string;
  planId: number;
  planNombre: string;
  planDescripcion: string | null;
  billingPeriod: string;
  planPrecio: number;
  moneda: string;
  fechaVencimiento: string;
  diasParaVencer: number;
  /** true cuando la fecha se calculó en SQL y no vino de Stripe. */
  fechaEstimada: boolean;
  tipo: TipoRenovacion;
  saleId: number;
  saleDate: string;
  amount: number;
  checkoutId: string | null;
  paymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  estatusSuscripcion: string | null;
  /** false = el cliente ya canceló en Stripe: contacto urgente. */
  renovaraAutomaticamente: boolean | null;
  montoProximoCobro: number | null;
}

/** Respuesta de `/sales/detail/{saleId}` (VentaDetalleStripeDto). */
export interface VentaDetalleStripe {
  saleId: number;
  rfc: string;
  taxpayerId: number;
  saleDate: string;
  amount: number;
  userId: string;
  userFullName: string;
  userEmail: string;
  checkoutId: string | null;
  paymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}
