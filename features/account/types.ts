/**
 * Contratos del flujo de venta / planes (ContaboxPro core2 · Procedures).
 * Ver spec de integración de Stripe.
 */

export type PaymentMode = 0 | 1; // 0 = suscripción (recurrente), 1 = pago único

export type BillingPeriod = "month" | "semester" | "year" | "once" | string;

export interface Plan {
  id: number;
  key: string;
  name: string;
  price: number;
  currency: string; // p.ej. "MXN"
  billingPeriod: BillingPeriod;
  stripeSubscriptionPriceId: string | null; // price recurrente (paymentMode 0)
  stripeOneTimePriceId: string | null; // price pago único (paymentMode 1)
  productType: number; // 0 = Plan, 1 = Trámite / Add-on
  grantsFreeAddOns: boolean; // si true, los add-ons van gratis con el plan
  canBeGrantedFree: boolean; // inverso: este trámite puede volverse gratis si el carrito lo otorga
  /**
   * true = admite cantidad (contador); false/undefined = instancia única (checkbox).
   * undefined es el estado transitorio mientras la columna no está desplegada en back;
   * se trata como instancia única por ser el default seguro acordado en el contrato.
   */
  allowsQuantity?: boolean;
  shortDescription: string | null;
  featuresJson: string | null;
  features: string[] | null;
  isActive: boolean;
  /**
   * Solo presente en items de `regularizations`: id de la declaración que se
   * regulariza. Se reenvía al backend como `regularizationDeclarationIds`.
   */
  declarationId?: number | null;
}

/**
 * Declaración pendiente de pago + el plan de regularización que le corresponde.
 * Espejo de `RegularizationPlanDto` del backend. El producto vendible es `plan`
 * (puede venir null si no existe un plan para el régimen de la declaración).
 */
export interface RegularizationPlan {
  declarationId: number;
  year: number;
  month: string | null;
  taxRegimeId: number | null;
  taxRegimeName: string | null;
  satCode: string | null;
  plan: Plan | null;
}

/**
 * Declaración ya presentada ante el SAT cuya línea de captura no se pagó. Se regulariza con una
 * declaración complementaria (producto 20); mismo contrato que `RegularizationPlan` más los datos
 * de la presentación previa.
 */
export interface ComplementRegularizationPlan extends RegularizationPlan {
  presentedDate: string | null;
  totalDeclaration: number | null;
  nextComplementNumber: number;
  operationNumber: string | null;
  lineaCaptura: string | null;
}

/**
 * Catálogo de venta tal como lo expone ahora el endpoint de planes.
 * Antes era un `Plan[]` plano; ahora viene seccionado en tres listas.
 * - `futurePlans`        → planes/suscripciones seleccionables.
 * - `additionalProcedures` → trámites add-on (se agregan por cantidad).
 * - `regularizations`    → declaraciones pendientes a regularizar (cada una
 *   trae su `plan` de regularización; se eligen y se agrupan por producto).
 * - `complementRegularizations` → presentadas sin pagar; se venden como complementaria
 *   con la misma mecánica que `regularizations`.
 */
export interface PlansCatalog {
  futurePlans: Plan[];
  additionalProcedures: Plan[];
  regularizations: RegularizationPlan[];
  complementRegularizations: ComplementRegularizationPlan[];
}

/** Catálogo vacío — útil como estado inicial y fallback. */
export const EMPTY_PLANS_CATALOG: PlansCatalog = {
  futurePlans: [],
  additionalProcedures: [],
  regularizations: [],
  complementRegularizations: [],
};

