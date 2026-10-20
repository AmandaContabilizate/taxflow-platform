'use client'

import { Elements } from '@stripe/react-stripe-js'
import type { Stripe } from '@stripe/stripe-js'
import { Check, CheckCircle2, Coins, Gift, Loader2, Minus, Plus, TicketPercent } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createPaymentSheet } from '@/features/account/actions/createPaymentSheet.action'
import { getStripePublishableKey } from '@/features/account/actions/getStripePublishableKey.action'
import { previewDiscountCode } from '@/features/account/actions/previewDiscountCode.action'
import { registerSaleNew } from '@/features/account/actions/registerSaleNew.action'
import { getReferralCreditBalance } from '@/features/referrals/actions/getReferralCreditBalance.action'
import {
  formatMXN,
  isAvailableForMode,
  isFreeAddon,
  keepSelectableForMode,
  paymentIntentIdFromSecret,
  periodLabel,
  priceForMode,
  regularizationItems,
  selectedRegularizationPlans,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  type DiscountCodePreview,
  type PaymentMode,
  type Plan,
  type PlansCatalog,
  type RegisterSaleItem,
} from '@/features/account/types'
import { getStripe } from '@/lib/stripe-client'
import { DISPLAY } from '../constants'
import { Badge, Btn } from '../ui'
import { PaymentForm } from './payment-form'
import { SetupForm } from './setup-form'
import {
  COMPLEMENT_REGULARIZATIONS_HELP,
  COMPLEMENT_REGULARIZATIONS_TITLE,
  complementDetails,
  RegularizationSection,
} from './regularization-section'

type Step = 'cart' | 'paying' | 'setup' | 'success'

/** Tope de espera del saldo de créditos: si vence, se sigue sin créditos y no se bloquea el pago. */
const BALANCE_TIMEOUT_MS = 8000

