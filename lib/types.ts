export type FiscalRegime = {
  id: string
  name: string
  description: string
  created_at: string
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'user' | 'accountant' | 'admin'
  photo_url: string | null
  oauth_provider: 'google' | 'facebook' | null
  created_at: string
  updated_at: string
}

export type UserCredentials = {
  id: string
  user_id: string
  rfc: string
  ciec_encrypted: string
  fiel_stored_at: string | null
  fiscal_regime_id: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type RegimePlan = {
  id: string
  regime_id: string
  name: string
  billing_period: 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL'
  declarations_count: number
  price_mxn: number
  features: string[]
  created_at: string
  updated_at: string
}

export type Subscription = {
  id: string
  user_id: string
  plan_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  status: 'active' | 'cancelled' | 'expired'
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export type Declaration = {
  id: string
  subscription_id: string
  user_id: string
  accountant_id: string | null
  period_month: number
  period_year: number
  status: 'pending' | 'completed' | 'submitted'
  due_date: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export type BillingPeriod = 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL'