/** Normaliza la respuesta del endpoint a un `PlansCatalog` con activos. */
export function toPlansCatalog(data: unknown): PlansCatalog {
  const onlyActive = (arr: unknown): Plan[] =>
    Array.isArray(arr) ? (arr as Plan[]).filter((p) => p?.isActive) : [];

  // Compatibilidad: si llegara un arreglo plano (formato antiguo), lo
  // repartimos por `productType` como se hacía antes.
  if (Array.isArray(data)) {
    const plans = onlyActive(data);
    return {
      futurePlans: plans.filter((p) => p.productType === 0),
      additionalProcedures: plans.filter((p) => p.productType === 1),
      regularizations: [],
      complementRegularizations: [],
    };
  }

  const obj = (data ?? {}) as Record<string, unknown>;
  // Regularizaciones (normales y por complementaria): solo las que traen un plan vendible y activo.
  const withActivePlan = <T extends RegularizationPlan>(arr: unknown): T[] =>
    Array.isArray(arr) ? (arr as T[]).filter((r) => r?.plan?.isActive) : [];
  return {
    futurePlans: onlyActive(obj.futurePlans),
    additionalProcedures: onlyActive(obj.additionalProcedures),
    regularizations: withActivePlan<RegularizationPlan>(obj.regularizations),
    complementRegularizations: withActivePlan<ComplementRegularizationPlan>(obj.complementRegularizations),
  };
}

/**
 * Catálogo de trámites adicionales (GET /api/catalogs/{db}/additional-procedures).
 * `satProcedures` → trámites con el SAT · `extraDeclarations` → declaraciones extra.
 */
export interface AdditionalProceduresCatalog {
  satProcedures: Plan[];
  extraDeclarations: Plan[];
}

export const EMPTY_ADDITIONAL_PROCEDURES: AdditionalProceduresCatalog = {
  satProcedures: [],
  extraDeclarations: [],
};

export function toAdditionalProceduresCatalog(data: unknown): AdditionalProceduresCatalog {
  const onlyActive = (arr: unknown): Plan[] =>
    Array.isArray(arr) ? (arr as Plan[]).filter((p) => p?.isActive) : [];
  const obj = (data ?? {}) as Record<string, unknown>;
  return {
    satProcedures: onlyActive(obj.satProcedures),
    extraDeclarations: onlyActive(obj.extraDeclarations),
  };
}

/** Pago a Contabilízate (GET /api/sales/payments). */
export interface SalePayment {
  saleId: number;
  rfc: string;
  amount: number;
  currency: string;
  saleDate: string;
  planName: string | null;
  type: "subscription" | "one_time" | string;
  paymentIntentId: string | null;
  checkoutId: string | null;
  stripeSubscriptionId: string | null;
  /** "paid" = cobrada · "open" = pendiente (SPEI/OXXO), accionable en el listado. */
  status: "paid" | "open" | string;
}

export interface SalePaymentsPage {
  page: number;
  pageSize: number;
  total: number;
  items: SalePayment[];
}

/** Instrucciones de pago de una venta pendiente (GET /api/sales/payments/{saleId}/payment-instructions). */
export interface SpeiPaymentInstructions {
  clabe: string | null;
  bankName: string | null;
  bankCode: string | null;
  accountHolderName: string | null;
  reference: string | null;
  hostedInstructionsUrl: string | null;
}

export interface OxxoPaymentInstructions {
  number: string | null;
  hostedVoucherUrl: string | null;
  expiresAfter: string | null;
}

export interface SalePaymentInstructions {
  saleId: number;
  paymentIntentId: string;
  paymentIntentStatus: string | null;
  /** Define qué bloque de instrucciones pintar. */
  paymentMethod: "spei" | "oxxo" | "card" | "unknown" | string;
  amount: number;
  currency: string | null;
  spei: SpeiPaymentInstructions | null;
  oxxo: OxxoPaymentInstructions | null;
}

export interface RegisterSaleItem {
  subscriptionId: number; // = Plan.id (del plan o del add-on)
  quantity: number;
  paymentMode: PaymentMode;
  /**
   * Solo se manda en items que son planes de regularización. Lista de
   * `declarationId` (de `regularizations[]` en /plans) que cubre el item.
   * Si el item no es regularización, se omite y el request queda igual que antes.
   */
  regularizationDeclarationIds?: number[];
}

