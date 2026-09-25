'use client'

import { AlertTriangle, Check, CheckCircle2, Copy, Link2, Loader2, Minus, Plus, Stethoscope, TicketPercent } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getPlans } from '@/features/account/actions/getPlans.action'
import { previewDiscountCode } from '@/features/account/actions/previewDiscountCode.action'
import {
  registerSaleOnBehalf,
  type RegisterSaleOnBehalfResponse,
  type VendorPaymentLink,
} from '@/features/account/actions/registerSaleOnBehalf.action'
import {
  EMPTY_PLANS_CATALOG,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  formatMXN,
  isAvailableForMode,
  periodLabel,
  priceForMode,
  type DiscountCodePreview,
  type PaymentMode,
  type Plan,
  type PlansCatalog,
  type RegisterSaleItem,
} from '@/features/account/types'
import { getConstanciaEstadoVendedor } from '@/features/diagnostico/actions/getConstanciaEstadoVendedor.action'
import { getDiagnosticoHistorial } from '@/features/diagnostico/actions/getDiagnosticoHistorial.action'
import type { CsfEsperaEstado, DiagnosticoCorrida, DiagnosticoRobotIntento } from '@/features/diagnostico/types'
import { DISPLAY } from '../constants'
import { Badge, Btn } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  taxpayerId: number
  rfc: string
  legalName: string
  /** Se llama tras registrar la venta, para que el expediente recargue productos y periodos. */
  onCreated?: (result: RegisterSaleOnBehalfResponse) => void
  /** Cierra el modal y lleva a la pestaña Diagnóstico del expediente (validar CIEC, bajar o subir constancia). */
  onGoDiagnostico?: () => void
}

/** Mensajes por errorCode del backend (RegisterSaleResult). */
function errorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'PAYMENT_LINK_ONLY_ONE_TIME':
      return 'La liga de pago solo aplica a productos de pago único. Para una suscripción el cliente debe comprar desde la app.'
    case 'PAYMENT_LINK_STRIPE_ERROR':
      return fallback || 'Stripe no pudo crear el cobro. La venta no se registró; intenta de nuevo en un momento.'
    case 'TAXPAYER_NOT_FOUND':
      return 'No encontramos al contribuyente.'
    case 'USER_NOT_FOUND':
      return 'El contribuyente no tiene cuenta de usuario. Primero debe registrarse en la app.'
    default:
      return fallback || 'No se pudo registrar la venta.'
  }
}

// Interacción: solo cambian borde, sombra y escala (nunca `transition: all`); la presión se
// siente con un scale sutil, igual que en el carrito del cliente.
const PRESSABLE = 'transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]'

/**
 * Estado del diagnóstico que condiciona las regularizaciones (Amanda, 2026-09-24): las declaraciones
 * por regularizar solo se ofrecen cuando el ÚLTIMO diagnóstico terminó, porque es el robot quien
 * las detecta en el portal del SAT. Antes de eso se explica el porqué en vez de mostrar una lista
 * vacía, para que el vendedor no pregunte "¿por qué no salen?".
 */
type DiagnosticoEstado = 'cargando' | 'sin' | 'en_curso' | 'terminado' | 'abortado'

function ultimaCorrida(corridas: DiagnosticoCorrida[] | null): DiagnosticoCorrida | null {
  if (!corridas || corridas.length === 0) return null
  return corridas.reduce((a, b) => (new Date(b.startedAt) > new Date(a.startedAt) ? b : a))
}

/**
 * Quién decide si "el diagnóstico terminó": la última corrida del módulo o, si no hay corridas (clientes
 * de antes del módulo, o robots lanzados por el cron), el robot de evaluación de declaraciones, que es el
 * que detecta las pendientes. Estatus del robot: 1 Completado · 2 Fallido · 3 Corriendo · 4 Abortado ·
 * 5 En espera · 6 Encolado.
 */
