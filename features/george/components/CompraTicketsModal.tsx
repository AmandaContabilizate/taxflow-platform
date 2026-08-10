'use client'

import { useState } from 'react'
import { X, Loader2, Check } from 'lucide-react'
import { purchaseTickets } from '../actions/purchaseTickets.action'
import { type Result } from '@/lib/common'

interface CompraTicketsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (checkoutSessionId: string) => void
}

const PACKAGES = [
  { count: 10, price: '$99' },
  { count: 50, price: '$399' },
  { count: 100, price: '$699' },
]

export function CompraTicketsModal({ open, onOpenChange, onSuccess }: CompraTicketsModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedCount, setSelectedCount] = useState<number | null>(null)

  const handlePurchase = async (ticketCount: number) => {
    setError(null)
    setLoading(true)
    setSelectedCount(ticketCount)

    try {
      const result = await purchaseTickets({
        ticketCount,
      })

      if (!result.success) {
        setError(result.error.message)
        return
      }

      // Redirect a Stripe checkout
      window.location.href = `/api/stripe/checkout?sessionId=${result.value.checkoutSessionId}`
      onSuccess?.(result.value.checkoutSessionId)
    } finally {
      setLoading(false)
      setSelectedCount(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Comprar Tickets
            </h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Selecciona un paquete de tickets para convertir tus recibos en facturas
            </p>
          </div>
          <button
            onClick={() => {
              onOpenChange(false)
              setError(null)
              setSelectedCount(null)
            }}
            className="p-2 rounded-lg transition hover:bg-gray-100"
            disabled={loading}
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="p-4 rounded-lg text-[13px] mb-6" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PACKAGES.map((pkg) => (
              <button
                key={pkg.count}
                onClick={() => handlePurchase(pkg.count)}
                disabled={loading}
                className="p-4 rounded-xl border-2 transition text-center"
                style={{
                  borderColor: selectedCount === pkg.count ? 'var(--primary)' : 'var(--border)',
                  backgroundColor: selectedCount === pkg.count ? 'var(--primary)/5' : 'transparent',
                  opacity: loading && selectedCount !== pkg.count ? 0.5 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                <div className="text-[24px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  {pkg.count}
                </div>
                <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                  tickets
                </div>
                <div className="text-[18px] font-bold mt-3" style={{ color: 'var(--primary)' }}>
                  {pkg.price}
                </div>
                {loading && selectedCount === pkg.count ? (
                  <div className="mt-3 flex items-center justify-center gap-2 text-[12px]" style={{ color: 'var(--primary)' }}>
                    <Loader2 size={14} className="animate-spin" />
                    Procesando...
                  </div>
                ) : (
                  <div className="mt-3 text-[12px]" style={{ color: 'var(--ink-500)' }}>
                    Click para comprar
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--primary)/5' }}>
            <div className="flex gap-3 text-[13px]">
              <Check size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ color: 'var(--ink-700)' }}>
                Cada ticket te permite convertir un recibo en factura CFDI válida
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
