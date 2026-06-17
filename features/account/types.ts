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
}

export interface RegisterSaleItem {
  subscriptionId: number; // = Plan.id (del plan o del add-on)
  quantity: number;
  paymentMode: PaymentMode;
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
