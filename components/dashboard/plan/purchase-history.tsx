'use client'

import { ChevronDown, Receipt } from 'lucide-react'
import { useState } from 'react'
import {
  formatMXN,
  modeOf,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  typeLabel,
  type AccountPurchase,
  type AccountPurchaseItem,
} from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, Divider } from '../ui'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const PAID_STATUS_ID = 2

/**
 * Desglose de una compra. "Pagado" es `paidAmount` del back (lo que cobró Stripe: ya sin el 10 % de
 * suscripción, con cupón % y créditos); no se infiere de `amount`. Si el back aún no lo manda
 * (despliegue viejo) se cae a `amount`. El descuento de suscripción del desglose es solo informativo:
 * lo que falta entre el total de la compra, los créditos y lo pagado.
 */
function desglose(purchase: AccountPurchase) {
  const amount = purchase.amount
  const credits = purchase.referralCreditsApplied ?? 0
  const subtotal = purchase.items.reduce((sum, it) => sum + it.amount, 0)
  // Modo: por el price de Stripe de las líneas (el webhook no siempre alcanza a ligar el sub_ a la venta).
  const mode: 0 | 1 = purchase.items.some((it) => it.paymentMode === 0) ? 0 : modeOf(purchase.type) === 0 ? 0 : 1
  const pagado = Math.max(0, Math.round((purchase.paidAmount ?? amount) * 100) / 100)
  // Diferencia entre el total de lista, los créditos y lo cobrado: descuento de suscripción y/o código.
  const subDiscount =
    purchase.paidAmount != null && subtotal > 0
      ? Math.max(0, Math.round((subtotal - credits - pagado) * 100) / 100)
      : 0
  return { amount, credits, subtotal, subDiscount, pagado, mode }
}

function PurchaseItem({ item }: { item: AccountPurchaseItem }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'var(--ink-50)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>
            {item.planName ?? 'Paquete'}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {item.quantity} × {formatMXN(item.unitAmount)}
          </div>
        </div>
        <div className="text-[13.5px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
          {formatMXN(item.amount)}
        </div>
      </div>

      {(item.regularizationDeclarations > 0 || item.futureDeclarations > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {item.regularizationDeclarations > 0 && (
            <Badge kind="amber">{item.regularizationDeclarations} de regularización</Badge>
          )}
          {item.futureDeclarations > 0 && <Badge kind="brand">{item.futureDeclarations} a futuro</Badge>}
        </div>
      )}
    </div>
  )
}

function PurchaseRow({ purchase }: { purchase: AccountPurchase }) {
  const [open, setOpen] = useState(false)
  const isPaid = purchase.statusId === PAID_STATUS_ID
  const { amount, credits, subtotal, subDiscount, pagado, mode } = desglose(purchase)

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left transition hover:opacity-80"
      >
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          <Receipt size={17} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>
              {fmtDate(purchase.saleDate)}
            </span>
            <Badge kind={isPaid ? 'brand' : 'amber'}>{purchase.status}</Badge>
            {mode === 0 && <Badge kind="brand">−{SUBSCRIPTION_DISCOUNT_PERCENT}% suscripción</Badge>}
            {credits > 0 && <Badge kind="amber">−{formatMXN(credits)} créditos de referidos</Badge>}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {mode === 0 ? 'Suscripción' : typeLabel(purchase.type)} · venta #{purchase.saleId} ·{' '}
            {purchase.items.length} {purchase.items.length === 1 ? 'concepto' : 'conceptos'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[14.5px] font-extrabold" style={{ ...MONO, color: 'var(--ink-900)' }}>
            {formatMXN(pagado)}
          </span>
          <ChevronDown
            size={16}
            style={{
              color: 'var(--ink-500)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2.5">
          {purchase.items.map((item) => (
            <PurchaseItem key={item.saleItemId} item={item} />
          ))}
          {(credits > 0 || subDiscount > 0) && (
            <div className="rounded-2xl px-3.5 py-3 text-[12.5px]" style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}>
              <div className="flex items-center justify-between gap-3">
                <span>Total de la compra</span>
                <span style={MONO}>{formatMXN(subtotal)}</span>
              </div>
              {subDiscount > 0 && (
                <div className="flex items-center justify-between gap-3 mt-1" style={{ color: 'var(--brand-700)' }}>
                  <span>{mode === 0 ? `Descuentos (suscripción ${SUBSCRIPTION_DISCOUNT_PERCENT} % y códigos)` : 'Descuento por código'}</span>
                  <span style={MONO}>−{formatMXN(subDiscount)}</span>
                </div>
              )}
              {credits > 0 && (
                <div className="flex items-center justify-between gap-3 mt-1" style={{ color: 'var(--brand-700)' }}>
                  <span>Créditos de referidos aplicados</span>
                  <span style={MONO}>−{formatMXN(credits)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3 mt-1 font-extrabold" style={{ color: 'var(--ink-900)' }}>
                <span>Pagado</span>
                <span style={MONO}>{formatMXN(pagado)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  compras: AccountPurchase[]
}

export function PurchaseHistory({ compras }: Props) {
  const paidCompras = compras.filter(
    (c) => c.statusId === PAID_STATUS_ID || c.status?.toLowerCase() === 'pagada'
  )
  const total = paidCompras.reduce((sum, c) => sum + desglose(c).pagado, 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[18px] font-bold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tus compras
        </div>
        {paidCompras.length > 0 && <Badge kind="default">{formatMXN(total)} en total</Badge>}
      </div>
      <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
        Todo lo que has pagado con este RFC. Toca una compra para ver qué incluyó.
      </div>

      <Card>
        {paidCompras.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Aún no tienes compras registradas.
          </div>
        ) : (
          <div>
            {paidCompras.map((purchase, i) => (
              <div key={purchase.saleId}>
                <PurchaseRow purchase={purchase} />
                {i < paidCompras.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
