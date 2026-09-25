/**
 * Estilos compartidos de /pago entre la página (servidor) y la vista de Stripe (cliente). Viven aquí
 * y no en pago-view.tsx porque un servidor no puede leer constantes de un módulo 'use client'.
 */

/** Entrada de la tarjeta: ease-out fuerte, corta, y nada si el usuario pide menos movimiento. */
export const ENTRADA = 'animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none'

export const EASE_OUT = { animationTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' } as const

/** Sombra en dos capas, teñida del morado de la marca en vez de gris puro. */
export const TARJETA = {
  background: 'var(--card)',
  border: '1px solid var(--border)',
  boxShadow: '0 1px 2px rgba(34,17,88,0.04), 0 12px 32px -8px rgba(34,17,88,0.14)',
} as const