export interface PaymentSheetRequest {
  rfc: string;
  email: string;
  items: RegisterSaleItem[];
}

export interface PaymentSheetParams {
  paymentIntentClientSecret: string; // "pi_xxx_secret_yyy"
  ephemeralKey: string;
  customer: string; // "cus_..."
  subscriptionId: string | null; // "sub_..." en recurrente; null en pago único
  /** Créditos de referidos realmente descontados del cobro (pesos); puede ser menos que el saldo (mínimo de Stripe). */
  referralCreditsApplied?: number;
  /** Aviso en español cuando se aplicaron menos créditos de los que alcanzaban; null si no aplica. */
  referralCreditsNotice?: string | null;
  error?: string;
}

export interface RegisterSaleNewRequest {
  checkoutId: string | null; // paymentIntentId (pi_...) obtenido de payment-sheet
  rfc: string;
  discountCode: string | null;
  items: RegisterSaleItem[];
  /** Descontar los créditos de referidos del usuario (después del cupón, hasta el total). */
  useReferralCredits?: boolean;
}

export interface RegisterSaleNewResponse {
  success: boolean;
  discountApplied: boolean;
  discountMessage: string | null;
  /** Créditos de referidos descontados en la venta (pesos). */
  referralCreditsApplied?: number;
  /** Aviso cuando se aplicaron menos créditos por el cobro mínimo de Stripe ($10 MXN). */
  referralCreditsNotice?: string | null;
  /** 1 Abierta (pendiente de cobro) · 2 Pagada (total $0: nace pagada y activada). */
  statusSaleId?: number;
  amount?: number;
  /** Solo en suscripción cubierta al 100 % con créditos: para guardar la tarjeta de las renovaciones. */
  stripeSubscriptionId?: string | null;
  setupIntentClientSecret?: string | null;
  stripeCustomerId?: string | null;
  stripeEphemeralKey?: string | null;
}

/**
 * Preview de un código de descuento (GET /Finances/discount-code).
 * El backend valida activo + whitelist de RFCs + usos disponibles; 404 = inválido.
 * DiscountTypeId: 1 = Porcentaje (descuenta el total), 2 = Declaraciones
 * (precio completo + regularizaciones de regalo, solo en compra de planes).
 */
export interface DiscountCodePreview {
  id: number;
  code: string;
  description: string | null;
  discountPercent: number;
  discountTypeId: number;
  declarationsCount: number | null;
  subscriptionPlanIds: number[];
}

export interface PromotionCodeValidateRequest {
  discountCode: string;
  priceId: string;
}

export interface PromotionCodeValidateResponse {
  valid: boolean;
  promotionCodeId?: string;
  discountType?: "percent" | "amount";
  discountValue?: number;
  description?: string | null;
  message?: string;
}

export interface CurrentSubscription {
  hasSubscription: boolean;
  planName?: string;
  billingPeriod?: string;
  nextChargeAmount?: number | null;
  currency?: string;
  renewDate?: string;
  status?: string;
  subscriptionId?: string;
}

export interface CancelSubscriptionResponse {
  success: boolean;
  canceledAt?: string;
  /** La suscripción ya venía cancelada; el back responde 200 igual. */
  alreadyCanceled?: boolean;
}

/**
 * Sub-objeto `plan` de GET /api/stripe/active-plan?rfc=... Cubre tanto
 * suscripción (`type: "subscription"`) como pago único (`type: "one_time"`).
 * Si `hasPlan` es false el resto de campos vienen en null.
 */
