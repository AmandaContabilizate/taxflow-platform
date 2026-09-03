'use client'

import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { AlertCircle, CheckCircle2, Lock, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Btn } from '../ui'

interface PaymentFormProps {
  /** Etiqueta del botón, p.ej. "Pagar $470.25". */
  payLabel: string
  onSuccess: () => void
  onCancel: () => void
  /** Destino tras `confirmPayment`. Por defecto el dashboard; la ruta pública /pago la sobreescribe. */
  returnUrl?: string
  /** Texto del botón secundario. Por defecto "Volver al carrito"; /pago no tiene carrito. */
  cancelLabel?: string
}

/**
 * Formulario de pago embebido (equivalente web del PaymentSheet móvil).
 * Debe renderizarse dentro de <Elements> con el clientSecret ya cargado.
 */
export function PaymentForm({ payLabel, onSuccess, onCancel, returnUrl, cancelLabel }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl ?? `${window.location.origin}/dashboard?plan_status=ok`,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-2">
      {/* Security Info */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(0,173,135, 0.08)',
          border: '1px solid rgba(0,173,135, 0.2)',
        }}
      >
        <Lock size={16} style={{ color: '#00AD87', flexShrink: 0 }} />
        <span className="text-[12px] font-medium" style={{ color: '#00AD87' }}>
          Conexión segura. Tu información está encriptada.
        </span>
      </div>

      {/* Payment Section */}
      <div className="flex flex-col gap-3">
        <label className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
          Método de pago
        </label>
        <div
          className="rounded-2xl p-5 border"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <PaymentElement
            options={{
              layout: 'tabs',
              wallets: { googlePay: 'never', applePay: 'never' },
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl border-l-4 animate-in fade-in-50 duration-200"
          style={{
            background: 'rgba(232,77,77, 0.08)',
            borderColor: '#E84D4D',
          }}
        >
          <AlertCircle size={18} style={{ color: '#E84D4D', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: '#7F1D1D' }}>
              Error al procesar el pago
            </div>
            <div className="text-[12px] mt-1" style={{ color: '#991B1B' }}>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-2.5 pt-2">
        <Btn
          type="submit"
          kind="brand"
          block
          disabled={!stripe || submitting}
          style={{
            opacity: !stripe || submitting ? 0.6 : 1,
          }}
        >
          {submitting ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>Procesando pago…</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Lock size={16} />
              <span>{payLabel}</span>
            </div>
          )}
        </Btn>
        <Btn
          type="button"
          kind="ghost"
          block
          onClick={onCancel}
          disabled={submitting}
        >
          {cancelLabel ?? 'Volver al carrito'}
        </Btn>
      </div>

      {/* Security Footer */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-500)' }}>
          <CheckCircle2 size={14} style={{ color: '#00AD87' }} />
          <span>Pago seguro con Stripe</span>
        </div>
        <div className="w-px h-3" style={{ background: 'var(--border)' }} />
        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-500)' }}>
          <Lock size={14} style={{ color: '#00AD87' }} />
          <span>Datos encriptados</span>
        </div>
      </div>
    </form>
  )
}
