'use client'

import { Elements } from '@stripe/react-stripe-js'
import { CheckCircle2, Loader2, Minus, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createPaymentSheet } from '@/features/account/actions/createPaymentSheet.action'
import { registerSaleNew } from '@/features/account/actions/registerSaleNew.action'
import {
  formatMXN,
  isAvailableForMode,
  paymentIntentIdFromSecret,
  periodLabel,
  type PaymentMode,
  type PlansCatalog,
  type RegisterSaleItem,
} from '@/features/account/types'
import { getStripe } from '@/lib/stripe-client'
import { DISPLAY } from '../constants'
import { Badge, Btn } from '../ui'
import { PaymentForm } from './payment-form'

const stripePromise = getStripe()

type Step = 'cart' | 'paying' | 'success'

interface PlanPickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rfc: string
  catalog: PlansCatalog
  /** Se llama cuando el pago se completó con éxito. */
  onPaid: () => void
}

export function PlanPickerModal({
  open,
  onOpenChange,
  rfc,
  catalog,
  onPaid,
}: PlanPickerModalProps) {
  const [step, setStep] = useState<Step>('cart')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(0)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
  const [discountCode, setDiscountCode] = useState('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const planList = catalog.futurePlans
  // Trámites y regularizaciones se muestran en secciones separadas pero
  // comparten la misma mecánica de add-on (cantidad + suma al total).
  const addonGroups = useMemo(
    () =>
      [
        { title: 'Trámites adicionales', items: catalog.additionalProcedures },
        { title: 'Regularizaciones', items: catalog.regularizations },
      ].filter((g) => g.items.length > 0),
    [catalog],
  )
  const addonList = useMemo(
    () => [...catalog.additionalProcedures, ...catalog.regularizations],
    [catalog],
  )

  const selectedPlan = useMemo(
    () => planList.find((p) => p.id === selectedPlanId) ?? null,
    [planList, selectedPlanId],
  )
  const freeAddons = !!selectedPlan?.grantsFreeAddOns

  // Reiniciar el carrito cada vez que se abre el modal.
  useEffect(() => {
    if (!open) return
    setStep('cart')
    setPaymentMode(0)
    setSelectedPlanId(null)
    setQty({})
    setDiscountCode('')
    setClientSecret(null)
    setError(null)
    setProcessing(false)
  }, [open])

  // Al cambiar de modo, deseleccionar lo que ya no aplique.
  useEffect(() => {
    if (selectedPlan && !isAvailableForMode(selectedPlan, paymentMode)) {
      setSelectedPlanId(null)
    }
    setQty((prev) => {
      const next: Record<number, number> = {}
      for (const addon of addonList) {
        if (isAvailableForMode(addon, paymentMode)) next[addon.id] = prev[addon.id] ?? 0
      }
      return next
    })
  }, [paymentMode, selectedPlan, addonList])

  const addonsTotal = freeAddons
    ? 0
    : addonList.reduce((sum, a) => sum + a.price * (qty[a.id] ?? 0), 0)
  const total = (selectedPlan?.price ?? 0) + addonsTotal

  function buildItems(): RegisterSaleItem[] {
    if (!selectedPlan) return []
    const items: RegisterSaleItem[] = [
      { subscriptionId: selectedPlan.id, quantity: 1, paymentMode },
    ]
    for (const addon of addonList) {
      const q = qty[addon.id] ?? 0
      if (q > 0) items.push({ subscriptionId: addon.id, quantity: q, paymentMode })
    }
    return items
  }

  async function handlePay() {
    if (!selectedPlan) return
    setProcessing(true)
    setError(null)

    const items = buildItems()

    // 1) Pedir parámetros de pago a Stripe.
    const sheet = await createPaymentSheet(rfc, items)
    if (!sheet.success) {
      setError(sheet.error.message)
      setProcessing(false)
      return
    }

    // 2) Registrar la venta ANTES de presentar el pago.
    const paymentIntentId = paymentIntentIdFromSecret(sheet.value.paymentIntentClientSecret)
    const sale = await registerSaleNew({
      checkoutId: paymentIntentId,
      rfc,
      discountCode: discountCode.trim() || null,
      items,
    })
    if (!sale.success) {
      // Registro falló → abortar el cobro, no presentar el formulario.
      setError(sale.error.message)
      setProcessing(false)
      return
    }

    // 3) Mostrar el formulario de pago embebido.
    setClientSecret(sheet.value.paymentIntentClientSecret)
    setStep('paying')
    setProcessing(false)
  }

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          (step === 'cart'
            ? 'sm:max-w-3xl '
            : 'sm:max-w-lg ') +
          'w-[calc(100%-2rem)] max-h-[88vh] flex flex-col overflow-hidden'
        }
      >
        <DialogHeader className="text-left">
          <DialogTitle style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            {step === 'success' ? '¡Listo!' : step === 'paying' ? 'Completa tu pago' : 'Arma tu plan'}
          </DialogTitle>
          <DialogDescription>
            {step === 'success'
              ? 'Tu pago se procesó correctamente.'
              : step === 'paying'
                ? 'Ingresa los datos de tu tarjeta de forma segura.'
                : 'Elige tu plan y los trámites que necesites.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'cart' && (
          <>
            {/* Modo de pago — fijo arriba */}
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-2xl flex-shrink-0"
              style={{ background: 'var(--muted)' }}
            >
              {([0, 1] as PaymentMode[]).map((mode) => {
                const active = paymentMode === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className="py-2 rounded-xl text-[13px] font-bold transition"
                    style={
                      active
                        ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)' }
                        : { color: 'var(--ink-500)' }
                    }
                  >
                    {mode === 0 ? 'Suscripción' : 'Pago único'}
                  </button>
                )
              })}
            </div>

            {/* Catálogo — única zona que scrollea */}
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 flex flex-col gap-6 py-1">
              {/* Planes */}
              <div className="flex flex-col gap-3">
                <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                  Elige tu plan
                </div>
                {planList.length === 0 && (
                  <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
                    No hay planes disponibles.
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2">
                  {planList.map((plan) => {
                    const enabled = isAvailableForMode(plan, paymentMode)
                    const selected = selectedPlanId === plan.id
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        disabled={!enabled}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className="relative text-left rounded-2xl p-4 transition disabled:opacity-45 disabled:cursor-not-allowed"
                        style={{
                          background: 'var(--card)',
                          border: `2px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                          boxShadow: selected ? 'var(--sh-brand)' : 'none',
                        }}
                      >
                        {selected && (
                          <div
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--brand-500)', color: '#fff' }}
                          >
                            <CheckCircle2 size={14} />
                          </div>
                        )}
                        <div className="font-bold text-[15px] pr-6 leading-snug" style={{ color: 'var(--ink-900)' }}>
                          {plan.name}
                        </div>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="font-extrabold text-[22px]" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                            {formatMXN(plan.price)}
                          </span>
                          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                            {plan.currency} · {periodLabel(plan.billingPeriod)}
                          </span>
                        </div>
                        {!enabled && (
                          <div className="text-[11px] mt-1" style={{ color: 'var(--ink-500)' }}>
                            No disponible en este modo
                          </div>
                        )}
                        {plan.shortDescription && (
                          <div className="text-[12.5px] mt-2 leading-snug" style={{ color: 'var(--ink-700)' }}>
                            {plan.shortDescription}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Add-ons / trámites — una sección por grupo del catálogo */}
              {addonGroups.map((group) => (
                <div key={group.title} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      {group.title}
                    </div>
                    {freeAddons && <Badge kind="brand">Gratis con tu plan</Badge>}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {group.items.map((addon) => {
                      const enabled = isAvailableForMode(addon, paymentMode)
                      const q = qty[addon.id] ?? 0
                      const inCart = q > 0
                      return (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between gap-3 rounded-2xl p-3.5"
                          style={{
                            background: 'var(--card)',
                            border: `1.5px solid ${inCart ? 'var(--brand-500)' : 'var(--border)'}`,
                            opacity: enabled ? 1 : 0.45,
                          }}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[13.5px] leading-snug" style={{ color: 'var(--ink-900)' }}>
                              {addon.name}
                            </div>
                            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              {freeAddons ? 'Incluido' : `${formatMXN(addon.price)} · ${periodLabel(addon.billingPeriod)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              disabled={!enabled || q === 0}
                              onClick={() => setQty((p) => ({ ...p, [addon.id]: Math.max(0, (p[addon.id] ?? 0) - 1) }))}
                              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                              style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
                            >
                              <Minus size={15} />
                            </button>
                            <span className="w-5 text-center font-bold text-[14px]" style={{ color: 'var(--ink-900)' }}>
                              {q}
                            </span>
                            <button
                              type="button"
                              disabled={!enabled}
                              onClick={() => setQty((p) => ({ ...p, [addon.id]: (p[addon.id] ?? 0) + 1 }))}
                              className="w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-40"
                              style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer fijo: descuento + total + pagar (siempre visible) */}
            <div
              className="flex-shrink-0 pt-4 flex flex-col gap-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {error && (
                <div
                  className="text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
                >
                  {error}
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder="Código de descuento (opcional)"
                  className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none sm:flex-1"
                  style={{
                    background: 'var(--input)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                    Total
                  </span>
                  <span className="text-[24px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                    {formatMXN(total)} <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>MXN</span>
                  </span>
                </div>
              </div>
              <Btn kind="brand" block disabled={!selectedPlan || processing} onClick={handlePay}>
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparando pago…
                  </>
                ) : selectedPlan ? (
                  'Continuar al pago'
                ) : (
                  'Elige un plan para continuar'
                )}
              </Btn>
              <p className="text-[11px] text-center leading-snug" style={{ color: 'var(--ink-500)' }}>
                El cobro final lo confirma Stripe. El total mostrado es referencial.
              </p>
            </div>
          </>
        )}

        {step === 'paying' && clientSecret && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: isDark ? 'night' : 'stripe' },
              }}
            >
              <PaymentForm
                payLabel={`Pagar ${formatMXN(total)}`}
                onSuccess={() => setStep('success')}
                onCancel={() => setStep('cart')}
              />
            </Elements>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
            >
              <CheckCircle2 size={34} />
            </div>
            <div className="text-[15px]" style={{ color: 'var(--ink-700)' }}>
              Tu plan quedó activo. Puede tardar unos segundos en reflejarse.
            </div>
            <Btn
              kind="brand"
              block
              onClick={() => {
                onPaid()
                onOpenChange(false)
              }}
            >
              Listo
            </Btn>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
