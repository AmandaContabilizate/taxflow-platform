export type BillingPeriod = 'MONTHLY' | 'SEMI_ANNUAL' | 'ANNUAL'
export type RegimeName =
  | 'Plataformas Tecnológicas'
  | 'Profesionistas'
  | 'Arrendamiento'
  | 'Multirégimen'

export interface Plan {
  id: string
  name: string
  tagline: string
  price: Record<BillingPeriod, number>
  declarations: number
  features: string[]
  highlighted: boolean
  cta: string
  badge?: string
  free?: boolean
  enterprise?: boolean
}

export const BILLING_LABELS: Record<BillingPeriod, { label: string; savings?: string }> = {
  MONTHLY: { label: 'Mensual' },
  SEMI_ANNUAL: { label: 'Semestral', savings: 'Ahorra 49%' },
  ANNUAL: { label: 'Anual', savings: 'Ahorra 52%' },
}

// Base plans per regime
export const REGIME_PLANS: Record<RegimeName, Plan[]> = {
  'Plataformas Tecnológicas': [
    {
      id: 'plat-basico',
      name: 'Básico',
      tagline: 'Para conocer tu estatus fiscal',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Constancia de Situación Fiscal',
        'Opinión de Cumplimiento',
        'Diagnóstico fiscal últimos 5 años',
        'Estatus en listas negras (69-B, etc.)',
      ],
      highlighted: false,
      cta: 'Comenzar',
      free: true,
    },
    {
      id: 'plat-diamond',
      name: 'Diamond',
      tagline: 'Para freelancers y profesionistas Plataformas Tecnológicas',
      price: { MONTHLY: 616, SEMI_ANNUAL: 374, ANNUAL: 296 },
      declarations: 12,
      features: [
        'Todo el plan Básico',
        '12 declaraciones con IA incluidas',
        'Facturación electrónica 600 folios anuales',
        'Soporte ilimitado por chat y correo',
        'Asesoría personalizada e ilimitada',
      ],
      highlighted: true,
      cta: 'Elegir plan',
      badge: 'Más popular',
    },
    {
      id: 'plat-empresarial',
      name: 'Empresarial',
      tagline: 'Soluciones a medida para tu empresa',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Facturación por API',
        'Portal de proveedores',
        'Auditoría fiscal',
        'Economía colaborativa',
        'Gerente de cuenta dedicado',
      ],
      highlighted: false,
      cta: 'Contactar ventas',
      enterprise: true,
    },
  ],
  Profesionistas: [
    {
      id: 'prof-basico',
      name: 'Básico',
      tagline: 'Para conocer tu estatus fiscal',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Constancia de Situación Fiscal',
        'Opinión de Cumplimiento',
        'Diagnóstico fiscal últimos 5 años',
        'Estatus en listas negras (69-B, etc.)',
      ],
      highlighted: false,
      cta: 'Comenzar',
      free: true,
    },
    {
      id: 'prof-pro',
      name: 'Pro',
      tagline: 'Para profesionistas con clientes recurrentes',
      price: { MONTHLY: 550, SEMI_ANNUAL: 330, ANNUAL: 264 },
      declarations: 12,
      features: [
        'Todo el plan Básico',
        '12 declaraciones con IA incluidas',
        'Facturación electrónica 400 folios anuales',
        'Soporte prioritario por chat y correo',
        'Asesoría fiscal personalizada',
      ],
      highlighted: true,
      cta: 'Elegir plan',
      badge: 'Más popular',
    },
    {
      id: 'prof-empresarial',
      name: 'Empresarial',
      tagline: 'Para despachos y grandes equipos',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Usuarios ilimitados',
        'Portal de clientes',
        'Auditoría fiscal avanzada',
        'Reportes personalizados',
        'Gerente de cuenta dedicado',
      ],
      highlighted: false,
      cta: 'Contactar ventas',
      enterprise: true,
    },
  ],
  Arrendamiento: [
    {
      id: 'arr-basico',
      name: 'Básico',
      tagline: 'Para conocer tu estatus fiscal',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Constancia de Situación Fiscal',
        'Opinión de Cumplimiento',
        'Diagnóstico fiscal últimos 5 años',
        'Estatus en listas negras (69-B, etc.)',
      ],
      highlighted: false,
      cta: 'Comenzar',
      free: true,
    },
    {
      id: 'arr-plus',
      name: 'Plus',
      tagline: 'Para arrendadores con múltiples propiedades',
      price: { MONTHLY: 490, SEMI_ANNUAL: 296, ANNUAL: 235 },
      declarations: 12,
      features: [
        'Todo el plan Básico',
        '12 declaraciones con IA incluidas',
        'Facturación electrónica 300 folios anuales',
        'Soporte ilimitado por chat y correo',
        'Asesoría en deducciones de arrendamiento',
      ],
      highlighted: true,
      cta: 'Elegir plan',
      badge: 'Más popular',
    },
    {
      id: 'arr-empresarial',
      name: 'Empresarial',
      tagline: 'Para portafolios inmobiliarios',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Propiedades ilimitadas',
        'Portal de arrendatarios',
        'Auditoría fiscal',
        'Reportes de rentabilidad',
        'Gerente de cuenta dedicado',
      ],
      highlighted: false,
      cta: 'Contactar ventas',
      enterprise: true,
    },
  ],
  Multirégimen: [
    {
      id: 'multi-basico',
      name: 'Básico',
      tagline: 'Para conocer tu estatus fiscal',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Constancia de Situación Fiscal',
        'Opinión de Cumplimiento',
        'Diagnóstico fiscal últimos 5 años',
        'Estatus en listas negras (69-B, etc.)',
      ],
      highlighted: false,
      cta: 'Comenzar',
      free: true,
    },
    {
      id: 'multi-elite',
      name: 'Elite',
      tagline: 'Para contribuyentes con actividades múltiples',
      price: { MONTHLY: 750, SEMI_ANNUAL: 455, ANNUAL: 360 },
      declarations: 12,
      features: [
        'Todo el plan Básico',
        '12 declaraciones con IA incluidas',
        'Facturación electrónica 800 folios anuales',
        'Soporte ilimitado por chat y correo',
        'Asesoría personalizada e ilimitada',
        'Gestión multirégimen automatizada',
      ],
      highlighted: true,
      cta: 'Elegir plan',
      badge: 'Más popular',
    },
    {
      id: 'multi-empresarial',
      name: 'Empresarial',
      tagline: 'Soluciones corporativas a medida',
      price: { MONTHLY: 0, SEMI_ANNUAL: 0, ANNUAL: 0 },
      declarations: 0,
      features: [
        'Facturación por API',
        'Portal de proveedores',
        'Auditoría fiscal avanzada',
        'Integración con ERP',
        'Gerente de cuenta dedicado',
      ],
      highlighted: false,
      cta: 'Contactar ventas',
      enterprise: true,
    },
  ],
}

