'use client'

import { useState } from 'react'
import PricingPlans from '@/components/pricing-plans'
import { startCheckoutSession } from '@/app/actions/stripe'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  regimes: FiscalRegime[]
  detectedRegimeName: string | null
}

export default function PlanesClient({ regimes, detectedRegimeName }: Props) {
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
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
