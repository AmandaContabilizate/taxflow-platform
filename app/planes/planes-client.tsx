'use client'

import { useState } from 'react'
import PricingPlans from '@/components/pricing-plans'
import { startCheckoutSession } from '@/app/actions/stripe'
import { formatMXN, periodLabel, type ActivePlan } from '@/features/account/types'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  regimes: FiscalRegime[]
  detectedRegimeName: string | null
  activePlan: ActivePlan | null
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PlanesClient({ regimes, detectedRegimeName, activePlan }: Props) {
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  async function handleSelectPlan(productId: string, planName: string, price: number) {
    if (productId === 'free') {
      window.location.href = '/dashboard'
      return
    }
    setCheckoutLoading(productId)
    setCheckoutError(null)
    try {
      // Get Stripe hosted checkout URL and redirect — no embedded iframe issues
      const url = await startCheckoutSession(productId)
      window.location.href = url
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Error al iniciar el pago')
      setCheckoutLoading(null)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top nav */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: 'var(--card)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <a href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--ink-900)' }}
          >
            <span
              className="text-base font-black"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-400)' }}
            >
              C
            </span>
          </div>
          <span
            className="text-base font-black"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Contabilízate
          </span>
        </a>
        <a
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold transition-all"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Volver al dashboard
        </a>
      </header>

      {/* Error banner */}
      {checkoutError && (
        <div
          className="mx-auto max-w-lg mt-4 px-4 py-3 rounded-xl text-sm font-semibold text-center"
          style={{ background: '#FCDCDC', color: 'var(--destructive)' }}
        >
          {checkoutError}
        </div>
      )}

      {/* Plan activo */}
      {activePlan?.hasPlan && (
        <div className="mx-auto max-w-3xl mt-6 px-4">
          <div
            className="rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="min-w-0">
              <div
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--brand-600)' }}
              >
                Tu plan actual
              </div>
              <div
                className="text-lg font-black mt-0.5"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                {activePlan.planName ?? 'Plan activo'}
              </div>
              <div className="text-sm font-semibold mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {[
                  periodLabel(activePlan.billingPeriod ?? undefined),
                  activePlan.type === 'subscription'
                    ? activePlan.renewDate && `se renueva el ${formatDate(activePlan.renewDate)}`
                    : activePlan.paidAt && `pagado el ${formatDate(activePlan.paidAt)}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            </div>
            <div className="text-right">
              <div
                className="text-2xl font-black"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                {activePlan.type === 'subscription' && activePlan.nextChargeAmount != null
                  ? formatMXN(activePlan.nextChargeAmount)
                  : activePlan.paidAmount != null
                    ? formatMXN(activePlan.paidAmount)
                    : activePlan.price != null
                      ? formatMXN(activePlan.price)
                      : '—'}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {activePlan.currency ?? 'MXN'}
                {activePlan.type === 'subscription' && activePlan.nextChargeAmount != null
                  ? ' · próximo cargo'
                  : ' · pago único'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="py-16 px-4">
        <PricingPlans
          detectedRegimeName={detectedRegimeName}
          regimes={regimes}
          onSelectPlan={handleSelectPlan}
          loadingProductId={checkoutLoading}
        />
      </div>
    </div>
  )
}
