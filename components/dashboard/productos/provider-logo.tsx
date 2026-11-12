'use client'

import { useEffect, useState } from 'react'
import { PROVIDER_LOGOS, providerLabel } from '@/features/productos/types'

interface Props {
  /** Logo propio del producto (data URL o https). Si viene, gana sobre el del proveedor. */
  src?: string | null
  providerKey?: string | null
  /** Texto alterno cuando no hay proveedor (p. ej. el nombre del producto). */
  label?: string
  /** Lado en px. */
  size?: number
  className?: string
}

/**
 * Logo de un producto: el subido desde el backoffice, si no el del proveedor del servicio
 * (public/logos/providers/{key}.png), y si tampoco existe, las iniciales en un círculo de color.
 */
export function ProviderLogo({ src, providerKey, label, size = 22, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const resolved = src || (providerKey ? PROVIDER_LOGOS[providerKey] : undefined)
  const text = label ?? providerLabel(providerKey ?? null)

  // Si cambia la imagen (p. ej. el usuario sube otra), vuelve a intentar.
  useEffect(() => {
    setFailed(false)
  }, [resolved])

  if (!resolved || failed) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full font-black select-none ${className}`}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.42), background: 'var(--coral-soft)', color: 'var(--coral)' }}
        aria-label={text}
        title={text}
      >
        {(text || '?').replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase() || '?'}
      </span>
    )
  }

  return (
    // biome-ignore lint/performance/noImgElement: logos pequeños (archivo local o data URL), sin optimización de Next.
    <img
      src={resolved}
      alt={text}
      title={text}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`inline-block rounded-md object-contain bg-white ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
