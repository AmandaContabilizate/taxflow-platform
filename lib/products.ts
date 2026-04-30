import { STRIPE_PRODUCTS } from './plans'

export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
}

export const PRODUCTS: Product[] = STRIPE_PRODUCTS
