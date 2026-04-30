'use client'

import { useState } from 'react'
import PricingPlans from '@/components/pricing-plans'
import { Checkout } from '@/components/checkout'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  regimes: FiscalRegime[]
  detectedRegimeName: string | null
}

export default function PlanesClient({ regimes, detectedRegimeName }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string
    name: string
    price: number
  } | null>(null)

  function handleSelectPlan(productId: string, planName: string, price: number) {
    if (productId === 'free') {
      window.location.href = '/dashboard'
      return
    }
    setSelectedProduct({ id: productId, name: planName, price })
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

      {/* Content */}
      <div className="py-16 px-4">
        {selectedProduct ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2
                className="text-2xl font-black mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
              >
                Completa tu pago
              </h2>
              <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                Plan <strong>{selectedProduct.name}</strong> — ${selectedProduct.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN/mes
              </p>
            </div>
            <div
              className="rounded-3xl p-6"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Checkout productId={selectedProduct.id} />
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="mt-4 w-full py-3 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1px solid var(--border)',
              }}
            >
              Cambiar plan
            </button>
          </div>
        ) : (
          <PricingPlans
            detectedRegimeName={detectedRegimeName}
            regimes={regimes}
            onSelectPlan={handleSelectPlan}
          />
        )}
      </div>
    </div>
  )
}
