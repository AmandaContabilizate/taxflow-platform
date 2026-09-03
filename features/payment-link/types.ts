/**
 * Canje del token corto de pago (microservicio Procedures, `apiType: "payment_link"`).
 *
 * La app recibe `paymentUrl` de `POST stripe/payment-sheet` (o de la reemisión
 * `POST payment-link/token`) y abre `/pago?t={token}` en un WebView. El token cifra
 * solo el PaymentIntentId; esta ruta lo canjea por el clientSecret contra Stripe.
 */

/** Espejo de `PaymentLinkClientSecretDto`. */
export interface PaymentLinkClientSecret {
  paymentIntentId: string
  clientSecret: string
  status: string | null
}

/**
 * errorCode del backend (`extensions.errorCode` del ProblemDetails):
 * PAYMENT_TOKEN_INVALID | PAYMENT_TOKEN_EXPIRED | SALE_NOT_FOUND |
 * PAYMENT_SALE_NOT_OPEN | PAYMENT_INTENT_NOT_FOUND.
 */
export interface PaymentLinkError {
  statusCode: number
  message: string
  code?: string
}
