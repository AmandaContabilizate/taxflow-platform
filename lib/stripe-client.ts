import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Carga única de Stripe.js en el cliente (web). Usa la publishable key pública.
 * Para el Payment Element embebido (equivalente web del PaymentSheet móvil).
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("[stripe-client] Falta NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export const STRIPE_MERCHANT_NAME = "Contabilízate";
