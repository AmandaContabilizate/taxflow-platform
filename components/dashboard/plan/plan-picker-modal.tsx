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
  type Plan,
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
  plans: Plan[]
  /** Se llama cuando el pago se completó con éxito. */
  onPaid: () => void
}

export function PlanPickerModal({
  open,
  onOpenChange,
  rfc,
  plans,
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

  const planList = useMemo(() => plans.filter((p) => p.productType === 0), [plans])
  const addonList = useMemo(() => plans.filter((p) => p.productType === 1), [plans])

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
      <DialogContent className="max-w-lg w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto">
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
          <div className="flex flex-col gap-5">
            {/* Modo de pago */}
            <div
              className="grid grid-cols-2 gap-1 p-1 rounded-2xl"
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

            {/* Planes */}
            <div className="flex flex-col gap-2">
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                Plan
              </div>
              {planList.length === 0 && (
                <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
                  No hay planes disponibles.
                </div>
              )}
              {planList.map((plan) => {
                const enabled = isAvailableForMode(plan, paymentMode)
                const selected = selectedPlanId === plan.id
                return (
                  <button
                    key={plan.id}
                    type="button"
                    disabled={!enabled}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="text-left rounded-2xl p-4 transition disabled:opacity-45 disabled:cursor-not-allowed"
                    style={{
                      background: 'var(--card)',
                      border: `2px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                      boxShadow: selected ? 'var(--sh-brand)' : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                        {plan.name}
                      </div>
                      <div className="font-extrabold text-[16px]" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                        {formatMXN(plan.price)}
                      </div>
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {plan.currency} · {periodLabel(plan.billingPeriod)}
                      {!enabled && ' · no disponible en este modo'}
                    </div>
                    {plan.shortDescription && (
                      <div className="text-[12.5px] mt-1.5" style={{ color: 'var(--ink-700)' }}>
                        {plan.shortDescription}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Add-ons / trámites */}
            {addonList.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                    Trámites adicionales
                  </div>
                  {freeAddons && <Badge kind="brand">Gratis con tu plan</Badge>}
                </div>
                {addonList.map((addon) => {
                  const enabled = isAvailableForMode(addon, paymentMode)
                  const q = qty[addon.id] ?? 0
                  return (
                    <div
                      key={addon.id}
                      className="flex items-center justify-between gap-3 rounded-2xl p-3"
                      style={{
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        opacity: enabled ? 1 : 0.45,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-[13.5px] truncate" style={{ color: 'var(--ink-900)' }}>
                          {addon.name}
                        </div>
                        <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                          {freeAddons ? 'Incluido' : formatMXN(addon.price)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
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
            )}

            {/* Código de descuento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>
                Código de descuento (opcional)
              </label>
              <input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Ej. AHORRA10"
                className="rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
                style={{
                  background: 'var(--input)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {error && (
              <div
                className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
                style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
              >
                {error}
              </div>
            )}

            {/* Total + pagar */}
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold" style={{ color: 'var(--ink-700)' }}>
                  Total
                </span>
                <span className="text-[24px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  {formatMXN(total)} <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>MXN</span>
                </span>
              </div>
              <Btn kind="brand" block disabled={!selectedPlan || processing} onClick={handlePay}>
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparando pago…
                  </>
                ) : (
                  'Continuar al pago'
                )}
              </Btn>
              <p className="text-[11px] text-center" style={{ color: 'var(--ink-500)' }}>
                El cobro final lo confirma Stripe. El total mostrado es referencial.
              </p>
            </div>
          </div>
        )}

        {step === 'paying' && clientSecret && (
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
