'use client'

import { AlertTriangle, Check, CheckCircle2, Copy, Link2, Loader2, Minus, Plus, TicketPercent } from 'lucide-react'
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
  formatMXN,
  periodLabel,
  type DiscountCodePreview,
  type Plan,
  type PlansCatalog,
  type RegisterSaleItem,
} from '@/features/account/types'
import { getConstanciaEstadoVendedor } from '@/features/diagnostico/actions/getConstanciaEstadoVendedor.action'
import type { CsfEsperaEstado } from '@/features/diagnostico/types'
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
      return 'Stripe no pudo crear el cobro. La venta no se registró; intenta de nuevo en un momento.'
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
 * Backoffice → expediente → "Armar venta" (spec-ventas-por-activar paso 1 · spec-liga-de-pago-vendedor
 * paso 4). Misma anatomía que el carrito del cliente ("Arma tu plan"): catálogo que scrollea, pie
 * fijo con cupón + total + acción. Sin saldo nace pagada y activada; con saldo el backend crea el
 * cobro y devuelve la liga de 48 h con el texto para WhatsApp.
 */
export function ArmarVentaModal({ isOpen, onClose, taxpayerId, rfc, legalName, onCreated, onGoDiagnostico }: Props) {
  const [catalog, setCatalog] = useState<PlansCatalog>(EMPTY_PLANS_CATALOG)
  const [estado, setEstado] = useState<CsfEsperaEstado | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [planId, setPlanId] = useState<number | null>(null)
  const [qty, setQty] = useState<Record<number, number>>({})
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
    void (async () => {
      const [plansRes, estadoRes] = await Promise.all([getPlans(rfc, true), getConstanciaEstadoVendedor(taxpayerId)])
      if (cancelled) return
      if (plansRes.success) setCatalog(plansRes.value)
      else setLoadError(plansRes.error.message)
      if (estadoRes.success) setEstado(estadoRes.value.estado)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, rfc, taxpayerId])

  // Carrito limpio cada vez que se abre.
  useEffect(() => {
    if (!isOpen) return
    setPlanId(null)
    setQty({})
    setCoupon('')
    setPreview(null)
    setPreviewError(null)
    setError(null)
    setResult(null)
  }, [isOpen])

  const handleOpenChange = (open: boolean) => {
    if (!open && !submitting) onClose()
  }

  const selectedPlan = useMemo(() => catalog.futurePlans.find((p) => p.id === planId) ?? null, [catalog, planId])
  const tieneConstancia = estado?.tieneConstancia === true
  const grantsFree = selectedPlan?.grantsFreeAddOns === true

  // Total a precio de lista, con la misma regla de trámites liberados que el carrito del cliente.
  const subtotal = useMemo(() => {
    let sum = selectedPlan ? selectedPlan.price : 0
    for (const addon of catalog.additionalProcedures) {
      const q = qty[addon.id] ?? 0
      if (q <= 0) continue
      const unit = grantsFree && addon.canBeGrantedFree ? 0 : addon.price
      sum += unit * q
    }
    return sum
  }, [selectedPlan, catalog, qty, grantsFree])

  const percent = preview?.discountTypeId === 1 ? preview.discountPercent : 0
  const total = Math.max(0, subtotal - subtotal * (percent / 100))
  const itemCount = (selectedPlan ? 1 : 0) + Object.values(qty).filter((q) => q > 0).length
  const hasItems = itemCount > 0
  // La liga cobra por pago único: un plan sin precio de pago único solo se vende desde la app.
  const planSoloSuscripcion = Boolean(selectedPlan && !selectedPlan.stripeOneTimePriceId && total > 0)
  const canSubmit = hasItems && !planSoloSuscripcion && !submitting && !loading

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
    if (selectedPlan) {
      items.push({ subscriptionId: selectedPlan.id, quantity: 1, paymentMode: selectedPlan.stripeOneTimePriceId ? 1 : 0 })
    }
    for (const addon of catalog.additionalProcedures) {
      const q = qty[addon.id] ?? 0
      if (q > 0) items.push({ subscriptionId: addon.id, quantity: q, paymentMode: addon.stripeOneTimePriceId ? 1 : 0 })
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

  const step: 'cart' | 'done' = result ? 'done' : 'cart'

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={
          (step === 'cart' ? 'sm:max-w-3xl ' : 'sm:max-w-xl ') +
          'w-[calc(100%-2rem)] max-h-[90vh] flex flex-col overflow-hidden'
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
                  <div className="grid gap-3 sm:grid-cols-2">
                    {catalog.futurePlans.map((p) => {
                      const selected = planId === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setPlanId(selected ? null : p.id)}
                          className={`relative text-left rounded-2xl p-4 ${PRESSABLE}`}
                          style={{
                            background: 'var(--card)',
                            border: `2px solid ${selected ? 'var(--brand-500)' : 'var(--border)'}`,
                            boxShadow: selected ? 'var(--sh-brand)' : 'none',
                          }}
                        >
                          {selected && (
                            <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-500)', color: '#fff' }}>
                              <Check size={13} strokeWidth={3} />
                            </div>
                          )}
                          <div className="font-bold text-[15px] pr-6 leading-snug" style={{ color: 'var(--ink-900)' }}>{p.name}</div>
                          <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[22px] tabular-nums" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                              {formatMXN(p.price)}
                            </span>
                            <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                              MXN · {periodLabel(p.billingPeriod)}
                            </span>
                          </div>
                          {!p.stripeOneTimePriceId && (
                            <div className="text-[11px] mt-1.5" style={{ color: 'var(--ink-500)' }}>Solo suscripción · sin liga de pago</div>
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

              {/* Trámites */}
              {catalog.additionalProcedures.length > 0 && (
                <section className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <SectionLabel>Trámites</SectionLabel>
                    {grantsFree && catalog.additionalProcedures.some((a) => a.canBeGrantedFree) && (
                      <Badge kind="brand">Incluidos con el plan</Badge>
                    )}
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {catalog.additionalProcedures.map((a) => {
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
              {planSoloSuscripcion && (
                <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
                  Este plan solo se vende como suscripción y la liga cobra pagos únicos. El cliente debe comprarlo desde la app, o aplica un cupón que deje el total en cero.
                </div>
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
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>Total</span>
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
                  'Elige un plan o un trámite para continuar'
                ) : total > 0 ? (
                  <><Link2 size={16} /> Generar liga de pago · {formatMXN(total)}</>
                ) : (
                  'Registrar venta sin saldo'
                )}
              </Btn>
              <p className="text-[11px] text-center leading-snug" style={{ color: 'var(--ink-500)' }}>
                {total > 0
                  ? 'La liga vence en 48 horas. El cliente paga con tarjeta, OXXO o transferencia y la venta se activa sola.'
                  : 'Sin saldo la venta nace pagada. El cumplimiento corre al instante.'}
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
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
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>Liga de pago</div>
        <Badge kind="brand">Vence {vence}</Badge>
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