export const REGIMES: RegimeName[] = [
  'Plataformas Tecnológicas',
  'Profesionistas',
  'Arrendamiento',
  'Multirégimen',
]

// Products catalog for Stripe (paid plans only)
export const STRIPE_PRODUCTS = [
  { id: 'plat-diamond-monthly', name: 'Diamond Plataformas - Mensual', priceInCents: 61600, description: 'Plan Diamond para Plataformas Tecnológicas - Facturación mensual' },
  { id: 'plat-diamond-semi', name: 'Diamond Plataformas - Semestral', priceInCents: 224400, description: 'Plan Diamond para Plataformas Tecnológicas - Facturación semestral' },
  { id: 'plat-diamond-annual', name: 'Diamond Plataformas - Anual', priceInCents: 355200, description: 'Plan Diamond para Plataformas Tecnológicas - Facturación anual' },
  { id: 'prof-pro-monthly', name: 'Pro Profesionistas - Mensual', priceInCents: 55000, description: 'Plan Pro para Profesionistas - Facturación mensual' },
  { id: 'prof-pro-semi', name: 'Pro Profesionistas - Semestral', priceInCents: 198000, description: 'Plan Pro para Profesionistas - Facturación semestral' },
  { id: 'prof-pro-annual', name: 'Pro Profesionistas - Anual', priceInCents: 316800, description: 'Plan Pro para Profesionistas - Facturación anual' },
  { id: 'arr-plus-monthly', name: 'Plus Arrendamiento - Mensual', priceInCents: 49000, description: 'Plan Plus para Arrendamiento - Facturación mensual' },
  { id: 'arr-plus-semi', name: 'Plus Arrendamiento - Semestral', priceInCents: 177600, description: 'Plan Plus para Arrendamiento - Facturación semestral' },
  { id: 'arr-plus-annual', name: 'Plus Arrendamiento - Anual', priceInCents: 282000, description: 'Plan Plus para Arrendamiento - Facturación anual' },
  { id: 'multi-elite-monthly', name: 'Elite Multirégimen - Mensual', priceInCents: 75000, description: 'Plan Elite para Multirégimen - Facturación mensual' },
  { id: 'multi-elite-semi', name: 'Elite Multirégimen - Semestral', priceInCents: 273000, description: 'Plan Elite para Multirégimen - Facturación semestral' },
  { id: 'multi-elite-annual', name: 'Elite Multirégimen - Anual', priceInCents: 432000, description: 'Plan Elite para Multirégimen - Facturación anual' },
]

export function getStripeProductId(planId: string, period: BillingPeriod): string {
  const suffix = period === 'MONTHLY' ? 'monthly' : period === 'SEMI_ANNUAL' ? 'semi' : 'annual'
  return `${planId}-${suffix}`
}