/** Identidad estable para el caso "sin tramites": un `[]` nuevo por render reabre el bucle. */
const EMPTY_PROCEDURES: Plan[] = []

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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [step, setStep] = useState<Step>('cart')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(0)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
  // Regularizaciones seleccionadas, por declarationId.
  const [selectedDecls, setSelectedDecls] = useState<Set<number>>(new Set())
  // Complementarias (presentadas sin pagar) seleccionadas, por declarationId.
  const [selectedComplements, setSelectedComplements] = useState<Set<number>>(new Set())
  const [discountCode, setDiscountCode] = useState('')
  // Preview del código validado por el backend (null = sin código aplicado).
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCodePreview | null>(null)
  const [applyingCode, setApplyingCode] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  // Suscripción cubierta al 100 % con créditos: SetupIntent para guardar la tarjeta de la renovación.
  const [setupSecret, setSetupSecret] = useState<string | null>(null)
  // Se cerró sin guardar tarjeta: el plan queda activo pero la renovación fallará.
  const [cardPending, setCardPending] = useState(false)
  // Lo que el back realmente descontó (puede ser menos que el saldo por el mínimo de Stripe) y su aviso.
  const [serverCredits, setServerCredits] = useState<number | null>(null)
  const [creditsNotice, setCreditsNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [discountNotice, setDiscountNotice] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  // Créditos de referidos: saldo vigente del usuario y si quiere descontarlo en esta compra.
  const [creditBalance, setCreditBalance] = useState(0)
  const [creditsLoading, setCreditsLoading] = useState(false)
  const [useCredits, setUseCredits] = useState(true)
  // Promesa del saldo en curso: "Continuar al pago" la espera para no cobrar sin descontar los créditos
  // cuando el backend tarda (p. ej. base de staging dormida).
  const balancePromiseRef = useRef<Promise<number>>(Promise.resolve(0))

  const planList = catalog.futurePlans
  // Los tramites no se venden dentro de una suscripcion: son cargos de una sola vez y
  // cobrarlos de forma recurrente le renovaria al cliente un tramite que ya se hizo.
  // Se contratan en el modo de pago unico o desde la pantalla de Tramites.
  // VA MEMOIZADO A FUERZA: es dependencia del efecto de abajo, y un `[]` literal
  // nuevo en cada render lo disparaba en bucle hasta tumbar la pestaña.
  const procedures = useMemo(
    () => (paymentMode === 0 ? EMPTY_PROCEDURES : catalog.additionalProcedures),
    [paymentMode, catalog.additionalProcedures],
  )
  const regularizations = catalog.regularizations
  const complements = catalog.complementRegularizations

  const selectedPlan = useMemo(
    () => planList.find((p) => p.id === selectedPlanId) ?? null,
    [planList, selectedPlanId],
  )
  const freeAddons = !!selectedPlan?.grantsFreeAddOns

  // Publishable key resuelta server-side (no NEXT_PUBLIC_ — así el mismo
  // build sirve STG/Producción sin rebuild). Se busca una sola vez al abrir
  // el modal por primera vez.
  useEffect(() => {
    if (!open || stripePromise) return
    let cancelled = false
    getStripePublishableKey().then((key) => {
      if (cancelled || !key) return
      setStripePromise(getStripe(key))
    })
    return () => {
      cancelled = true
    }
  }, [open, stripePromise])

  // Reiniciar el carrito cada vez que se abre el modal.
  useEffect(() => {
    if (!open) return
    setStep('cart')
    setPaymentMode(0)
    setSelectedPlanId(null)
    setQty({})
    setSelectedDecls(new Set())
    setSelectedComplements(new Set())
    setDiscountCode('')
    setAppliedDiscount(null)
    setApplyingCode(false)
    setCodeError(null)
    setClientSecret(null)
    setSetupSecret(null)
    setCardPending(false)
    setServerCredits(null)
    setCreditsNotice(null)
    setError(null)
    setDiscountNotice(null)
    setUseCredits(true)
    // Saldo de créditos de referidos (se descuenta en el cobro si el cliente lo deja marcado).
    // Con el RFC que compra: el back no resta lo apartado en la venta Abierta de ese mismo RFC.
    // Con tope de espera: si vence, se sigue sin créditos y "Continuar al pago" no se bloquea.
    setCreditBalance(0)
    setCreditsLoading(true)
    // `stale`: el modal se cerró o se reabrió; la respuesta (o el timeout) de esta apertura ya no
    // debe pisar el saldo de la siguiente.
    let settled = false
    let stale = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const finish = (available: number) => {
      if (settled) return 0
      settled = true
      clearTimeout(timer)
      if (!stale) {
        setCreditBalance(available)
        setCreditsLoading(false)
      }
      return available
    }
    const fetched = getReferralCreditBalance(rfc)
      .then((res) => (res.success ? res.value.available : 0))
      .catch(() => 0)
      .then(finish)
    const timeout = new Promise<number>((resolve) => {
      timer = setTimeout(() => resolve(finish(0)), BALANCE_TIMEOUT_MS)
    })
    balancePromiseRef.current = Promise.race([fetched, timeout])
    setProcessing(false)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [open, rfc])

  // Al cambiar de modo, deseleccionar lo que ya no aplique.
  // Los dos updaters devuelven `prev` cuando el resultado es igual: si construyen
  // siempre un objeto/Set nuevo, React los ve distintos por identidad y vuelve a
  // renderizar, lo que reejecuta este efecto y gira sin parar.
  useEffect(() => {
    if (!open) return
    if (selectedPlan && !isAvailableForMode(selectedPlan, paymentMode)) {
      setSelectedPlanId(null)
    }
    setQty((prev) => {
      const next: Record<number, number> = {}
      for (const addon of procedures) {
        if (isAvailableForMode(addon, paymentMode)) next[addon.id] = prev[addon.id] ?? 0
      }
      const prevKeys = Object.keys(prev)
      const sameKeys = prevKeys.length === Object.keys(next).length
      if (sameKeys && prevKeys.every((k) => prev[Number(k)] === next[Number(k)])) return prev
      return next
    })
    setSelectedDecls((prev) => keepSelectableForMode(regularizations, prev, paymentMode))
    setSelectedComplements((prev) => keepSelectableForMode(complements, prev, paymentMode))
  }, [open, paymentMode, selectedPlan, procedures, regularizations, complements])

  // En suscripción el price recurrente de Stripe ya trae el 10% de descuento;
  // el catálogo solo expone el precio de lista, así que lo descontamos aquí.
  const isSubscriptionMode = paymentMode === 0
  // Solo se pone en cero el trámite marcado como elegible (canBeGrantedFree);
  // los demás se cobran aunque el plan otorgue el beneficio.
  const proceduresTotal = procedures.reduce(
    (sum, a) =>
      sum + (isFreeAddon(a, freeAddons) ? 0 : priceForMode(a.price, paymentMode) * (qty[a.id] ?? 0)),
    0,
  )
  // grantsFreeAddOns solo libera los trámites adicionales: las regularizaciones
  // (y las complementarias) se cobran siempre. Ponerlas en 0 aquí mostraba un total
  // menor al que termina cobrando Stripe, porque el cargo sale de los price de `items`.
  const regsTotal = [
    ...selectedRegularizationPlans(regularizations, selectedDecls),
    ...selectedRegularizationPlans(complements, selectedComplements),
  ].reduce((sum, p) => sum + priceForMode(p.price, paymentMode), 0)
  const total =
    (selectedPlan ? priceForMode(selectedPlan.price, paymentMode) : 0) + proceduresTotal + regsTotal

  // ===== Preview del código de descuento (misma regla que el backend) =====
  // Porcentaje: aplica si ALGÚN producto del carrito está ligado al código y
  // descuenta el TOTAL. Declaraciones: solo aplica comprando un PLAN ligado
  // (precio completo + regularizaciones de regalo).
  const cartProductIds = useMemo(() => {
    const ids = new Set<number>()
    if (selectedPlan) ids.add(selectedPlan.id)
    for (const addon of procedures) if ((qty[addon.id] ?? 0) > 0) ids.add(addon.id)
    for (const p of selectedRegularizationPlans(regularizations, selectedDecls)) ids.add(p.id)
    for (const p of selectedRegularizationPlans(complements, selectedComplements)) ids.add(p.id)
    return ids
  }, [selectedPlan, procedures, qty, regularizations, selectedDecls, complements, selectedComplements])

  // El plan es opcional: hay algo que cobrar con solo trámites o regularizaciones.
  const hasSomethingToPay = cartProductIds.size > 0

  const isGiftCode = appliedDiscount?.discountTypeId === 2
  const discountApplies = useMemo(() => {
    if (!appliedDiscount) return false
    // Sin planes ligados el código aplica a todos (mismo criterio que el backend);
    // el tipo Declaraciones sigue exigiendo un plan en el carrito.
    const sinRestriccion = appliedDiscount.subscriptionPlanIds.length === 0
    if (isGiftCode)
      return !!selectedPlan && (sinRestriccion || appliedDiscount.subscriptionPlanIds.includes(selectedPlan.id))
    return sinRestriccion || appliedDiscount.subscriptionPlanIds.some((id) => cartProductIds.has(id))
  }, [appliedDiscount, isGiftCode, selectedPlan, cartProductIds])

  const discountedTotal =
    appliedDiscount && discountApplies && !isGiftCode
      ? total - total * (appliedDiscount.discountPercent / 100)
      : total

  // Créditos de referidos: después del cupón, hasta el total (misma cuenta que el backend).
  const creditsApplied = useCredits && creditBalance > 0 ? Math.min(creditBalance, discountedTotal) : 0
  const finalTotal = Math.max(0, discountedTotal - creditsApplied)

  async function applyCode() {
    const code = discountCode.trim()
    if (!code || applyingCode) return
    setApplyingCode(true)
    setCodeError(null)
    setAppliedDiscount(null)
    const res = await previewDiscountCode(code, rfc)
    setApplyingCode(false)
    if (!res.success) {
      setCodeError(res.error.message)
      return
    }
    setAppliedDiscount(res.value)
  }

  function buildItems(): RegisterSaleItem[] {
    // El plan es opcional: se puede comprar solo trámites o solo
    // regularizaciones sin cambiar de plan.
    const items: RegisterSaleItem[] = []
    if (selectedPlan) items.push({ subscriptionId: selectedPlan.id, quantity: 1, paymentMode })

    // Trámites adicionales — se mandan tal cual, por cantidad.
    for (const addon of procedures) {
      const q = qty[addon.id] ?? 0
      if (q > 0) items.push({ subscriptionId: addon.id, quantity: q, paymentMode })
    }

    // Regularizaciones y complementarias — un item por producto con sus declarationId.
    items.push(
      ...regularizationItems(regularizations, selectedDecls, paymentMode),
      ...regularizationItems(complements, selectedComplements, paymentMode),
    )

    return items
  }

  // Si una server action falla al invocarse (p. ej. el bundle del navegador quedó viejo tras reiniciar
  // el dev server), que el botón no se quede en "Preparando pago…" para siempre.
  async function handlePay() {
    try {
      await handlePayInner()
    } catch (e) {
      console.error('[plan-picker] fallo al preparar el pago:', e)
      setError('No pudimos preparar el pago. Recarga la página e intenta de nuevo.')
      setProcessing(false)
    }
  }

  async function handlePayInner() {
    if (!hasSomethingToPay) return
    setProcessing(true)
    setError(null)

    const items = buildItems()

    // Si el saldo de créditos todavía no llegó, se espera: así el cobro sale descontado aunque el
    // cliente haya dado clic antes de que apareciera la fila de créditos.
    const balance = await balancePromiseRef.current
    const credits = useCredits && balance > 0 ? Math.min(balance, discountedTotal) : 0
    const finalTotal = Math.max(0, discountedTotal - credits)
    const creditsApplied = credits

    // Venta gratis (código de 100% o créditos que cubren todo): Stripe no acepta cobros
    // de $0, así que se salta por completo — la venta se registra directo (el backend la
    // marca PAGADA y dispara el cumplimiento: declaraciones, contador, trámites).
    if (total > 0 && finalTotal <= 0) {
      const freeSale = await registerSaleNew({
        checkoutId: `free_${Date.now()}`,
        rfc,
        discountCode: discountCode.trim() || null,
        items,
        useReferralCredits: creditsApplied > 0,
      })
      if (!freeSale.success) {
        setError(freeSale.error.message)
        setProcessing(false)
        return
      }
      // El backend revalida el código y el saldo de créditos: la venta quedó gratis solo si nació
      // Pagada (StatusSaleId 2). Si quedó Abierta no es gratis: no mostrar éxito, el cliente debe revisar
      // (p. ej. un código del 100 % que ya no es válido y sin créditos que cubran el total).
      const quedoGratis = freeSale.value.success !== false && freeSale.value.statusSaleId === 2
      if (!quedoGratis) {
        setError(
          freeSale.value.discountMessage ??
            'La compra no quedó cubierta: tu código o tus créditos ya no alcanzan. Revisa el total e intenta de nuevo.',
        )
        setProcessing(false)
        return
      }
      setDiscountNotice(freeSale.value.discountMessage)
      setCreditsNotice(freeSale.value.referralCreditsNotice ?? null)
      setServerCredits(freeSale.value.referralCreditsApplied ?? null)
      // Suscripción cubierta con créditos: el plan ya está activo; falta guardar la tarjeta de la renovación.
      if (freeSale.value.setupIntentClientSecret) {
        setSetupSecret(freeSale.value.setupIntentClientSecret)
        setStep('setup')
        setProcessing(false)
        return
      }
      setStep('success')
      setProcessing(false)
      return
    }

    // 1) Pedir parámetros de pago a Stripe (con el código y los créditos: el cobro sale descontado).
    const sheet = await createPaymentSheet(rfc, items, discountCode, creditsApplied > 0)
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
      useReferralCredits: creditsApplied > 0,
    })
    if (!sale.success) {
      // Registro falló → abortar el cobro, no presentar el formulario.
      setError(sale.error.message)
      setProcessing(false)
      return
    }

    // Cupón no aplicable a los productos del carrito: se avisa, pero el pago continúa sin descuento.
    setDiscountNotice(sale.value.discountMessage)
    // Créditos realmente descontados según el back (no el cálculo local) y su aviso del mínimo de Stripe.
    setServerCredits(sheet.value.referralCreditsApplied ?? sale.value.referralCreditsApplied ?? null)
    setCreditsNotice(sheet.value.referralCreditsNotice ?? sale.value.referralCreditsNotice ?? null)

    // 3) Mostrar el formulario de pago embebido.
    setClientSecret(sheet.value.paymentIntentClientSecret)
    setStep('paying')
    setProcessing(false)
  }

  // Total a pagar con los créditos que el back confirmó; antes de la respuesta, el cálculo local.
  const payTotal = serverCredits != null ? Math.max(0, discountedTotal - serverCredits) : finalTotal

  // Cerrar el modal en el paso de tarjeta equivale a "Ahora no": el plan ya está activo, hay que refrescarlo.
  function handleOpenChange(next: boolean) {
    if (!next && step === 'setup') onPaid()
    onOpenChange(next)
  }

  const isDark =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          (step === 'cart'
            ? 'sm:max-w-3xl '
            : 'sm:max-w-lg ') +
          'w-[calc(100%-2rem)] max-h-[88vh] flex flex-col overflow-hidden'
        }
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-4">
            <DialogTitle style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              {step === 'success' ? '¡Listo!' : step === 'paying' ? 'Completa tu pago' : step === 'setup' ? 'Guarda tu tarjeta' : 'Arma tu plan'}
            </DialogTitle>
            {step === 'paying' && (
              <div
                className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-2 flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #7339FD 0%, #4B21B8 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(115,57,253, 0.3)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1C6.48 1 2 5.48 2 11v9c0 1.1.9 2 2 2h4v-8H4v-2c0-4.42 3.58-8 8-8s8 3.58 8 8v2h-4v8h4c1.1 0 2-.9 2-2v-9c0-5.52-4.48-10-10-10z" />
                </svg>
                <span>Stripe</span>
              </div>
            )}
          </div>
          <DialogDescription>
            {step === 'success'
              ? 'Tu pago se procesó correctamente.'
              : step === 'paying'
                ? 'Ingresa los datos de tu tarjeta de forma segura.'
                : step === 'setup'
                  ? 'Tu plan ya está activo. Falta la tarjeta para la renovación.'
                  : 'Elige tu plan y los trámites que necesites.'}
          </DialogDescription>
        </DialogHeader>

        {discountNotice && (
          <div
            className="flex-shrink-0 text-[12.5px] font-semibold px-3 py-2 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
          >
            {discountNotice}
          </div>
        )}

        {creditsNotice && (
          <div
            className="flex-shrink-0 text-[12.5px] font-semibold px-3 py-2 rounded-xl"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
          >
            {creditsNotice}
          </div>
        )}

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
                    {mode === 0 ? (
                      <span className="inline-flex items-center gap-1.5">
                        Suscripción
                        <span
                          className="text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-full"
                          style={
                            active
                              ? { background: 'rgba(255,255,255,0.22)', color: 'var(--nav-active-fg)' }
                              : { background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }
                          }
                        >
                          −{SUBSCRIPTION_DISCOUNT_PERCENT}%
                        </span>
                      </span>
                    ) : (
                      'Pago único'
                    )}
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
                        <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                          {isSubscriptionMode && enabled && (
                            <span
                              className="text-[13px] font-semibold line-through"
                              style={{ color: 'var(--ink-400)' }}
                            >
                              {formatMXN(plan.price)}
                            </span>
                          )}
                          <span
                            className="font-extrabold text-[22px]"
                            style={{
                              ...DISPLAY,
                              color: isSubscriptionMode && enabled ? 'var(--brand-700)' : 'var(--ink-900)',
                            }}
                          >
                            {formatMXN(priceForMode(plan.price, paymentMode))}
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

              {/* Trámites adicionales — por cantidad */}
              {procedures.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                      Trámites adicionales
                    </div>
                    {procedures.some((a) => isFreeAddon(a, freeAddons)) && (
                      <Badge kind="brand">Gratis con tu plan</Badge>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {procedures.map((addon) => {
                      const enabled = isAvailableForMode(addon, paymentMode)
                      const q = qty[addon.id] ?? 0
                      const inCart = q > 0
                      const free = isFreeAddon(addon, freeAddons)
                      // allowsQuantity undefined = columna aún no desplegada en back;
                      // se trata como instancia única (checkbox) por ser el default
                      // seguro acordado en el contrato.
                      const allowsQuantity = addon.allowsQuantity === true
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
                              {free ? (
                                'Incluido'
                              ) : (
                                <>
                                  {isSubscriptionMode && enabled && (
                                    <span className="line-through mr-1.5" style={{ color: 'var(--ink-400)' }}>
                                      {formatMXN(addon.price)}
                                    </span>
                                  )}
                                  {formatMXN(priceForMode(addon.price, paymentMode))} ·{' '}
                                  {periodLabel(addon.billingPeriod)}
                                </>
                              )}
                            </div>
                          </div>
                          {allowsQuantity ? (
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
                          ) : (
                            // Trámite de instancia única: checkbox fija cantidad 1.
                            // Mismo patrón visual que las regularizaciones (cuadro con Check).
                            <button
                              type="button"
                              disabled={!enabled}
                              onClick={() =>
                                setQty((p) => ({ ...p, [addon.id]: (p[addon.id] ?? 0) > 0 ? 0 : 1 }))
                              }
                              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 disabled:opacity-40"
                              style={{
                                background: inCart ? 'var(--brand-500)' : 'transparent',
                                border: `1.5px solid ${inCart ? 'var(--brand-500)' : 'var(--border-strong)'}`,
                                color: '#fff',
                              }}
                            >
                              {inCart && <Check size={14} />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {regularizations.length > 0 && (
                <RegularizationSection
                  title="Declaraciones por regularizar"
                  items={regularizations}
                  selected={selectedDecls}
                  onSelectedChange={setSelectedDecls}
                  paymentMode={paymentMode}
                />
              )}

              {complements.length > 0 && (
                <RegularizationSection
                  title={COMPLEMENT_REGULARIZATIONS_TITLE}
                  description={COMPLEMENT_REGULARIZATIONS_HELP}
                  items={complements}
                  selected={selectedComplements}
                  onSelectedChange={setSelectedComplements}
                  paymentMode={paymentMode}
                  details={complementDetails}
                />
              )}
            </div>

            {/* Footer fijo: descuento + total + pagar (siempre visible) */}
            <div
              className="flex-shrink-0 pt-4 flex flex-col gap-3"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              {error && (
                <div
                  className="text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
                >
                  {error}
                </div>
              )}
              {/* Avisos del código aplicado */}
              {codeError && (
                <div
                  className="text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
                >
                  {codeError}
                </div>
              )}
              {appliedDiscount && !discountApplies && (
                <div
                  className="text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                >
                  {isGiftCode
                    ? `El código ${appliedDiscount.code} regala declaraciones al comprar un plan; elige el plan participante para usarlo.`
                    : `El código ${appliedDiscount.code} no aplica a los productos seleccionados.`}
                </div>
              )}
              {appliedDiscount && discountApplies && (
                <div
                  className="flex items-center gap-2 text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}
                >
                  {isGiftCode ? (
                    <>
                      <Gift size={14} style={{ color: 'var(--brand-700)' }} className="flex-shrink-0" />
                      <span>
                        Código <b>{appliedDiscount.code}</b>: pagas el precio completo y recibes{' '}
                        <b>{appliedDiscount.declarationsCount}</b> declaraciones futuras extra de regalo.
                      </span>
                    </>
                  ) : (
                    <>
                      <TicketPercent size={14} style={{ color: 'var(--brand-700)' }} className="flex-shrink-0" />
                      <span>
                        Código <b>{appliedDiscount.code}</b> aplicado: <b>−{appliedDiscount.discountPercent}%</b>
                      </span>
                    </>
                  )}
                </div>
              )}

              {creditsLoading && (
                <div
                  className="flex items-center gap-2 text-[12.5px] font-semibold px-3 py-2 rounded-xl"
                  style={{ background: 'var(--card-muted)', color: 'var(--ink-500)' }}
                >
                  <Loader2 size={14} className="animate-spin flex-shrink-0" /> Consultando tus créditos de referidos…
                </div>
              )}
              {!creditsLoading && creditBalance > 0 && (
                <label
                  className="flex items-center justify-between gap-3 text-[12.5px] font-semibold px-3 py-2 rounded-xl cursor-pointer select-none"
                  style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useCredits}
                      onChange={(e) => setUseCredits(e.target.checked)}
                      className="h-4 w-4 accent-[var(--brand-600)]"
                    />
                    <Coins size={14} style={{ color: 'var(--brand-700)' }} className="flex-shrink-0" />
                    <span>
                      Usar mis créditos de referidos: tienes <b>{formatMXN(creditBalance)}</b>
                    </span>
                  </span>
                  {creditsApplied > 0 && <b style={{ color: 'var(--brand-700)' }}>−{formatMXN(creditsApplied)}</b>}
                </label>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-2 sm:flex-1">
                  <input
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value)
                      setAppliedDiscount(null)
                      setCodeError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void applyCode()
                    }}
                    placeholder="Código de descuento (opcional)"
                    className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 flex-1 uppercase"
                    style={{
                      background: 'var(--input)',
                      border: '1px solid var(--border)',
                      color: 'var(--foreground)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void applyCode()}
                    disabled={!discountCode.trim() || applyingCode}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
                    style={{ border: '1px solid var(--border)', color: 'var(--ink-700)', background: 'var(--card)' }}
                  >
                    {applyingCode ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                    Total
                  </span>
                  {finalTotal !== total ? (
                    <span className="text-[24px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--brand-700)' }}>
                      <span
                        className="text-[14px] font-semibold mr-2 line-through"
                        style={{ color: 'var(--ink-400)' }}
                      >
                        {formatMXN(total)}
                      </span>
                      {formatMXN(finalTotal)} <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>MXN</span>
                    </span>
                  ) : (
                    <span className="text-[24px] font-extrabold mt-0.5" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                      {formatMXN(total)} <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>MXN</span>
                    </span>
                  )}
                </div>
              </div>
              <Btn kind="brand" block disabled={!hasSomethingToPay || processing} onClick={handlePay}>
                {processing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Preparando pago…
                  </>
                ) : hasSomethingToPay ? (
                  'Continuar al pago'
                ) : (
                  'Agrega algo a tu carrito para continuar'
                )}
              </Btn>
              <p className="text-[11px] text-center leading-snug" style={{ color: 'var(--ink-500)' }}>
                El cobro final lo confirma Stripe. El total mostrado es referencial.
              </p>
            </div>
          </>
        )}

        {step === 'paying' && clientSecret && stripePromise && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: isDark ? 'night' : 'stripe' },
              }}
            >
              <PaymentForm
                payLabel={`Pagar ${formatMXN(payTotal)}`}
                onSuccess={() => setStep('success')}
                onCancel={() => setStep('cart')}
              />
            </Elements>
          </div>
        )}

        {step === 'setup' && setupSecret && stripePromise && (
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1">
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: setupSecret,
                appearance: { theme: isDark ? 'night' : 'stripe' },
              }}
            >
              <SetupForm
                onSuccess={() => setStep('success')}
                onSkip={() => {
                  setCardPending(true)
                  setStep('success')
                }}
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
            {cardPending && (
              <div
                className="text-[12.5px] font-semibold px-3 py-2 rounded-xl text-left"
                style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
              >
                No guardaste una tarjeta: tu plan sigue activo este periodo, pero no se renovará automáticamente.
                Cuando termine, podrás contratarlo de nuevo desde tu plan.
              </div>
            )}
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
