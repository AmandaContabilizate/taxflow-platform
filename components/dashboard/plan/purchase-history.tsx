'use client'

import { ChevronDown, Receipt } from 'lucide-react'
import { useState } from 'react'
import {
  formatMXN,
  priceForMode,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  type AccountPurchase,
  type AccountPurchaseItem,
  type PaymentMode,
} from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, Divider } from '../ui'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function typeLabel(type: string): string {
  if (type === 'subscription') return 'Suscripción'
  if (type === 'one_time') return 'Pago único'
  return type
}

const PAID_STATUS_ID = 2

/**
 * Las ventas de suscripción se cobran con el price recurrente de Stripe, que ya
 * trae el 10% de descuento; el backend guarda el importe de lista, así que aquí
 * lo descontamos para que el historial cuadre con lo que se cobró.
 */
function modeOf(type: string): PaymentMode {
  return type === 'subscription' ? 0 : 1
}

function PurchaseItem({ item, mode }: { item: AccountPurchaseItem; mode: PaymentMode }) {
  return (
    <div className="rounded-2xl p-3.5" style={{ background: 'var(--ink-50)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>
            {item.planName ?? 'Paquete'}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {item.quantity} × {formatMXN(priceForMode(item.unitAmount, mode))}
          </div>
        </div>
        <div className="text-[13.5px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
          {formatMXN(priceForMode(item.amount, mode))}
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
  const mode = modeOf(purchase.type)
  const amount = priceForMode(purchase.amount, mode)

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
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            {typeLabel(purchase.type)} · venta #{purchase.saleId} ·{' '}
            {purchase.items.length} {purchase.items.length === 1 ? 'concepto' : 'conceptos'}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[14.5px] font-extrabold" style={{ ...MONO, color: 'var(--ink-900)' }}>
            {formatMXN(amount)}
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
            <PurchaseItem key={item.saleItemId} item={item} mode={mode} />
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  compras: AccountPurchase[]
}

export function PurchaseHistory({ compras }: Props) {
  const total = compras.reduce((sum, c) => sum + priceForMode(c.amount, modeOf(c.type)), 0)

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[18px] font-bold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tus compras
        </div>
        {compras.length > 0 && <Badge kind="default">{formatMXN(total)} en total</Badge>}
      </div>
      <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
        Todo lo que has pagado con este RFC. Toca una compra para ver qué incluyó.
      </div>

      <Card>
        {compras.length === 0 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Aún no tienes compras registradas.
          </div>
        ) : (
          <div>
            {compras.map((purchase, i) => (
              <div key={purchase.saleId}>
                <PurchaseRow purchase={purchase} />
                {i < compras.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
