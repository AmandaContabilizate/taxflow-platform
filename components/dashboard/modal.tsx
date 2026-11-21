'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Ancho máximo del panel. Por defecto 550px. */
  maxWidth?: number
  /** Línea pequeña debajo del título (contexto: qué se edita, de quién). */
  subtitle?: ReactNode
  /** Acciones fijas al pie: siempre visibles aunque el contenido haga scroll. */
  footer?: ReactNode
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 550, subtitle, footer }: ModalProps) {
  if (!isOpen || typeof document === 'undefined') return null

  // Portal a <body> y z-[90]: los sidebars (z-[80], el izquierdo con translate-x) y el toggle
  // (z-[85]) tapaban el modal en pantallas medianas. Debajo del tutorial y los toasts (z-[100]).
  // Entrada: el panel escala desde 0.985 con opacidad (clase ui-modal-panel), el fondo se funde.
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="ui-modal-overlay fixed inset-0 bg-black/50" />
      <div
        className="ui-modal-panel relative rounded-2xl shadow-2xl w-full max-h-[90dvh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--background)', maxWidth }}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <h2 className="text-lg font-bold leading-tight truncate" style={{ color: 'var(--foreground)' }}>
              {title}
            </h2>
            {subtitle && (
              <div className="mt-0.5 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-press shrink-0 p-1.5 rounded-lg hover:bg-[var(--ink-50)]"
            aria-label="Cerrar"
          >
            <X size={18} style={{ color: 'var(--foreground)' }} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto min-h-0 flex-1">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3.5 border-t shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
