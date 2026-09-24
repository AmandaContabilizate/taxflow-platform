'use client'

import { ArrowRight, Check, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ajustarPlan, type AjustarPlanResult } from '@/features/account/actions/activarVentas.action'
import { getPlans } from '@/features/account/actions/getPlans.action'
import { formatMXN, periodLabel, type Plan } from '@/features/account/types'
import type { VentaPorActivar } from '@/features/operations/types'
import { DISPLAY } from '../constants'
import { Badge, Btn } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  venta: VentaPorActivar | null
  /** Tras ajustar y activar: la lista debe recargarse. */
  onDone?: (result: AjustarPlanResult) => void
}

const PRESSABLE = 'transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]'

function errorMessage(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'SALE_PLAN_NOT_COMPATIBLE':
      return 'El plan elegido no cubre ningún régimen de la constancia del cliente.'
    case 'SALE_NOTHING_TO_ACTIVATE':
      return 'La venta ya no tiene planes pendientes de activar. Recarga la lista.'
    case 'SALE_NOT_PAID':
      return 'Solo se ajusta el plan de una venta pagada.'
    default:
      return fallback || 'No se pudo ajustar el plan.'
  }
}

/**
 * "Ajustar plan" (Ventas por activar → Régimen no coincide, spec-ventas-por-activar paso 5): el
 * plan cobrado no cubre el régimen que trajo la constancia. Se muestran solo los planes que SÍ lo
 * cubren (el catálogo por RFC ya filtra por sus regímenes); al confirmar, el backend cambia el
 * producto de la partida, activa la venta y reporta la diferencia de precio. El dinero no se mueve.
 */
