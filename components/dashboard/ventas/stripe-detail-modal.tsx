'use client'

import { AlertCircle, Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getSaleStripeDetail } from '@/features/operations/actions/getSaleStripeDetail.action'
import type { VentaDetalleStripe } from '@/features/operations/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Divider } from '../ui'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
}

const DASHBOARD_URL: Record<string, (id: string) => string> = {
  paymentIntentId: (id) => `https://dashboard.stripe.com/payments/${id}`,
  stripeCustomerId: (id) => `https://dashboard.stripe.com/customers/${id}`,
  stripeSubscriptionId: (id) => `https://dashboard.stripe.com/subscriptions/${id}`,
}

interface Props {
  saleId: number | null
  onClose: () => void
}

export function StripeDetailModal({ saleId, onClose }: Props) {
  const [state, setState] = useState<{
    loading: boolean
    error: string | null
    data: VentaDetalleStripe | null
  }>({ loading: false, error: null, data: null })

  useEffect(() => {
    if (saleId === null) return
    let cancelled = false
    setState({ loading: true, error: null, data: null })

    void (async () => {
      const res = await getSaleStripeDetail(saleId)
      if (cancelled) return
      setState(
        res.success
          ? { loading: false, error: null, data: res.value }
          : { loading: false, error: res.error.message, data: null },
      )
    })()

    return () => {
      cancelled = true
    }
  }, [saleId])

  const d = state.data

  return (
    <Modal isOpen={saleId !== null} onClose={onClose} title={`Venta #${saleId ?? ''} en Stripe`}>
      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
          style={{ background: 'var(--ink-50)' }}
        >
          <Image src="/stripe-logo.png" alt="Stripe" width={92} height={38} priority />
          <span className="text-[11.5px] font-semibold text-right" style={{ color: 'var(--ink-500)' }}>
            Identificadores para rastrear el cobro
            <br />
            en el dashboard de Stripe
          </span>
        </div>

        {state.loading ? (
          <div className="py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando datos de Stripe…
          </div>
        ) : state.error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {state.error}
            </div>
          </div>
        ) : d ? (
          <>
            <div className="flex flex-col gap-1">
              <div className="text-[16px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                {d.userFullName}
              </div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                {d.userEmail}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-700)' }}>{d.rfc}</code>
                <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                  {formatDate(d.saleDate)}
                </span>
                <span className="text-[13px] font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                  {money.format(d.amount)}
                </span>
              </div>
            </div>

            <Divider />

            <div className="flex flex-col">
              <IdRow label="Payment Intent" field="paymentIntentId" value={d.paymentIntentId} />
              <IdRow label="Customer" field="stripeCustomerId" value={d.stripeCustomerId} />
              {/* <IdRow label="Suscripción" field="stripeSubscriptionId" value={d.stripeSubscriptionId} /> */}
              <IdRow label="Checkout Session" field="checkoutId" value={d.checkoutId} />
            </div>

            {!d.stripeCustomerId && (
              <div
                className="rounded-xl px-4 py-3 text-[12.5px]"
                style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
              >
                No pudimos obtener el <b>Customer</b> de Stripe. Puede que la llave de API no esté
                configurada en este ambiente o que el correo no exista en Stripe.
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  )
}

function IdRow({ label, field, value }: { label: string; field: string; value: string | null }) {
  const [copied, setCopied] = useState(false)
  const href = value ? DASHBOARD_URL[field]?.(value) : undefined

  const copy = () => {
    if (!value) return
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <div className="py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="w-[130px] flex-shrink-0 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </div>
      <div className="flex-1 min-w-0">
        {value ? (
          <code className="block truncate" style={{ ...MONO, fontSize: '12px', color: 'var(--ink-900)' }}>
            {value}
          </code>
        ) : (
          <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>
            No disponible
          </span>
        )}
      </div>
      {value && (
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={copy}
            title="Copiar"
            className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)]"
          >
            {copied ? (
              <Check size={14} style={{ color: 'var(--brand-700)' }} />
            ) : (
              <Copy size={14} style={{ color: 'var(--ink-500)' }} />
            )}
          </button>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir en Stripe"
              className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)]"
            >
              <ExternalLink size={14} style={{ color: 'var(--ink-500)' }} />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
