/**
 * Programa de referidos entre clientes (`GET api/referrals/me`, Procedures).
 * El back genera el código la primera vez que se pide el resumen. La recompensa son CRÉDITOS en
 * pesos: un % de la primera compra de cada referido, con vigencia, que se descuentan al comprar.
 */
export interface ReferralsSummary {
  /** Código propio del cliente (CBX-XXXXXX). */
  code: string
  /** % de la primera compra del referido que se abona como créditos. */
  rewardPercent: number
  /** Meses de vigencia de cada lote de créditos. */
  rewardMonths: number
  /** Precio de referencia para "cuánto puedes ganar": su plan, o el plan más barato si no tiene. */
  planPriceReference: number | null
  planNameReference: string | null
  /** Créditos estimados por referido (planPriceReference × rewardPercent / 100). */
  estimatedRewardAmount: number | null
  /** Créditos vigentes sin usar: lo que puede descontar hoy. */
  creditBalance: number
  creditsEarned: number
  creditsRedeemed: number
  creditsExpired: number
  /** Vencimiento más próximo de los créditos con saldo (ISO). */
  nextExpiryAt: string | null
  registered: number
  activated: number
  cancelled: number
  items: ReferralItem[]
}

export type ReferralRewardState = 'available' | 'used' | 'expired' | 'cancelled'

export interface ReferralItem {
  id: number
  /** Nombre comercial o nombre completo; nunca el correo completo. */
  displayName: string
  /** jo***@dominio.com */
  maskedEmail: string
  registeredAt: string
  /** 1 Registrado sin compra, 2 Activado, 3 Cancelado. */
  statusId: 1 | 2 | 3
  statusLabel: string
  activatedAt: string | null
  /** Créditos que generó este referido (pesos). */
  rewardAmount: number | null
  rewardExpiresAt: string | null
  rewardState: ReferralRewardState | null
}

/** `GET api/referrals/balance`: saldo ligero para el carrito. */
export interface ReferralCreditBalance {
  available: number
  nextExpiryAt: string | null
}

export interface ReferralsError {
  statusCode: number
  message: string
  code?: string
}
