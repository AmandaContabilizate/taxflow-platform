import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

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
    const supabase = await createClient()

    // The subscription is linked via metadata — in production, pass user_id and plan_id as metadata
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (userId && planId) {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        plan_id: planId,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription ?? session.id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: session.metadata?.end_date ?? null,
      })
    }
  }

  return NextResponse.json({ received: true })
}
