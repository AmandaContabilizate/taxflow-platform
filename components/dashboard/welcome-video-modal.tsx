'use client'

import { X } from 'lucide-react'
import dynamic from 'next/dynamic'

const RemotionPlayer = dynamic(() => import('@/components/video/player').then(mod => mod.RemotionPlayer), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white text-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[14px]">Cargando video...</p>
      </div>
    </div>
  ),
})

interface WelcomeVideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WelcomeVideoModal({ open, onOpenChange }: WelcomeVideoModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Bienvenida: ¿qué hacemos por ti?
            </h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Conoce las principales funciones de Contabilízate
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg transition hover:bg-gray-100"
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Video Container */}
        <div className="relative bg-black flex items-center justify-center" style={{ minHeight: '800px' }}>
          <div style={{ width: '100%', height: '100%' }}>
            <RemotionPlayer />
          </div>
        </div>
      </div>
    </div>
  )
}
