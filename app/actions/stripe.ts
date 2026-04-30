'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { PRODUCTS } from '@/lib/products'

export async function startCheckoutSession(productId: string): Promise<string> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? headersList.get('x-forwarded-host') ?? 'http://localhost:3000'
  const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`

  const product = PRODUCTS.find(p => p.id === productId)
  if (!product) {
    throw new Error(`Producto con id "${productId}" no encontrado`)
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    return_url: `${baseUrl}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
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
    mode: 'payment',
  })

  if (!session.client_secret) {
    throw new Error('No se pudo crear la sesión de pago')
  }

  return session.client_secret
}
