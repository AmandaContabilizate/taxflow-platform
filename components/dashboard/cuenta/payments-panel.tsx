'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { formatMXN, type SalePayment } from '@/features/account/types'
import { DISPLAY, MONO } from '../constants'
import { Divider } from '../ui'

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
          <AlertCircle size={20} style={{ color: '#9E3A15' }} />
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
          {items.map((p, i) => (
            <div key={p.saleId}>
              <div className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-bold text-[14px] truncate" style={{ color: 'var(--ink-900)' }}>
                    {p.planName ?? 'Pago'}
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {fmtDate(p.saleDate)} · {typeLabel(p.type)}
                  </div>
                </div>
                <div className="text-[14px] font-extrabold whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
                  {formatMXN(p.amount)}
                </div>
              </div>
              {i < items.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
