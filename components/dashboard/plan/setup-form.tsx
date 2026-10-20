'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { AlertCircle, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Btn } from '../ui'

interface SetupFormProps {
  /** Se llama cuando Stripe confirmó el guardado de la tarjeta. */
  onSuccess: () => void
  /** El cliente decide guardarla después: el plan sigue activo, pero la renovación fallará sin tarjeta. */
  onSkip: () => void
}

/**
 * Guarda una tarjeta para la renovación (Elements en modo setup, `confirmSetup`). No cobra nada:
 * se usa cuando los créditos de referidos cubrieron el 100 % del primer periodo de una suscripción.
 * Debe renderizarse dentro de <Elements> con el clientSecret del SetupIntent.
 */
export function SetupForm({ onSuccess, onSkip }: SetupFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)

    const { error: confirmError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard?plan_status=ok` },
      redirect: 'if_required',
    })

    if (confirmError) {
      setError(confirmError.message ?? 'No pudimos guardar la tarjeta.')
      setSubmitting(false)
      return
    }
    if (setupIntent && (setupIntent.status === 'succeeded' || setupIntent.status === 'processing')) {
      onSuccess()
      return
    }
    setError('No se pudo guardar la tarjeta. Intenta de nuevo.')
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      <div
        className="text-[12.5px] font-semibold px-3 py-2 rounded-xl"
        style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}
      >
        Tu plan ya está activo y tu primer periodo va cubierto con tus créditos. Guarda una tarjeta para que
        se renueve sin interrupciones; no se te cobra nada ahora.
      </div>

      <div className="rounded-2xl p-5 border" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <PaymentElement options={{ layout: 'tabs', wallets: { googlePay: 'never', applePay: 'never' } }} />
      </div>

      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border-l-4"
          style={{ background: 'rgba(232,77,77, 0.08)', borderColor: '#E84D4D' }}
        >
          <AlertCircle size={18} style={{ color: '#E84D4D', flexShrink: 0, marginTop: '2px' }} />
          <div className="text-[12px]" style={{ color: '#991B1B' }}>
            {error}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 pt-2">
        <Btn type="submit" kind="brand" block disabled={!stripe || submitting} style={{ opacity: !stripe || submitting ? 0.6 : 1 }}>
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Guardando tarjeta…</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Lock size={16} />
              <span>Guardar tarjeta</span>
            </div>
          )}
        </Btn>
        <Btn type="button" kind="ghost" block onClick={onSkip} disabled={submitting}>
          Ahora no
        </Btn>
      </div>
    </form>
  )
}