export function AjustarPlanModal({ isOpen, onClose, venta, onDone }: Props) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [planId, setPlanId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AjustarPlanResult | null>(null)

  useEffect(() => {
    if (!isOpen || !venta) return
    let cancelled = false
    setLoading(true)
    setLoadError(null)
    setPlanId(null)
    setError(null)
    setResult(null)
    void (async () => {
      // Sin bandera de backoffice: el catálogo devuelve solo los planes elegibles por el régimen
      // real del cliente, que es justo lo que hay que ofrecer aquí.
      const res = await getPlans(venta.rfc)
      if (cancelled) return
      if (res.success) setPlans(res.value.futurePlans.filter((p) => !venta.planes.includes(p.name)))
      else setLoadError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, venta])

  const selected = useMemo(() => plans.find((p) => p.id === planId) ?? null, [plans, planId])
  const diferencia = selected && venta ? selected.price - venta.amount : 0

  async function handleSubmit() {
    if (!venta || !selected || submitting) return
    setSubmitting(true)
    setError(null)
    const res = await ajustarPlan(venta.saleId, selected.id)
    setSubmitting(false)
    if (!res.success) {
      setError(errorMessage(res.error.errorCode, res.error.message))
      return
    }
    setResult(res.value)
    onDone?.(res.value)
  }

  if (!venta) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !submitting) onClose() }}>
      <DialogContent className="sm:max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="text-left">
          <DialogTitle style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            {result ? (result.activada ? 'Plan ajustado y venta activada' : 'Plan ajustado') : 'Ajustar plan'}
          </DialogTitle>
          <DialogDescription>
            Venta #{venta.saleId} · <strong style={{ color: 'var(--ink-900)' }}>{venta.legalName || venta.rfc}</strong> · {venta.rfc}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                <CheckCircle2 size={22} />
              </div>
              <div className="text-[14px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
                <div className="font-bold" style={{ color: 'var(--ink-900)' }}>
                  {result.planAnterior} <ArrowRight size={14} className="inline mx-1" /> {result.planNuevo}
                </div>
                <div className="mt-1">
                  {result.activada
                    ? `Se crearon sus declaraciones para ${result.regimenes} ${result.regimenes === 1 ? 'régimen' : 'regímenes'} y se asignó contador.`
                    : 'El plan cambió pero la activación falló; ejecuta el diagnóstico desde el expediente o vuelve a intentar.'}
                </div>
                <div className="mt-2 text-[13px] rounded-xl px-3 py-2" style={{ background: 'var(--muted)', color: 'var(--ink-700)' }}>
                  Cobrado {formatMXN(result.precioAnterior)} · plan nuevo {formatMXN(result.precioNuevo)} ·{' '}
                  {result.diferencia === 0
                    ? 'sin diferencia.'
                    : result.diferencia > 0
                      ? <>falta cobrar <b>{formatMXN(result.diferencia)}</b>. El dinero no se movió: acuérdalo con el cliente.</>
                      : <>el cliente pagó <b>{formatMXN(-result.diferencia)}</b> de más. El dinero no se movió: acuérdalo con el cliente.</>}
                </div>
              </div>
            </div>
            <Btn kind="brand" block onClick={onClose}>Listo</Btn>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Buscando planes compatibles con su régimen…
          </div>
        ) : loadError ? (
          <div className="text-[13px] font-semibold px-4 py-3 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>{loadError}</div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-y-auto -mx-1 px-1 flex flex-col gap-4 py-1">
              <div className="rounded-2xl p-3.5 text-[13px] leading-snug" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
                Se cobró <b>{venta.planes.join(' + ') || 'un plan'}</b> por <b>{formatMXN(venta.amount)}</b>, pero la constancia trae un
                régimen que ese plan no cubre. Elige el plan que sí lo cubre: se activa al confirmar y lo cobrado no se toca.
              </div>

              {plans.length === 0 ? (
                <div className="text-[13px] py-6 text-center" style={{ color: 'var(--ink-500)' }}>
                  No hay planes compatibles con el régimen del cliente. Revisa su constancia en el expediente.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {plans.map((p) => {
                    const active = planId === p.id
                    const diff = p.price - venta.amount
                    return (
                      <button
                        key={p.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setPlanId(active ? null : p.id)}
                        className={`relative text-left rounded-2xl p-4 ${PRESSABLE}`}
                        style={{
                          background: 'var(--card)',
                          border: `2px solid ${active ? 'var(--brand-500)' : 'var(--border)'}`,
                          boxShadow: active ? 'var(--sh-brand)' : 'none',
                        }}
                      >
                        {active && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-500)', color: '#fff' }}>
                            <Check size={13} strokeWidth={3} />
                          </div>
                        )}
                        <div className="font-bold text-[15px] pr-6 leading-snug" style={{ color: 'var(--ink-900)' }}>{p.name}</div>
                        <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[20px] tabular-nums" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>{formatMXN(p.price)}</span>
                          <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>MXN · {periodLabel(p.billingPeriod)}</span>
                        </div>
                        <div className="mt-1.5">
                          {diff === 0 ? (
                            <Badge kind="brand">Mismo precio</Badge>
                          ) : diff > 0 ? (
                            <Badge kind="amber">Falta cobrar {formatMXN(diff)}</Badge>
                          ) : (
                            <Badge kind="sky">Pagó {formatMXN(-diff)} de más</Badge>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="shrink-0 pt-4 flex flex-col gap-3" style={{ borderTop: '1px solid var(--border)' }}>
              {error && (
                <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>{error}</div>
              )}
              <Btn kind="brand" block disabled={!selected || submitting} onClick={() => void handleSubmit()}>
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Ajustando y activando…</>
                ) : selected ? (
                  <>Cambiar a {selected.name} y activar{diferencia !== 0 ? ` · ${diferencia > 0 ? 'falta' : 'sobra'} ${formatMXN(Math.abs(diferencia))}` : ''}</>
                ) : (
                  'Elige el plan correcto'
                )}
              </Btn>
              <p className="text-[11px] text-center leading-snug" style={{ color: 'var(--ink-500)' }}>
                Queda registrado quién hizo el ajuste. La diferencia de precio se resuelve con el cliente; el sistema no cobra ni devuelve.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
