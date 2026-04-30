'use client'

import { useState } from 'react'
import { startCheckoutSession } from '@/app/actions/stripe'

interface Props {
  productId: string
  label?: string
  className?: string
  style?: React.CSSProperties
}

// Uses Stripe hosted checkout (redirect) — works in all environments including iframes/preview
export function Checkout({ productId, label = 'Elegir plan', className, style }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const url = await startCheckoutSession(productId)
      window.location.href = url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al iniciar el pago')
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <p className="text-xs font-semibold mb-2 text-center" style={{ color: 'var(--destructive)' }}>
          {error}
        </p>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={style}
      >
        {loading ? 'Redirigiendo...' : label}
      </button>
    </div>
  )
}
