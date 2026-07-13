"use server";

/**
 * Devuelve la publishable key de Stripe (server-only vía STRIPE_PUBLISHABLE_KEY,
 * sin prefijo NEXT_PUBLIC_) — se resuelve en request time para que el mismo
 * build sirva STG/Producción sin rebuild, a diferencia de leerla directo
 * con NEXT_PUBLIC_ en un client component (se hornea en build time).
 */
export async function getStripePublishableKey(): Promise<string | null> {
  const key = process.env.STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error("[getStripePublishableKey] Falta STRIPE_PUBLISHABLE_KEY");
    return null;
  }
  return key;
}