export interface ActivePlan {
  hasPlan: boolean;
  type: "one_time" | "subscription" | string | null;
  saleId: number | null;
  planId: number | null;
  planKey: string | null;
  planName: string | null;
  price: number | null;
  currency: string | null;
  billingPeriod: BillingPeriod | null;
  features: string[] | null;
  featuresJson: string | null;
  status: string | null;
  subscriptionId: string | null;
  renewDate: string | null;
  /** Ya se canceló: Stripe la deja activa hasta `cancelAt`, por eso no basta con `status`. */
  cancelAtPeriodEnd: boolean;
  /** Fecha en que termina el acceso cuando `cancelAtPeriodEnd` (yyyy-MM-dd). */
  cancelAt: string | null;
  nextChargeAmount: number | null;
  paymentIntentId: string | null;
  paidAmount: number | null;
  paidAt: string | null;
}

/** Partida de una compra: el plan/producto contratado y lo que otorga. */
export interface AccountPurchaseItem {
  saleItemId: number;
  planId: number | null;
  planKey: string | null;
  planName: string | null;
  productType: number;
  quantity: number;
  unitAmount: number;
  amount: number;
  /** 0 = Suscripción, 1 = Pago único, según el price de Stripe registrado en la línea. */
  paymentMode?: number;
  regularizationDeclarations: number;
  futureDeclarations: number;
  taxRegimeId: number | null;
}

/** Una venta del RFC con su desglose de partidas. */
export interface AccountPurchase {
  saleId: number;
  saleDate: string;
  amount: number;
  statusId: number;
  status: string;
  type: "one_time" | "subscription" | string;
  checkoutId: string | null;
  paymentIntentId: string | null;
  stripeSubscriptionId: string | null;
  /** Créditos de referidos descontados en la venta (pesos); `amount` ya viene neto. */
  referralCreditsApplied?: number;
  /** Lo realmente cobrado (ya sin el 10 % de suscripción, con cupón % y créditos). Es el "Pagado" a mostrar. */
  paidAmount?: number;
  items: AccountPurchaseItem[];
}

/** Cuenta de un RFC: su plan vigente más el historial de compras. */
export interface PlanAccountBase {
  rfc: string;
  legalName: string | null;
  plan: ActivePlan;
  compras: AccountPurchase[];
}

/**
 * Respuesta completa de GET /api/stripe/active-plan?rfc=... El endpoint ya no
 * devuelve solo el plan: trae la cuenta del RFC consultado más los demás RFC
 * del mismo usuario en `otrosRfc`.
 */
export interface PlanAccount extends PlanAccountBase {
  otrosRfc: PlanAccountBase[];
}

/** Resuelve features desde el arreglo o parseando `featuresJson`. */
export function resolveFeatures(
  features: string[] | null | undefined,
  featuresJson: string | null | undefined,
): string[] {
  if (features && features.length > 0) return features;
  if (featuresJson) {
    try {
      const parsed = JSON.parse(featuresJson);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    } catch {
      // featuresJson mal formado: ignorar
    }
  }
  return [];
}

// =============================================================
// Helpers de presentación
// =============================================================

export const PERIOD_LABEL: Record<string, string> = {
  month: "Mensual",
  semester: "Semestral",
  year: "Anual",
  once: "Pago único",
};

export function periodLabel(period: string | undefined | null): string {
  if (!period) return "";
  return PERIOD_LABEL[period] ?? period;
}

/** Formato MXN sin Intl: 2821.5 → "$2,821.50" */
export function formatMXN(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const sign = n < 0 ? "-" : "";
  return `${sign}$${int.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${dec}`;
}

/** El paymentIntentId (pi_...) se obtiene cortando el client secret. */
export function paymentIntentIdFromSecret(clientSecret: string): string {
  return clientSecret.split("_secret")[0];
}

/** Resuelve las features de un plan, parseando `featuresJson` si hace falta. */
export function resolvePlanFeatures(plan: Plan): string[] {
  if (plan.features && plan.features.length > 0) return plan.features;
  if (plan.featuresJson) {
    try {
      const parsed = JSON.parse(plan.featuresJson);
      if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    } catch {
      // featuresJson mal formado: ignorar
    }
  }
  return [];
}

