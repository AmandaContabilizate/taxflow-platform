'use client'

import { Elements } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { CalendarClock, Clock3, Info, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PaymentForm } from '@/components/dashboard/plan/payment-form'
import { getStripePublishableKey } from '@/features/account/actions/getStripePublishableKey.action'
import { PUBLIC_ROUTES } from '@/lib/routes'
import { getStripe } from '@/lib/stripe-client'
import { EASE_OUT, ENTRADA, TARJETA } from './pago-estilos'

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

function formatoDinero(amount: number, currency: string): { entero: string; centavos: string } {
  let texto: string
  try {
    texto = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency || 'MXN',
      minimumFractionDigits: 2,
    }).format(amount)
  } catch {
    texto = `$${amount.toFixed(2)}`
  }
  const punto = texto.lastIndexOf('.')
  return punto > 0 ? { entero: texto.slice(0, punto), centavos: texto.slice(punto) } : { entero: texto, centavos: '' }
}

function formatoVence(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Qué se está pagando, antes del método de pago. Banda con el morado de la marca (mismo degradado
 * que el login) para que el total sea lo primero que se lee; Stripe Elements no lo muestra.
 */
function ResumenPago({ resumen }: { resumen: PagoResumen }) {
  const { entero, centavos } = formatoDinero(resumen.amount, resumen.currency)
  const conceptos = resumen.conceptos.length > 0 ? resumen.conceptos : ['Compra en Contabilízate']
  const vence = resumen.expiresAt ? formatoVence(resumen.expiresAt) : ''

  return (
    <section
      aria-label="Resumen de tu compra"
      className="relative overflow-hidden rounded-2xl px-5 pb-5 pt-4 text-white"
      style={{ background: 'linear-gradient(150deg, #221158 0%, #34197F 60%, #4B21B8 100%)' }}
    >
      {/* Brillo de marca: un círculo menta difuso en la esquina, decorativo. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full opacity-30 blur-2xl"
        style={{ background: 'var(--brand-400)' }}
      />

      <div className="relative">
        <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">Total a pagar</div>
        <div className="mt-1 flex items-baseline gap-1.5" style={{ fontFamily: 'var(--font-display)' }}>
          <span className="text-[38px] font-black leading-none tabular-nums">{entero}</span>
          <span className="text-lg font-bold tabular-nums text-white/80">{centavos}</span>
          <span className="ml-1 text-xs font-bold text-white/60">{(resumen.currency || 'MXN').toUpperCase()}</span>
        </div>

        <ul className="mt-4 flex flex-col gap-1.5">
          {conceptos.map((c) => (
            <li key={c} className="flex items-center gap-2 text-[14px] font-semibold">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: 'var(--brand-400)' }} />
              {c}
            </li>
          ))}
        </ul>

        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-white/15 pt-3 text-[12.5px]">
          {resumen.rfc && (
            <>
              <dt className="text-white/60">RFC</dt>
              <dd className="font-semibold tabular-nums tracking-wide">{resumen.rfc}</dd>
            </>
          )}
          {vence && (
            <>
              <dt className="text-white/60">Vigencia</dt>
              <dd className="flex items-center gap-1.5 font-semibold">
                <CalendarClock size={13} className="text-white/70" />
                Hasta el {vence}
              </dd>
            </>
          )}
        </dl>
      </div>
    </section>
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
        <EstadoIcono bg="var(--amber-soft)">
          <Clock3 size={28} style={{ color: 'var(--amber)' }} />
        </EstadoIcono>
        <h1 className="mb-2 text-xl font-extrabold text-balance" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
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
        <EstadoIcono bg="var(--amber-soft)">
          <Info size={28} style={{ color: 'var(--amber)' }} />
        </EstadoIcono>
        <h1 className="mb-2 text-xl font-extrabold text-balance" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
          Pago no completado
        </h1>
        <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
          No se realizó ningún cargo. Puedes cerrar esta pantalla y volver a intentarlo desde la app.
        </p>
      </Card>
    )
  }

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  const formulario = stripePromise ? (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        // Stripe corre en un iframe: no hereda la fuente de la página. Se carga Assistant (la de la
        // UI) desde Google Fonts para que los campos no caigan en la serif del navegador.
        fonts: [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap' }],
        appearance: {
          theme: isDark ? 'night' : 'stripe',
          variables: {
            colorPrimary: '#34197F',
            colorText: isDark ? '#FFFFFF' : '#221158',
            borderRadius: '12px',
            fontFamily: 'Assistant, system-ui, sans-serif',
            fontSizeBase: '15px',
          },
        },
      }}
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
      <span className="text-sm">Preparando el pago seguro…</span>
    </div>
  )

  const conResumen = !!resumen && resumen.amount > 0

  // Pantalla ancha: dos columnas (resumen fijo a la izquierda, pago a la derecha) para que el botón
  // quede a la vista sin bajar. En celular, una sola columna como antes.
  return (
    <Card wide={conResumen ? 'split' : 'single'}>
      <div className={conResumen ? 'grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-8' : ''}>
        <div className={conResumen ? 'md:sticky md:top-6 md:self-start' : ''}>
          <h1 className="text-xl font-extrabold text-balance" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
            Completa tu pago
          </h1>
          <p className="mb-5 mt-1 text-sm" style={{ color: 'var(--ink-500)' }}>
            Paga con transferencia SPEI, tarjeta u OXXO. Tu plan se activa al confirmarse el pago.
          </p>
          {conResumen && <ResumenPago resumen={resumen!} />}
        </div>
        <div>{formulario}</div>
      </div>
    </Card>
  )
}

function EstadoIcono({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full" style={{ background: bg }}>
      {children}
    </div>
  )
}

function Card({ children, wide }: { children: React.ReactNode; wide?: 'split' | 'single' }) {
  const ancho = wide === 'split' ? 'max-w-[960px]' : wide === 'single' ? 'max-w-[520px]' : 'max-w-[440px] text-center'
  return (
    <div
      className={`w-full ${ancho} rounded-3xl px-5 py-7 sm:px-8 sm:py-8 ${ENTRADA}`}
      style={{ ...EASE_OUT, ...TARJETA }}
    >
      {children}
    </div>
  )
}