function estadoDiagnostico(corrida: DiagnosticoCorrida | null, intentos: DiagnosticoRobotIntento[] | null): { estado: DiagnosticoEstado; fin: string | null } {
  if (corrida) {
    if (corrida.estatusId === 2) return { estado: 'terminado', fin: corrida.finishedAt }
    if (corrida.estatusId === 1) return { estado: 'en_curso', fin: null }
    return { estado: 'abortado', fin: null }
  }
  const evaluacion = (intentos ?? [])
    .filter((i) => /evaluaci/i.test(i.robot) || /evaluat/i.test(i.scraperName))
    .sort((a, b) => new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime())[0]
  if (!evaluacion) return { estado: 'sin', fin: null }
  if (evaluacion.estatusId === 1) return { estado: 'terminado', fin: evaluacion.lastAttemptDate }
  if (evaluacion.estatusId === 3 || evaluacion.estatusId === 5 || evaluacion.estatusId === 6) return { estado: 'en_curso', fin: null }
  return { estado: 'abortado', fin: null }
}

function fechaHoraCorta(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

/**
 * Backoffice → expediente → "Armar venta" (spec-ventas-por-activar paso 1 · spec-liga-de-pago-vendedor
 * paso 4). Misma anatomía que el carrito del cliente ("Arma tu plan"): pestañas Suscripción (−10 %,
 * renovación automática) y Pago único; catálogo que scrollea; pie fijo con cupón + total + acción.
 * Sin saldo nace pagada y activada; con saldo el backend crea el cobro (pago único o primer cobro de
 * la suscripción) y devuelve la liga con el texto para WhatsApp.
 */
export function ArmarVentaModal({ isOpen, onClose, taxpayerId, rfc, legalName, onCreated, onGoDiagnostico }: Props) {
  const [catalog, setCatalog] = useState<PlansCatalog>(EMPTY_PLANS_CATALOG)
  const [estado, setEstado] = useState<CsfEsperaEstado | null>(null)
  const [diagnostico, setDiagnostico] = useState<DiagnosticoEstado>('cargando')
  const [diagnosticoFin, setDiagnosticoFin] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Pago único por defecto: es lo que el vendedor cobra casi siempre por liga.
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(1)
  const [planId, setPlanId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
  const [selectedDecls, setSelectedDecls] = useState<Set<number>>(new Set())
  const [coupon, setCoupon] = useState('')
  const [preview, setPreview] = useState<DiscountCodePreview | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RegisterSaleOnBehalfResponse | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setDiagnostico('cargando')
    void (async () => {
      const [plansRes, estadoRes, historialRes] = await Promise.all([
        getPlans(rfc, true),
        getConstanciaEstadoVendedor(taxpayerId),
        getDiagnosticoHistorial(taxpayerId),
      ])
      if (cancelled) return
      if (plansRes.success) setCatalog(plansRes.value)
      else setLoadError(plansRes.error.message)
      if (estadoRes.success) setEstado(estadoRes.value.estado)
      const corrida = ultimaCorrida(historialRes.success ? historialRes.value.corridas : null)
      const diag = estadoDiagnostico(corrida, estadoRes.success ? estadoRes.value.intentos : null)
      setDiagnostico(diag.estado)
      setDiagnosticoFin(diag.fin)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, rfc, taxpayerId])

  // Carrito limpio cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return
    setPaymentMode(1)
    setPlanId(null)
    setQty({})
    setSelectedDecls(new Set())
    setCoupon('')
    setPreview(null)
    setPreviewError(null)
    setError(null)
    setResult(null)
  }, [isOpen])

  const selectedPlan = useMemo(() => catalog.futurePlans.find((p) => p.id === planId) ?? null, [catalog, planId])
  const tieneConstancia = estado?.tieneConstancia === true
  const grantsFree = selectedPlan?.grantsFreeAddOns === true
  const isSubscriptionMode = paymentMode === 0

  // Igual que en la app: los trámites solo se venden como pago único.
  const procedures = isSubscriptionMode ? [] : catalog.additionalProcedures
  const regularizations = diagnostico === 'terminado' ? catalog.regularizations : []

  // Al cambiar de pestaña se suelta lo que no aplica en la otra (plan sin ese precio, trámites en
  // suscripción, regularizaciones sin precio en ese modo).
  useEffect(() => {
    if (!isOpen) return
    if (selectedPlan && !isAvailableForMode(selectedPlan, paymentMode)) setPlanId(null)
    if (isSubscriptionMode) setQty({})
    setSelectedDecls((prev) => {
      const next = new Set<number>()
      for (const reg of catalog.regularizations) {
        if (reg.plan && isAvailableForMode(reg.plan, paymentMode) && prev.has(reg.declarationId)) next.add(reg.declarationId)
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentMode])

  // Total a precio de lista (o de suscripción), con la misma regla de trámites liberados que el
  // carrito del cliente. Las regularizaciones se cobran siempre.
  const subtotal = useMemo(() => {
    let sum = selectedPlan ? priceForMode(selectedPlan.price, paymentMode) : 0
    for (const addon of procedures) {
      const q = qty[addon.id] ?? 0
      if (q <= 0) continue
      const unit = grantsFree && addon.canBeGrantedFree ? 0 : priceForMode(addon.price, paymentMode)
      sum += unit * q
    }
    for (const reg of regularizations) {
      if (reg.plan && selectedDecls.has(reg.declarationId)) sum += priceForMode(reg.plan.price, paymentMode)
    }
    return sum
  }, [selectedPlan, procedures, regularizations, qty, grantsFree, paymentMode, selectedDecls])

  const percent = preview?.discountTypeId === 1 ? preview.discountPercent : 0
  const total = Math.max(0, subtotal - subtotal * (percent / 100))
  const itemCount = (selectedPlan ? 1 : 0) + Object.values(qty).filter((q) => q > 0).length + selectedDecls.size
  const hasItems = itemCount > 0
  const canSubmit = hasItems && !submitting && !loading

  async function handlePreview() {
    const code = coupon.trim()
    if (!code) return
    setPreviewing(true)
    setPreviewError(null)
    const res = await previewDiscountCode(code, rfc)
    setPreviewing(false)
    if (res.success) {
      setPreview(res.value)
    } else {
      setPreview(null)
      setPreviewError(res.error.message || 'El cupón no es válido para este cliente.')
    }
  }

  function buildItems(): RegisterSaleItem[] {
    const items: RegisterSaleItem[] = []
    if (selectedPlan) items.push({ subscriptionId: selectedPlan.id, quantity: 1, paymentMode })
    for (const addon of procedures) {
      const q = qty[addon.id] ?? 0
      if (q > 0) items.push({ subscriptionId: addon.id, quantity: q, paymentMode })
    }
    // Regularizaciones: un item por producto con la lista de declaraciones que cubre, como en la app.
    const regGroups = new Map<number, number[]>()
    for (const reg of regularizations) {
      if (!reg.plan || !selectedDecls.has(reg.declarationId)) continue
      const list = regGroups.get(reg.plan.id) ?? []
      list.push(reg.declarationId)
      regGroups.set(reg.plan.id, list)
    }
    for (const [subscriptionId, declarationIds] of regGroups) {
      items.push({ subscriptionId, quantity: declarationIds.length, paymentMode, regularizationDeclarationIds: declarationIds })
    }
    return items
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await registerSaleOnBehalf(taxpayerId, {
      items: buildItems(),
      discountCode: coupon.trim() || null,
    })
    setSubmitting(false)
    if (!res.success) {
      setError(errorMessage(res.error.errorCode, res.error.message))
      return
    }
    setResult(res.value)
    onCreated?.(res.value)
  }

  const setAddonQty = (addon: Plan, delta: number) =>
    setQty((prev) => {
      const next = { ...prev }
      const current = next[addon.id] ?? 0
      const max = addon.allowsQuantity ? 99 : 1
      const value = Math.min(max, Math.max(0, current + delta))
      if (value === 0) delete next[addon.id]
      else next[addon.id] = value
      return next
    })

  const toggleDecl = (declarationId: number) =>
    setSelectedDecls((prev) => {
      const next = new Set(prev)
      if (next.has(declarationId)) next.delete(declarationId)
      else next.add(declarationId)
      return next
    })

  const handleOpenChange = (open: boolean) => {
    if (!open && !submitting) onClose()
  }

  const step: 'cart' | 'done' = result ? 'done' : 'cart'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          (step === 'cart' ? 'sm:max-w-5xl ' : 'sm:max-w-xl ') +
          'w-[calc(100%-2rem)] max-h-[92vh] flex flex-col overflow-hidden'
        }
      >
        <DialogHeader className="text-left">
          <div className="flex items-center justify-between gap-3 pr-8">
            <DialogTitle style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
              {step === 'done'
                ? result?.paymentLink ? 'Liga de pago lista' : 'Venta registrada'
                : 'Armar venta'}
            </DialogTitle>
            {step === 'cart' && !loading && (
              <Badge kind={tieneConstancia ? 'brand' : 'amber'}>
                {tieneConstancia ? 'Con constancia' : 'Sin constancia'}
              </Badge>
            )}
          </div>
          <DialogDescription>
            A nombre de <strong style={{ color: 'var(--ink-900)' }}>{legalName || rfc}</strong> · {rfc}. Firmada por ti, sin
            entrar a la cuenta del cliente.
          </DialogDescription>
        </DialogHeader>

        {step === 'done' && result ? (
          <DoneStep result={result} legalName={legalName || rfc} sinConstancia={!tieneConstancia && Boolean(selectedPlan)} onClose={onClose} />
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando catálogo del cliente…
          </div>
        ) : loadError ? (
          <div className="text-[13px] font-semibold px-4 py-3 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
            {loadError}
          </div>
        ) : (
          <>
            {/* Modo de pago: fijo arriba, mismo control que "Arma tu plan" del cliente */}
            <div className="shrink-0 flex flex-col gap-2">
              {/* Control segmentado: el fondo activo es UNA pastilla que se desliza (transform, interrumpible),
                  no dos fondos que se prenden y apagan. */}
              <div className="relative grid grid-cols-2 gap-1 p-1 rounded-2xl" role="tablist" aria-label="Modo de pago" style={{ background: 'var(--muted)' }}>
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.375rem)] rounded-xl motion-reduce:transition-none"
                  style={{
                    background: 'var(--nav-active-bg)',
                    transform: paymentMode === 0 ? 'translateX(0)' : 'translateX(calc(100% + 0.25rem))',
                    transition: 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                />
                {([0, 1] as PaymentMode[]).map((mode) => {
                  const active = paymentMode === mode
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setPaymentMode(mode)}
                      className="relative py-2.5 rounded-xl text-[13.5px] font-bold transition-[color,transform] duration-150 ease-out active:scale-[0.98]"
                      style={{ color: active ? 'var(--nav-active-fg)' : 'var(--ink-500)' }}
                    >
                      {mode === 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          Suscripción
                          <span
                            className="text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-full"
                            style={active ? { background: 'rgba(255,255,255,0.22)', color: 'var(--nav-active-fg)' } : { background: 'var(--hero-brand-soft)', color: 'var(--brand-700)' }}
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
              {isSubscriptionMode ? (
                <div
                  key="aviso-suscripcion"
                  className="rounded-2xl px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200 motion-reduce:animate-none"
                  style={{ background: 'var(--amber-soft)', border: '1.5px solid var(--amber)', color: 'var(--violet-ink)', animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
                  role="note"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--amber)' }} />
                  <div className="text-[13px] leading-snug">
                    <div className="font-extrabold text-[14px]" style={{ fontFamily: 'var(--font-display)' }}>
                      Cargo recurrente, no meses sin intereses
                    </div>
                    <ul className="mt-1.5 flex flex-col gap-1 list-disc pl-4 marker:text-[var(--amber)]">
                      <li>El cliente paga <strong>hoy el periodo completo</strong> con tarjeta y obtiene el −10 %.</li>
                      <li>Al terminar el periodo, Stripe le <strong>cobra solo el siguiente</strong> con la misma tarjeta. No son pagos parciales.</li>
                      <li><strong>Díselo antes de mandar la liga.</strong> El mensaje de WhatsApp y la página de pago también lo advierten, y el cliente tiene que confirmarlo para pagar.</li>
                    </ul>
                    <div className="mt-1.5 text-[12px]" style={{ color: 'var(--ink-500)' }}>La liga vence en 23 horas.</div>
                  </div>
                </div>
              ) : (
                <p className="text-[12px] leading-snug px-1" style={{ color: 'var(--ink-500)' }}>
                  Un solo cobro, sin renovación. La liga acepta tarjeta, SPEI y OXXO y vence en 48 horas.
                </p>
              )}
            </div>

            {/* Catálogo: única zona que scrollea */}
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 flex flex-col gap-6 py-1">
              {!tieneConstancia && (
                <div className="rounded-2xl p-4 flex flex-col gap-2.5 text-[13px] leading-snug" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <div className="font-bold">El cliente no tiene constancia. Antes de vender, sigue este orden:</div>
                  </div>
                  <ol className="flex flex-col gap-1.5 pl-9 list-decimal marker:font-bold">
                    <li>
                      <strong>Ejecuta el diagnóstico</strong> en la pestaña Diagnóstico: valida la CIEC y el robot intenta bajar la
                      constancia del SAT.
                    </li>
                    <li>
                      Si los robots no responden, <strong>sube la constancia del cliente</strong> ahí mismo. Debe estar emitida
                      hoy o ayer.
                    </li>
                    <li>
                      Solo si no fue posible ninguna de las dos, <strong>arma la venta aquí</strong>: se cobra hoy y queda{' '}
                      <strong>pagada pero por activar</strong> hasta que llegue la constancia. Sin régimen se muestran todos
                      los planes: confirma con el cliente cuál le corresponde. Si al llegar la constancia el plan no coincide,
                      la venta se marca "Régimen no coincide" en Ventas por activar para que gerencia la corrija.
                    </li>
                  </ol>
                  {onGoDiagnostico && (
                    <div className="pl-9">
                      <button
                        type="button"
                        onClick={() => { onClose(); onGoDiagnostico() }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-[background-color,transform] duration-150 active:scale-[0.97]"
                        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-900)' }}
                      >
                        Ir a Diagnóstico primero
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Planes */}
              <section className="flex flex-col gap-3">
                <SectionLabel>Plan</SectionLabel>
                {catalog.futurePlans.length === 0 ? (
                  <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Sin planes elegibles para el régimen del cliente.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {catalog.futurePlans.map((p) => {
                      const selected = planId === p.id
                      const enabled = isAvailableForMode(p, paymentMode)
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={selected}
                          disabled={!enabled}
                          onClick={() => setPlanId(selected ? null : p.id)}
                          className={`relative text-left rounded-2xl p-4 ${PRESSABLE} disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100`}
                          style={{
                            background: 'var(--card)',
                            border: `2px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                            boxShadow: selected ? 'var(--sh-brand)' : 'none',
                          }}
                        >
                          <div
                            aria-hidden
                            className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center motion-reduce:transition-none"
                            style={{
                              background: 'var(--brand-500)',
                              color: '#fff',
                              opacity: selected ? 1 : 0,
                              transform: selected ? 'scale(1)' : 'scale(0.6)',
                              transition: 'opacity 140ms ease-out, transform 180ms cubic-bezier(0.23, 1, 0.32, 1)',
                            }}
                          >
                            <Check size={13} strokeWidth={3} />
                          </div>
                          <div className="font-bold text-[15px] pr-6 leading-snug" style={{ color: 'var(--ink-900)' }}>{p.name}</div>
                          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                            {isSubscriptionMode && enabled && (
                              <span className="text-[13px] font-semibold line-through tabular-nums" style={{ color: 'var(--ink-400)' }}>
                                {formatMXN(p.price)}
                              </span>
                            )}
                            <span
                              className="font-extrabold text-[22px] tabular-nums"
                              style={{ ...DISPLAY, color: isSubscriptionMode && enabled ? 'var(--brand-700)' : 'var(--ink-900)' }}
                            >
                              {formatMXN(priceForMode(p.price, paymentMode))}
                            </span>
                            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                              MXN · {periodLabel(p.billingPeriod)}
                            </span>
                          </div>
                          {!enabled && (
                            <div className="text-[11px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
                              {isSubscriptionMode ? 'No se vende como suscripción' : 'Solo como suscripción'}
                            </div>
                          )}
                          {p.shortDescription && (
                            <div className="text-[12.5px] mt-2 leading-snug" style={{ color: 'var(--ink-700)' }}>{p.shortDescription}</div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Trámites: solo en pago único, como en la app */}
              {procedures.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Trámites</SectionLabel>
                    {grantsFree && procedures.some((a) => a.canBeGrantedFree) && (
                      <Badge kind="brand">Incluidos con el plan</Badge>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {procedures.map((a) => {
                      const q = qty[a.id] ?? 0
                      const inCart = q > 0
                      const free = grantsFree && a.canBeGrantedFree
                      const allowsQuantity = a.allowsQuantity === true
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 rounded-2xl p-3.5 transition-[border-color] duration-150"
                          style={{ background: 'var(--card)', border: `1.5px solid ${inCart ? 'var(--brand-500)' : 'var(--border)'}` }}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[13.5px] leading-snug" style={{ color: 'var(--ink-900)' }}>{a.name}</div>
                            <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: 'var(--ink-500)' }}>
                              {free ? 'Incluido' : `${formatMXN(a.price)} · ${periodLabel(a.billingPeriod)}`}
                            </div>
                          </div>
                          {allowsQuantity ? (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <QtyButton onClick={() => setAddonQty(a, -1)} disabled={q === 0} label="Quitar uno"><Minus size={15} /></QtyButton>
                              <span className="w-5 text-center font-bold text-[14px] tabular-nums" style={{ color: 'var(--ink-900)' }}>{q}</span>
                              <QtyButton onClick={() => setAddonQty(a, 1)} label="Agregar uno"><Plus size={15} /></QtyButton>
                            </div>
                          ) : (
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={inCart}
                              aria-label={inCart ? `Quitar ${a.name}` : `Agregar ${a.name}`}
                              onClick={() => setAddonQty(a, inCart ? -1 : 1)}
                              className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-[background-color,border-color,transform] duration-150 active:scale-95"
                              style={{
                                background: inCart ? 'var(--brand-500)' : 'transparent',
                                border: `1.5px solid ${inCart ? 'var(--brand-500)' : 'var(--border-strong)'}`,
                                color: '#fff',
                              }}
                            >
                              {inCart && <Check size={14} strokeWidth={3} />}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Declaraciones por regularizar: solo con diagnóstico terminado */}
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <SectionLabel>Declaraciones por regularizar</SectionLabel>
                  {diagnostico === 'terminado' && (
                    <Badge kind="brand">
                      <span className="inline-flex items-center gap-1">
                        <Stethoscope size={12} /> Diagnóstico terminado{diagnosticoFin ? ` · ${fechaHoraCorta(diagnosticoFin)}` : ''}
                      </span>
                    </Badge>
                  )}
                </div>
                {diagnostico === 'terminado' && (
                  <p className="text-[12px] leading-snug -mt-1" style={{ color: 'var(--ink-500)' }}>
                    Estas son las declaraciones pendientes que el robot encontró en el portal del SAT en esa corrida. Si el cliente
                    presentó algo después, vuelve a ejecutar el diagnóstico para actualizarlas.
                  </p>
                )}
                {diagnostico !== 'terminado' ? (
                  <RegularizacionesBloqueadas estado={diagnostico} onGoDiagnostico={onGoDiagnostico ? () => { onClose(); onGoDiagnostico() } : undefined} />
                ) : regularizations.length === 0 ? (
                  <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
                    El diagnóstico no encontró declaraciones pendientes de regularizar.
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {regularizations.map((reg) => {
                      const enabled = !!reg.plan && isAvailableForMode(reg.plan, paymentMode)
                      const checked = selectedDecls.has(reg.declarationId)
                      const periodo = [reg.month, reg.year].filter(Boolean).join(' ')
                      const title = reg.taxRegimeName || reg.plan?.name || `Declaración ${reg.declarationId}`
                      return (
                        <button
                          key={reg.declarationId}
                          type="button"
                          role="checkbox"
                          aria-checked={checked}
                          disabled={!enabled}
                          onClick={() => toggleDecl(reg.declarationId)}
                          className={`text-left flex items-start justify-between gap-3 rounded-2xl p-3.5 ${PRESSABLE} disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100`}
                          style={{ background: 'var(--card)', border: `1.5px solid ${checked ? 'var(--brand-500)' : 'var(--border)'}` }}
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-[13.5px] leading-snug" style={{ color: 'var(--ink-900)' }}>{title}</div>
                            <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: 'var(--ink-500)' }}>
                              {periodo || 'Declaración pendiente'}
                              {reg.plan ? ` · ${formatMXN(priceForMode(reg.plan.price, paymentMode))}` : ''}
                            </div>
                          </div>
                          <div
                            className="w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 transition-[background-color,border-color] duration-150"
                            style={{
                              background: checked ? 'var(--brand-500)' : 'transparent',
                              border: `1.5px solid ${checked ? 'var(--brand-500)' : 'var(--border-strong)'}`,
                              color: '#fff',
                            }}
                          >
                            {checked && <Check size={13} strokeWidth={3} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>

            {/* Pie fijo: cupón + total + acción */}
            <div className="shrink-0 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              {preview && (
                <div className="flex items-center gap-2 text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}>
                  <TicketPercent size={14} className="shrink-0" style={{ color: 'var(--brand-700)' }} />
                  <span>
                    Cupón <b>{preview.code}</b>{' '}
                    {preview.discountTypeId === 1
                      ? <>aplicado: <b>−{preview.discountPercent}%</b></>
                      : <>regala <b>{preview.declarationsCount ?? 0}</b> declaraciones al comprar un plan</>}
                    {preview.description ? ` · ${preview.description}` : ''}
                  </span>
                </div>
              )}
              {previewError && (
                <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>{previewError}</div>
              )}
              {error && (
                <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>{error}</div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-2 sm:flex-1">
                  <input
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setPreview(null); setPreviewError(null) }}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handlePreview() }}
                    placeholder="Código de descuento (opcional)"
                    className="rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:ring-2 flex-1 uppercase"
                    style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                  />
                  <button
                    type="button"
                    onClick={() => void handlePreview()}
                    disabled={!coupon.trim() || previewing}
                    className="px-4 py-2 rounded-xl text-[12.5px] font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
                    style={{ border: '1px solid var(--border)', color: 'var(--ink-700)', background: 'var(--card)' }}
                  >
                    {previewing ? <Loader2 size={14} className="animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
                <div className="flex flex-col items-end leading-none">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                    Total{isSubscriptionMode ? ' · primer cobro' : ''}
                  </span>
                  <span className="text-[24px] font-extrabold mt-0.5 tabular-nums" style={{ ...DISPLAY, color: percent > 0 ? 'var(--brand-700)' : 'var(--ink-900)' }}>
                    {percent > 0 && (
                      <span className="text-[14px] font-semibold mr-2 line-through" style={{ color: 'var(--ink-400)' }}>{formatMXN(subtotal)}</span>
                    )}
                    {formatMXN(total)} <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>MXN</span>
                  </span>
                </div>
              </div>

              <Btn kind="brand" block disabled={!canSubmit} onClick={() => void handleSubmit()}>
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> {total > 0 ? 'Generando liga…' : 'Registrando…'}</>
                ) : !hasItems ? (
                  'Elige un plan, un trámite o una declaración para continuar'
                ) : total > 0 ? (
                  <><Link2 size={16} /> Generar liga de {isSubscriptionMode ? 'suscripción' : 'pago'} · {formatMXN(total)}</>
                ) : (
                  'Registrar venta sin saldo'
                )}
              </Btn>
              <p className="text-[11px] text-center leading-snug" style={{ color: 'var(--ink-500)' }}>
                {total <= 0
                  ? 'Sin saldo la venta nace pagada. El cumplimiento corre al instante.'
                  : isSubscriptionMode
                    ? 'La liga vence en 23 horas y se paga con tarjeta. Al pagar, la venta se activa y Stripe renueva el plan solo.'
                    : 'La liga vence en 48 horas. El cliente paga con tarjeta, OXXO o transferencia y la venta se activa sola.'}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Sustituye la lista de regularizaciones mientras el diagnóstico no haya terminado: dice por qué no
 * salen y qué hacer, para que el vendedor no lo pregunte cada vez.
 */
function RegularizacionesBloqueadas({ estado, onGoDiagnostico }: { estado: DiagnosticoEstado; onGoDiagnostico?: () => void }) {
  const texto =
    estado === 'cargando'
      ? 'Consultando el diagnóstico…'
      : estado === 'en_curso'
        ? 'El diagnóstico de este cliente está en curso. Cuando termine, aquí aparecen sus declaraciones pendientes: el robot las detecta en el portal del SAT. Suele tardar unos minutos; vuelve a abrir Armar venta al terminar.'
        : estado === 'abortado'
          ? 'El último diagnóstico se abortó, así que no hay lectura confiable de sus declaraciones pendientes. Vuelve a ejecutarlo en la pestaña Diagnóstico y, al terminar, abre de nuevo Armar venta.'
          : 'Las declaraciones por regularizar aparecen cuando termina el diagnóstico: el robot revisa el portal del SAT y detecta las pendientes. Ejecútalo en la pestaña Diagnóstico y, al terminar, abre de nuevo Armar venta.'
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3 text-[13px] leading-snug" style={{ background: 'var(--muted)', color: 'var(--ink-700)' }}>
      <Stethoscope size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--ink-500)' }} />
      <div className="flex flex-col gap-2 min-w-0">
        <span>{texto}</span>
        {onGoDiagnostico && estado !== 'cargando' && estado !== 'en_curso' && (
          <div>
            <button
              type="button"
              onClick={onGoDiagnostico}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-bold transition-[background-color,transform] duration-150 active:scale-[0.97]"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-900)' }}
            >
              Ir a Diagnóstico
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>{children}</div>
  )
}

function QtyButton({ onClick, disabled, label, children }: { onClick: () => void; disabled?: boolean; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-95 disabled:opacity-40 disabled:active:scale-100"
      style={{ border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
    >
      {children}
    </button>
  )
}

/** Confirmación: venta registrada (sin saldo) o liga emitida (con saldo), con la liga lista para copiar. */
function DoneStep({
  result,
  legalName,
  sinConstancia,
  onClose,
}: {
  result: RegisterSaleOnBehalfResponse
  legalName: string
  sinConstancia: boolean
  onClose: () => void
}) {
  const pagada = result.statusSaleId === 2
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
          {pagada ? <CheckCircle2 size={22} /> : <Link2 size={20} />}
        </div>
        <div className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          <div className="font-bold" style={{ color: 'var(--ink-900)' }}>Venta #{result.saleId} · {legalName}</div>
          <div className="mt-0.5">
            {pagada
              ? 'Quedó pagada sin cobro y el cumplimiento corrió: contador, trámites y, si el cliente tiene constancia, sus declaraciones.'
              : result.paymentLink?.esSuscripcion
                ? `Quedó abierta por ${formatMXN(result.amount)} como suscripción. El cliente paga con tarjeta, la venta se activa sola y Stripe renueva el plan al terminar cada periodo.`
                : `Quedó abierta por ${formatMXN(result.amount)}. Al pagar con la liga se activa sola.`}
          </div>
          {sinConstancia && (
            <div className="mt-1 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
              Como el cliente aún no tiene constancia, el plan quedará <strong>por activar</strong>: lo verás en VENTAS →
              Ventas por activar hasta que llegue.
            </div>
          )}
          {result.discountMessage && (
            <div className="mt-1 text-[13px]" style={{ color: 'var(--ink-500)' }}>{result.discountMessage}</div>
          )}
        </div>
      </div>
      {result.paymentLink && <PaymentLinkPanel link={result.paymentLink} />}
      <Btn kind="brand" block onClick={onClose}>Listo</Btn>
    </div>
  )
}

/** Liga emitida: URL y texto para WhatsApp con botones de copiar, y vencimiento. */
export function PaymentLinkPanel({ link }: { link: VendorPaymentLink }) {
  const vence = new Date(link.expiresAt).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
          {link.esSuscripcion ? 'Liga de suscripción · solo tarjeta' : 'Liga de pago'}
        </div>
        <Badge kind={link.esSuscripcion ? 'amber' : 'brand'}>Vence {vence}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={link.paymentUrl}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 rounded-xl px-3 py-2 text-[12.5px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
        <CopyButton text={link.paymentUrl} label="Copiar liga" />
      </div>
      <div>
        <textarea
          readOnly
          value={link.whatsAppText}
          rows={5}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full rounded-xl px-3 py-2 text-[12.5px] leading-relaxed outline-none resize-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
        <div className="flex justify-end mt-1.5">
          <CopyButton text={link.whatsAppText} label="Copiar mensaje para WhatsApp" />
        </div>
      </div>
    </div>
  )
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Sin permiso de portapapeles: el campo es seleccionable para copiar a mano.
    }
  }
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap shrink-0 transition-[background-color,color,transform] duration-150 active:scale-[0.97]"
      style={{
        background: copied ? 'var(--brand-100)' : 'var(--card)',
        border: '1px solid var(--border-strong)',
        color: copied ? 'var(--brand-900)' : 'var(--foreground)',
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiado' : label}
    </button>
  )
}
