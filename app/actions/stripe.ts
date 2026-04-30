'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'

// Returns the Stripe hosted checkout URL (redirect mode — works in any environment)
export async function startCheckoutSession(productId: string): Promise<string> {
  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const origin = headersList.get('origin')
  const baseUrl = origin
    ? origin
    : forwardedHost
    ? `https://${forwardedHost}`
    : 'http://localhost:3000'

  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) {
    throw new Error(`Producto con id "${productId}" no encontrado`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/planes`,
  })

  if (!session.url) {
    throw new Error('No se pudo crear la sesión de pago')
  }

  return session.url
}
