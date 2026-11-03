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
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 550 }: ModalProps) {
  if (!isOpen || typeof document === 'undefined') return null

  // Portal a <body> y z-[90]: los sidebars (z-[80], el izquierdo con translate-x) y el toggle
  // (z-[85]) tapaban el modal en pantallas medianas. Debajo del tutorial y los toasts (z-[100]).
  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl w-full max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--background)', maxWidth }}
      >
        <div className="flex items-center justify-between p-5 border-b sticky top-0 z-10" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={20} style={{ color: 'var(--foreground)' }} />
          </button>
        </div>
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
