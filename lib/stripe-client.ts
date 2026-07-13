import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * Carga única de Stripe.js en el cliente (web). Para el Payment Element
 * embebido (equivalente web del PaymentSheet móvil).
 *
 * La publishable key se recibe como parámetro (resuelta server-side vía
 * `getStripePublishableKey` server action) en lugar de leerse aquí de
 * `process.env.NEXT_PUBLIC_*` — así el mismo build sirve STG/Producción sin
 * rebuild cuando la key cambia entre entornos.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(publishableKey: string): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

export const STRIPE_MERCHANT_NAME = "Contabilízate";
