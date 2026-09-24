'use client'

import { Elements } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { Clock3, Info, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PaymentForm } from '@/components/dashboard/plan/payment-form'
import { getStripePublishableKey } from '@/features/account/actions/getStripePublishableKey.action'
import { PUBLIC_ROUTES } from '@/lib/routes'
import { getStripe } from '@/lib/stripe-client'

/** El PaymentIntent ya está en curso (SPEI/OXXO elegidos en una entrada previa): no hay nada que confirmar aquí. */
const IN_PROGRESS_STATUSES = new Set(['processing', 'succeeded'])

type View = 'form' | 'waiting' | 'cancelled'

export interface PagoResumen {
  amount: number
  currency: string
  rfc: string
  conceptos: string[]
  expiresAt: string | null
}

function formatoDinero(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN', minimumFractionDigits: 2 }).format(amount)
  } catch {
    return `$${amount.toFixed(2)} ${currency}`
  }
}

function formatoVence(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Qué se está pagando, antes del método de pago. Stripe Elements no muestra el monto por sí solo:
 * sin este bloque el cliente veía "Completa tu pago" sin saber cuánto ni por qué.
 */
function ResumenPago({ resumen }: { resumen: PagoResumen }) {
  const concepto = resumen.conceptos.length > 0 ? resumen.conceptos.join(' · ') : 'Compra en Contabilízate'
  return (
    <div
      className="mb-5 rounded-2xl px-4 py-4"
      style={{ background: 'var(--brand-soft, var(--muted))', border: '1px solid var(--border)' }}
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--ink-500)' }}>
        Total a pagar
      </div>
      <div
        className="mt-0.5 text-[30px] font-extrabold leading-none tabular-nums"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
      >
        {formatoDinero(resumen.amount, resumen.currency)}
      </div>
      <div className="mt-2 text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
        {concepto}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
        {resumen.rfc && (
          <span>
            RFC <span className="font-semibold tabular-nums" style={{ color: 'var(--ink-900)' }}>{resumen.rfc}</span>
          </span>
        )}
        {resumen.expiresAt && formatoVence(resumen.expiresAt) && <span>Liga vigente hasta el {formatoVence(resumen.expiresAt)}</span>}
      </div>
    </div>
  )
}

export function PagoView({
  clientSecret,
  initialStatus,
  resumen,
}: {
  clientSecret: string
  initialStatus: string | null
  resumen?: PagoResumen
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [view, setView] = useState<View>(IN_PROGRESS_STATUSES.has(initialStatus ?? '') ? 'waiting' : 'form')

  useEffect(() => {
    getStripePublishableKey().then((key) => {
      if (key) setStripePromise(getStripe(key))
    })
  }, [])

  if (view === 'waiting') {
    return (
      <Card>
        <div className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full" style={{ background: 'var(--amber-soft)' }}>
          <Clock3 size={28} style={{ color: 'var(--amber)' }} />
        </div>
        <h1 className="mb-2 text-xl font-extrabold" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
          Estamos esperando tu pago
        </h1>
        <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
          Ya recibimos tus datos. En cuanto se confirme la transferencia tu cuenta se actualiza sola. Puedes cerrar
          esta pantalla.
        </p>
      </Card>
    )
  }

  if (view === 'cancelled') {
    return (
      <Card>
        <div className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full" style={{ background: 'var(--amber-soft)' }}>
          <Info size={28} style={{ color: 'var(--amber)' }} />
        </div>
        <h1 className="mb-2 text-xl font-extrabold" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
          Pago no completado
        </h1>
        <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
          No se realizó ningún cargo. Puedes cerrar esta pantalla y volver a intentarlo desde la app.
        </p>
      </Card>
    )
  }

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <Card wide>
      <h1 className="mb-1 text-lg font-extrabold" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
        Completa tu pago
      </h1>
      <p className="mb-5 text-sm" style={{ color: 'var(--ink-500)' }}>
        Elige tu método de pago, incluida transferencia bancaria SPEI.
      </p>
      {resumen && resumen.amount > 0 && <ResumenPago resumen={resumen} />}
      {stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: isDark ? 'night' : 'stripe' } }}
        >
          <PaymentForm
            payLabel="Confirmar pago"
            cancelLabel="Cancelar"
            onSuccess={() => setView('waiting')}
            onCancel={() => setView('cancelled')}
            returnUrl={
              typeof window !== 'undefined'
                ? `${window.location.origin}${PUBLIC_ROUTES.PAYMENT}?status=return`
                : undefined
            }
          />
        </Elements>
      ) : (
        <div className="flex items-center justify-center gap-2 py-10" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Cargando…</span>
        </div>
      )}
    </Card>
  )
}

function Card({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      className={`w-full ${wide ? 'max-w-[480px]' : 'max-w-[440px]'} self-start rounded-3xl px-5 py-7 sm:px-7 sm:py-9 ${wide ? '' : 'text-center'}`}
      style={{ background: 'var(--card)', border: '1.5px solid var(--border-strong)', boxShadow: 'var(--sh-3)' }}
    >
      {children}
    </div>
  )
}
