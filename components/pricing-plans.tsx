'use client'

import { useState } from 'react'
import { REGIME_PLANS, BILLING_LABELS, REGIMES, getStripeProductId, type BillingPeriod, type RegimeName } from '@/lib/plans'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  detectedRegimeName?: string | null
  regimes: FiscalRegime[]
  onSelectPlan?: (productId: string, planName: string, price: number) => void
}

export default function PricingPlans({ detectedRegimeName, regimes, onSelectPlan }: Props) {
  const initialRegime = (detectedRegimeName as RegimeName) ?? 'Plataformas Tecnológicas'
  const [selectedRegime, setSelectedRegime] = useState<RegimeName>(
    REGIMES.includes(initialRegime as RegimeName) ? initialRegime : REGIMES[0]
  )
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('ANNUAL')

  const plans = REGIME_PLANS[selectedRegime]

  function formatPrice(price: number) {
    return price.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  function getSavingsPercentage(monthlyPrice: number, periodPrice: number, months: number) {
    if (monthlyPrice === 0) return 0
    const periodTotal = periodPrice * months
    const monthlyTotal = monthlyPrice * months
    return Math.round((1 - periodTotal / monthlyTotal) * 100)
  }

  return (
    <section className="w-full max-w-5xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h2
          className="text-4xl font-black tracking-tight text-balance mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Planes que se adaptan a ti
        </h2>
        <p className="text-base font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Elige el plan perfecto para tus necesidades. Sin compromisos, cancela cuando quieras.
        </p>
        <div className="flex items-center justify-center gap-3 mt-3">
          <span
            className="flex items-center gap-1.5 text-sm font-bold"
            style={{ color: 'var(--brand-600)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Declaraciones procesadas con IA
          </span>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
            Precios con IVA incluido
          </span>
        </div>
      </div>

      {/* Billing period toggle */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <span className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Selecciona el período:
        </span>
        <div
          className="flex items-center gap-1 p-1.5 rounded-full"
          style={{ background: 'var(--ink-900)' }}
        >
          {(['MONTHLY', 'SEMI_ANNUAL', 'ANNUAL'] as BillingPeriod[]).map(period => {
            const info = BILLING_LABELS[period]
            return (
              <button
                key={period}
                onClick={() => setBillingPeriod(period)}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all"
                style={{
                  background: billingPeriod === period ? 'var(--brand-500)' : 'transparent',
                  color: billingPeriod === period ? '#fff' : 'rgba(255,255,255,0.55)',
                }}
              >
                <span className="block">{info.label}</span>
                {info.savings && (
                  <span
                    className="block text-xs font-bold"
                    style={{ color: billingPeriod === period ? '#fff' : 'var(--brand-400)' }}
                  >
                    {info.savings}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Regime selector */}
      <div className="flex flex-col items-center gap-2 mb-10">
        <span className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>
          Selecciona tu régimen:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {REGIMES.map(regime => (
            <button
              key={regime}
              onClick={() => setSelectedRegime(regime)}
              className="px-5 py-2.5 rounded-full text-sm font-bold transition-all"
              style={{
                background: selectedRegime === regime ? 'var(--brand-500)' : 'transparent',
                color: selectedRegime === regime ? '#fff' : 'var(--foreground)',
                border: `1.5px solid ${selectedRegime === regime ? 'var(--brand-500)' : 'var(--border)'}`,
              }}
            >
              {regime}
            </button>
          ))}
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map(plan => {
          const price = plan.price[billingPeriod]
          const monthlyPrice = plan.price['MONTHLY']
          const months = billingPeriod === 'MONTHLY' ? 1 : billingPeriod === 'SEMI_ANNUAL' ? 6 : 12
          const savings = getSavingsPercentage(monthlyPrice, price, months)
          const totalLabel = billingPeriod !== 'MONTHLY' && price > 0
            ? `paga $${formatPrice(price * months)} por ${months} meses`
            : null

          return (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-3xl transition-all duration-200"
              style={{
                background: plan.highlighted ? '#fff' : 'var(--ink-900)',
                border: plan.highlighted
                  ? '2px solid var(--brand-400)'
                  : '1.5px solid rgba(255,255,255,0.08)',
                boxShadow: plan.highlighted
                  ? '0 20px 60px rgba(14,209,138,0.18), 0 4px 12px rgba(0,0,0,0.06)'
                  : '0 4px 18px rgba(21,17,63,0.18)',
                transform: plan.highlighted ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              {/* Badges */}
              {plan.badge && (
                <div
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black"
                  style={{ background: 'var(--brand-500)', color: '#fff' }}
                >
                  {plan.badge}
                </div>
              )}
              {savings > 0 && billingPeriod !== 'MONTHLY' && (
                <div
                  className="absolute -top-3.5 right-4 px-3 py-1 rounded-full text-xs font-black"
                  style={{ background: 'var(--amber)', color: 'var(--ink-900)' }}
                >
                  -{savings}%
                </div>
              )}
              {plan.free && (
                <div
                  className="absolute -top-3.5 left-4 px-4 py-1 rounded-full text-xs font-black"
                  style={{ background: 'var(--brand-500)', color: '#fff' }}
                >
                  GRATIS
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Plan name */}
                <div className="mb-4">
                  <h3
                    className="text-xl font-black mb-1"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: plan.highlighted ? 'var(--ink-900)' : '#fff',
                    }}
                  >
                    {plan.name}
                  </h3>
                  <p
                    className="text-xs font-semibold leading-snug"
                    style={{ color: plan.highlighted ? 'var(--muted-foreground)' : 'rgba(255,255,255,0.55)' }}
                  >
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {plan.enterprise ? (
                    <div>
                      <span
                        className="text-4xl font-black"
                        style={{
                          fontFamily: 'var(--font-display)',
                          color: '#fff',
                        }}
                      >
                        Personalizado
                      </span>
                      <p className="text-xs mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        Soluciones a medida para tu empresa
                      </p>
                    </div>
                  ) : plan.free ? (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>$</span>
                        <span
                          className="text-5xl font-black"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-500)' }}
                        >
                          0
                        </span>
                      </div>
                      <p className="text-xs font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>
                        para siempre
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>$</span>
                        <span
                          className="text-5xl font-black"
                          style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-900)' }}
                        >
                          {formatPrice(price)}
                        </span>
                        <span className="text-sm font-bold" style={{ color: 'var(--muted-foreground)' }}>/mes</span>
                      </div>
                      {billingPeriod !== 'MONTHLY' && (
                        <p className="text-xs font-semibold mt-0.5 line-through" style={{ color: 'var(--muted-foreground)' }}>
                          ${formatPrice(monthlyPrice)}/mes
                        </p>
                      )}
                      {totalLabel && (
                        <p className="text-xs font-bold mt-1" style={{ color: 'var(--muted-foreground)' }}>
                          {totalLabel}
                        </p>
                      )}
                      {billingPeriod !== 'MONTHLY' && savings > 0 && (
                        <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--brand-600)' }}>
                          Ahorras {savings}% vs plan mensual
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Features */}
                <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={plan.highlighted ? 'var(--brand-600)' : 'var(--brand-400)'}
                        strokeWidth="3"
                        className="mt-0.5 flex-shrink-0"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span
                        className="text-sm leading-snug"
                        style={{ color: plan.highlighted ? 'var(--foreground)' : 'rgba(255,255,255,0.82)' }}
                        dangerouslySetInnerHTML={{
                          __html: feature.replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong>$1</strong>'
                          ),
                        }}
                      />
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => {
                    if (plan.enterprise) {
                      window.location.href = 'mailto:ventas@contabilizate.mx'
                      return
                    }
                    if (plan.free) {
                      onSelectPlan?.('free', plan.name, 0)
                      return
                    }
                    const productId = getStripeProductId(plan.id, billingPeriod)
                    onSelectPlan?.(productId, plan.name, price)
                  }}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
                  style={
                    plan.highlighted
                      ? {
                          background: 'var(--brand-500)',
                          color: '#fff',
                          boxShadow: '0 14px 34px -10px rgba(14,209,138,0.45)',
                        }
                      : plan.enterprise
                      ? {
                          background: 'transparent',
                          color: '#fff',
                          border: '1.5px solid rgba(255,255,255,0.25)',
                        }
                      : {
                          background: '#fff',
                          color: 'var(--ink-900)',
                        }
                  }
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
