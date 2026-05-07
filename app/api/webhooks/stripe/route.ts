import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET ?? ''
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (userId && planId) {
      // TODO(backend): registrar suscripción vía Identity/Subscriptions API.
      console.warn('[stripe-webhook] TODO wire subscription create to backend', {
        userId,
        planId,
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription ?? session.id,
      })
    }
  }

  return NextResponse.json({ received: true })
}
