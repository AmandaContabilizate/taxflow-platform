'use client'

import { useState, useEffect, useRef } from 'react'
import { Upload, TrendingUp, Loader2 } from 'lucide-react'
import {
  RegistroEmpresaModal,
  SubirTicketModal,
  CompraTicketsModal,
  ConsultarEstadoModal,
} from '@/features/george/components'
import { getQuota } from '@/features/george/actions/getQuota.action'
import { autoRegisterCompanyFromTaxCertificate } from '@/features/george/actions/autoRegisterCompany.action'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { GoFn } from '../types'

interface Ticket {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: string
  xmlUrl?: string
  pdfUrl?: string
}

interface GeorgeScreenProps {
  go: GoFn
}

export function GeorgeScreen({ go }: GeorgeScreenProps) {
  const { selectedRfc: rfc } = useRfcStore()

  const [registroOpen, setRegistroOpen] = useState(false)
  const [subirOpen, setSubirOpen] = useState(false)
  const [compraOpen, setCompraOpen] = useState(false)
  const [estadoOpen, setEstadoOpen] = useState(false)

  const [quota, setQuota] = useState<{
    id: string
    userEmail: string
    freeTicketsUsed: number
    freeTicketsAvailable: number
    paidTicketsBalance: number
    totalTicketsPurchased: number
    createdAt: string
  } | null>(null)

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notRegistered, setNotRegistered] = useState(false)
  const [autoRegistering, setAutoRegistering] = useState(false)
  const autoRegisterAttemptedRef = useRef(false)

  const loadQuota = async () => {
    setLoading(true)
    setError(null)
    setNotRegistered(false)

    try {
      const result = await getQuota()
      if (!result.success) {
        if (result.error.statusCode === 404) {
          setNotRegistered(true)
          setQuota(null)
        } else {
          setError(result.error.message)
          setQuota(null)
        }
      } else {
        setQuota(result.value)
        setNotRegistered(false)
      }
    } catch (e) {
      setError('Error al cargar tu cuota')
    } finally {
      setLoading(false)
    }
  }

  const autoRegisterCompanyAsync = async (userRfc: string | null) => {
    if (!userRfc) return

    setAutoRegistering(true)
    setError(null)

    try {
      const result = await autoRegisterCompanyFromTaxCertificate(userRfc)

      if (!result.success) {
        setError(result.error.message)
        return
      }

      // Success - reload quota and open upload modal
      await loadQuota()
      setSubirOpen(true)
    } catch (e) {
      console.error('[autoRegisterCompanyAsync] Error:', e)
      setError('Error al registrar tu empresa automáticamente')
    } finally {
      setAutoRegistering(false)
    }
  }

  useEffect(() => {
    loadQuota()
  }, [])

  // Auto-register company on mount if not registered and RFC is available
  useEffect(() => {
    if (notRegistered && rfc && !autoRegistering && !autoRegisterAttemptedRef.current) {
      autoRegisterAttemptedRef.current = true
      void autoRegisterCompanyAsync(rfc)
    }
  }, [notRegistered, rfc])

  const totalAvailableTickets = (quota?.freeTicketsAvailable ?? 0) + (quota?.paidTicketsBalance ?? 0)
  const canUpload = totalAvailableTickets > 0

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl text-[13px]" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Cargando tu información...
          </div>
        </div>
      )}

      {/* Not Registered State */}
      {!loading && notRegistered && (
        <div className="p-8 rounded-2xl border-2 border-dashed text-center" style={{ borderColor: 'var(--primary)' }}>
          <div className="text-[16px] font-bold mb-2" style={{ color: 'var(--ink-900)' }}>
            Necesitas registrar tu empresa primero
          </div>
          <p className="text-[14px] mb-6" style={{ color: 'var(--ink-500)' }}>
            Proporciona los datos de tu empresa y tu API key de George para comenzar
          </p>
          <button
            onClick={() => setRegistroOpen(true)}
            className="px-6 py-3 rounded-lg font-medium text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            Registrar Empresa
          </button>
        </div>
      )}

      {/* Main Content */}
      {!loading && !notRegistered && quota && (
        <>
          {/* Quota Card */}
          <div
            className="p-6 rounded-2xl border"
            style={{
              borderColor: 'var(--border)',
              background: 'linear-gradient(135deg, var(--primary)/5, var(--primary)/2)',
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Tickets */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ink-400)' }}>
                  Tickets Gratis
                </div>
                <div className="mt-2">
                  <div className="text-[28px] font-bold" style={{ color: 'var(--primary)' }}>
                    {quota.freeTicketsAvailable}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                    {quota.freeTicketsUsed} de 3 usados
                  </div>
                </div>
              </div>

              {/* Paid Tickets */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ink-400)' }}>
                  Tickets Pagos
                </div>
                <div className="mt-2">
                  <div className="text-[28px] font-bold" style={{ color: '#10B981' }}>
                    {quota.paidTicketsBalance}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                    {quota.totalTicketsPurchased} comprados
                  </div>
                </div>
              </div>

              {/* Total Available */}
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ink-400)' }}>
                  Disponibles
                </div>
                <div className="mt-2">
                  <div className="text-[28px] font-bold" style={{ color: 'var(--ink-900)' }}>
                    {totalAvailableTickets}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                    Listos para usar
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Upload Ticket Button */}
            <button
              onClick={() => setSubirOpen(true)}
              disabled={!canUpload}
              className="p-6 rounded-xl border-2 transition text-left"
              style={{
                borderColor: canUpload ? 'var(--primary)' : 'var(--border)',
                background: canUpload ? 'var(--primary)/5' : 'var(--ink-50)',
                cursor: canUpload ? 'pointer' : 'not-allowed',
                opacity: canUpload ? 1 : 0.6,
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: canUpload ? 'var(--primary)' : 'var(--border)',
                    color: canUpload ? 'white' : 'var(--ink-400)',
                  }}
                >
                  <Upload size={20} />
                </div>
                <div>
                  <div className="font-bold text-[14px]" style={{ color: 'var(--ink-900)' }}>
                    Subir Recibo
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                    {canUpload ? 'Tienes tickets disponibles' : 'Sin tickets disponibles'}
                  </div>
                </div>
              </div>
            </button>

            {/* Buy Tickets Button */}
            <button
              onClick={() => setCompraOpen(true)}
              className="p-6 rounded-xl border-2 transition text-left"
              style={{
                borderColor: 'var(--primary)',
                background: 'var(--primary)/5',
                cursor: 'pointer',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'var(--primary)',
                    color: 'white',
                  }}
                >
                  <TrendingUp size={20} />
                </div>
                <div>
                  <div className="font-bold text-[14px]" style={{ color: 'var(--ink-900)' }}>
                    Comprar Tickets
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--ink-500)' }}>
                    Paquetes desde 10 tickets
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Check Status Button */}
          <button
            onClick={() => setEstadoOpen(true)}
            className="w-full p-4 rounded-xl border text-center transition"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--ink-50)',
              color: 'var(--ink-700)',
              cursor: 'pointer',
            }}
          >
            Consultar Estado de Tickets
          </button>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--ink-50)' }}>
              <div className="text-[12px] font-bold" style={{ color: 'var(--ink-900)' }}>
                ✓ Proceso Automático
              </div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--ink-600)' }}>
                George convierte tu recibo en factura CFDI en segundos
              </div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--ink-50)' }}>
              <div className="text-[12px] font-bold" style={{ color: 'var(--ink-900)' }}>
                ✓ Válido ante SAT
              </div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--ink-600)' }}>
                Las facturas generadas son 100% válidas ante el SAT
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <RegistroEmpresaModal
        open={registroOpen}
        onOpenChange={setRegistroOpen}
        onSuccess={() => loadQuota()}
      />
      <SubirTicketModal
        open={subirOpen}
        onOpenChange={setSubirOpen}
        onSuccess={() => {
          loadQuota()
          setEstadoOpen(true)
        }}
      />
      <CompraTicketsModal
        open={compraOpen}
        onOpenChange={setCompraOpen}
        onSuccess={() => loadQuota()}
      />
      <ConsultarEstadoModal
        open={estadoOpen}
        onOpenChange={setEstadoOpen}
        tickets={tickets}
      />
    </div>
  )
}
