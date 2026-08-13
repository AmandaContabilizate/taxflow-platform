'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface Ticket {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  xmlUrl?: string
  pdfUrl?: string
}

interface ConsultarEstadoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tickets?: Ticket[]
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: '#F59E0B',
  },
  processing: {
    label: 'Procesando',
    icon: Loader2,
    color: '#3B82F6',
  },
  completed: {
    label: 'Completado',
    icon: CheckCircle,
    color: '#10B981',
  },
  failed: {
    label: 'Error',
    icon: AlertCircle,
    color: '#EF4444',
  },
}

export function ConsultarEstadoModal({ open, onOpenChange, tickets = [] }: ConsultarEstadoModalProps) {
  const [loading, setLoading] = useState(false)

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div>
            <h2 className="text-[18px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Estado de Tickets
            </h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Monitorea la conversión de tus recibos en facturas CFDI
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg transition hover:bg-gray-100"
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tickets.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[14px]" style={{ color: 'var(--ink-500)' }}>
                No hay tickets subidos aún
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const config = STATUS_CONFIG[ticket.status]
                const IconComponent = config.icon
                const isAnimating = ticket.status === 'processing'

                return (
                  <div
                    key={ticket.id}
                    className="p-4 rounded-xl border"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {/* Top row: ID and Status */}
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-[13px] font-medium" style={{ color: 'var(--ink-900)' }}>
                          {ticket.id}
                        </div>
                        <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                          {new Date(ticket.createdAt).toLocaleString('es-MX')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <IconComponent
                          size={18}
                          style={{
                            color: config.color,
                            ...(isAnimating ? { animation: 'spin 1s linear infinite' } : {}),
                          }}
                        />
                        <span className="text-[12px] font-medium" style={{ color: config.color }}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Links if completed */}
                    {ticket.status === 'completed' && (ticket.xmlUrl || ticket.pdfUrl) && (
                      <div className="mt-3 flex gap-2">
                        {ticket.xmlUrl && (
                          <a
                            href={ticket.xmlUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] px-3 py-1 rounded-lg transition"
                            style={{
                              backgroundColor: 'var(--primary)/10',
                              color: 'var(--primary)',
                            }}
                          >
                            Descargar XML
                          </a>
                        )}
                        {ticket.pdfUrl && (
                          <a
                            href={ticket.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] px-3 py-1 rounded-lg transition"
                            style={{
                              backgroundColor: 'var(--primary)/10',
                              color: 'var(--primary)',
                            }}
                          >
                            Descargar PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
