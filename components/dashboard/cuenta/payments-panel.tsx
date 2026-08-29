'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import {
  formatMXN,
  modeOf,
  priceForMode,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  typeLabel,
  type SalePayment,
} from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import { Badge, Divider } from '../ui'

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface Props {
  loading: boolean
  error: string | null
  items: SalePayment[]
  total: number
}

export function PaymentsPanel({ loading, error, items, total }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="text-[16px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Mis pagos a Contabilízate
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          {loading ? 'Cargando…' : `${total} ${total === 1 ? 'pago confirmado' : 'pagos confirmados'}`}
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando pagos…
        </div>
      ) : error ? (
        <div className="py-6 text-center flex flex-col items-center gap-2">
          <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
          <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
            {error}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Aún no tienes pagos registrados.
        </div>
      ) : (
        <div>
          {items.map((p, i) => {
            const mode = modeOf(p.type)
            return (
              <div key={p.saleId}>
                <div className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[14px] truncate" style={{ color: 'var(--ink-900)' }}>
                        {p.planName ?? 'Pago'}
                      </span>
                      {mode === 0 && <Badge kind="brand">−{SUBSCRIPTION_DISCOUNT_PERCENT}% suscripción</Badge>}
                    </div>
                    <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {fmtDate(p.saleDate)} · {typeLabel(p.type)}
                    </div>
                  </div>
                  <div className="text-[14px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
                    {formatMXN(priceForMode(p.amount, mode))}
                  </div>
                </div>
                {i < items.length - 1 && <Divider />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
