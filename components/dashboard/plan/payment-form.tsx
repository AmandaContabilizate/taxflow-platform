'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Btn } from '../ui'

interface PaymentFormProps {
  /** Etiqueta del botón, p.ej. "Pagar $470.25". */
  payLabel: string
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Formulario de pago embebido (equivalente web del PaymentSheet móvil).
 * Debe renderizarse dentro de <Elements> con el clientSecret ya cargado.
 */
export function PaymentForm({ payLabel, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?plan_status=ok`,
      },
      redirect: 'if_required',
    })

    if (confirmError) {
      // canceled vs error: el usuario cancelando un wallet no siempre llega aquí;
      // mostramos el mensaje cuando exista.
      setError(confirmError.message ?? 'No se pudo completar el pago.')
      setSubmitting(false)
      return
    }

    if (
      paymentIntent &&
      (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing')
    ) {
      onSuccess()
      return
    }

    setError('El pago no se completó. Intenta de nuevo.')
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {error && (
        <div
          className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Btn type="submit" kind="brand" block disabled={!stripe || submitting}>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Procesando…
            </>
          ) : (
            payLabel
          )}
        </Btn>
        <Btn type="button" kind="ghost" block onClick={onCancel} disabled={submitting}>
          Volver
        </Btn>
      </div>

      <p className="text-[11.5px] text-center" style={{ color: 'var(--ink-500)' }}>
        Pago seguro procesado por Stripe.
      </p>
    </form>
  )
}