/** ¿El producto es seleccionable en el modo de pago elegido? */
export function isAvailableForMode(plan: Plan, mode: PaymentMode): boolean {
  return mode === 0 ? !!plan.stripeSubscriptionPriceId : !!plan.stripeOneTimePriceId;
}

/**
 * ¿Este trámite se vuelve gratis? Mismo criterio que el backend
 * (`FreeAddOnPolicy.IsFree`): el carrito debe otorgar el beneficio Y el
 * trámite debe estar marcado como elegible. No todos los trámites lo son.
 */
export function isFreeAddon(addon: Plan, cartGrantsFreeAddOns: boolean): boolean {
  return cartGrantsFreeAddOns && addon.canBeGrantedFree;
}

export function priceIdForMode(plan: Plan, mode: PaymentMode): string | null {
  return mode === 0 ? plan.stripeSubscriptionPriceId : plan.stripeOneTimePriceId;
}

/**
 * Descuento que Stripe ya trae aplicado en los `price` recurrentes
 * (`stripeSubscriptionPriceId`, paymentMode 0). El catálogo del backend expone
 * un solo `price` — el de lista / pago único —, así que la UI tiene que
 * descontarlo para no mostrar un total mayor al que termina cobrando Stripe.
 */
export const SUBSCRIPTION_DISCOUNT_PERCENT = 10;

/** Aplica el 10% de suscripción a un importe (redondeado a centavos). */
export function applySubscriptionDiscount(amount: number): number {
  return Math.round(amount * (1 - SUBSCRIPTION_DISCOUNT_PERCENT / 100) * 100) / 100;
}

/** Precio a mostrar/sumar según el modo de pago elegido. */
export function priceForMode(price: number, mode: PaymentMode): number {
  return mode === 0 ? applySubscriptionDiscount(price) : price;
}

/** Planes de las regularizaciones elegidas (uno por declaración), para sumar el total y armar `cartProductIds`. */
export function selectedRegularizationPlans(regs: RegularizationPlan[], selected: Set<number>): Plan[] {
  return regs.flatMap((r) => (r.plan && selected.has(r.declarationId) ? [r.plan] : []));
}

/**
 * Deja en la selección solo las declaraciones cuyo plan se vende en `mode`. Devuelve el mismo `Set`
 * si no cambió, para que el updater de estado no provoque un render extra.
 */
export function keepSelectableForMode(
  regs: RegularizationPlan[],
  selected: Set<number>,
  mode: PaymentMode,
): Set<number> {
  const next = new Set<number>();
  for (const r of regs) {
    if (r.plan && isAvailableForMode(r.plan, mode) && selected.has(r.declarationId)) next.add(r.declarationId);
  }
  return next.size === selected.size ? selected : next;
}

/** Un item de carrito por producto con las declaraciones que cubre (`regularizationDeclarationIds`). */
export function regularizationItems(
  regs: RegularizationPlan[],
  selected: Set<number>,
  paymentMode: PaymentMode,
): RegisterSaleItem[] {
  const groups = new Map<number, number[]>();
  for (const r of regs) {
    if (!r.plan || !selected.has(r.declarationId)) continue;
    const ids = groups.get(r.plan.id) ?? [];
    ids.push(r.declarationId);
    groups.set(r.plan.id, ids);
  }
  return [...groups].map(([subscriptionId, ids]) => ({
    subscriptionId,
    quantity: ids.length,
    paymentMode,
    regularizationDeclarationIds: ids,
  }));
}

/** Modo de pago implícito en el tipo de venta que devuelve el backend. */
export function modeOf(type: string): PaymentMode {
  return type === 'subscription' ? 0 : 1;
}

/** Etiqueta visible del tipo de venta. */
export function typeLabel(type: string): string {
  if (type === 'subscription') return 'Suscripción';
  if (type === 'one_time') return 'Pago único';
  return type;
}
