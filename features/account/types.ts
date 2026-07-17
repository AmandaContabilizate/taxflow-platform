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
 * Catálogo de venta tal como lo expone ahora el endpoint de planes.
 * Antes era un `Plan[]` plano; ahora viene seccionado en tres listas.
 * - `futurePlans`        → planes/suscripciones seleccionables.
 * - `additionalProcedures` → trámites add-on (se agregan por cantidad).
 * - `regularizations`    → declaraciones pendientes a regularizar (cada una
 *   trae su `plan` de regularización; se eligen y se agrupan por producto).
 */
export interface PlansCatalog {
  futurePlans: Plan[];
  additionalProcedures: Plan[];
  regularizations: RegularizationPlan[];
}

/** Catálogo vacío — útil como estado inicial y fallback. */
export const EMPTY_PLANS_CATALOG: PlansCatalog = {
  futurePlans: [],
  additionalProcedures: [],
  regularizations: [],
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
    };
  }

  const obj = (data ?? {}) as Record<string, unknown>;
  // Regularizaciones: solo las que traen un plan vendible y activo.
  const regularizations = Array.isArray(obj.regularizations)
    ? (obj.regularizations as RegularizationPlan[]).filter((r) => r?.plan?.isActive)
    : [];
  return {
    futurePlans: onlyActive(obj.futurePlans),
    additionalProcedures: onlyActive(obj.additionalProcedures),
    regularizations,
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
  error?: string;
}

export interface RegisterSaleNewRequest {
  checkoutId: string | null; // paymentIntentId (pi_...) obtenido de payment-sheet
  rfc: string;
  discountCode: string | null;
  items: RegisterSaleItem[];
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
}

/**
 * Plan activo del RFC (GET /api/stripe/active-plan?rfc=...). Cubre tanto
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
  nextChargeAmount: number | null;
  paymentIntentId: string | null;
  paidAmount: number | null;
  paidAt: string | null;
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

export function priceIdForMode(plan: Plan, mode: PaymentMode): string | null {
  return mode === 0 ? plan.stripeSubscriptionPriceId : plan.stripeOneTimePriceId;
}
