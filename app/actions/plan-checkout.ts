'use server'

import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { PLAN_TEST_CATALOG, type PlanTestId } from '@/lib/plan-test-catalog'

export async function startPlanCheckout(planId: PlanTestId): Promise<string> {
  const plan = PLAN_TEST_CATALOG.find((p) => p.id === planId)
  if (!plan) throw new Error(`Plan "${planId}" no encontrado`)

  const headersList = await headers()
  const forwardedHost = headersList.get('x-forwarded-host')
  const origin = headersList.get('origin')
  const baseUrl = origin ?? (forwardedHost ? `https://${forwardedHost}` : 'http://localhost:3000')

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: { name: plan.name, description: plan.description },
          unit_amount: plan.priceInCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/dashboard?plan_status=ok&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/dashboard?plan_status=cancelled`,
    metadata: { plan_id: plan.id },
  })

  if (!session.url) throw new Error('No se pudo crear la sesión de pago')
  return session.url
}
