'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative bg-white dark:bg-slate-950 rounded-2xl shadow-2xl max-w-[550px] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--background)' }}
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
    </div>
  )
}
