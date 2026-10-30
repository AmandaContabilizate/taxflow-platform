import 'server-only'

import Stripe from 'stripe'

const key = process.env.NEXT_PRIVATE_KEY_STRIPE ?? process.env.STRIPE_SECRET_KEY

if (!key) {
  throw new Error('Falta la variable NEXT_PRIVATE_KEY_STRIPE (o STRIPE_SECRET_KEY) en el entorno')
}

export const stripe = new Stripe(key)
