'use client'

import { AlertCircle, Loader2, Send, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createAssignmentRequest } from '@/features/assignments/actions/createAssignmentRequest.action'
import type { UnassignedOperation } from '@/features/assignments/types'
import { getTeamMembers } from '@/features/team/actions/getTeamMembers.action'
import { MONO } from '../constants'
import { Modal } from '../modal'

interface Props {
  operation: UnassignedOperation | null
  onClose: () => void
  onSent: () => void
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export function SolicitarAsignacionModal({ operation, onClose, onSent }: Props) {
  const [executives, setExecutives] = useState<{ userId: string; name: string }[]>([])
  const [executiveUserId, setExecutiveUserId] = useState('')
  const [reason, setReason] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!operation) return
    setExecutiveUserId('')
    setReason('')
    setEvidenceUrl('')
    setError(null)
    void (async () => {
      const res = await getTeamMembers()
      if (res.success) {
        // Solo ejecutivos activos de la plantilla (el backend valida de nuevo).
        setExecutives(
          res.value
            .filter((m) => m.isActive && m.profileTypeId === 1)
            .map((m) => ({ userId: m.userId, name: m.fullName })),
        )
      }
    })()
  }, [operation])

  if (!operation) return null

  const canSubmit = executiveUserId !== '' && reason.trim().length >= 10

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const res = await createAssignmentRequest({
      operationId: operation.operationId,
      proposedExecutiveUserId: executiveUserId,
      reason: reason.trim(),
      evidenceUrl: evidenceUrl.trim() || undefined,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    onSent()
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title="Solicitar asignación de venta">
      <div className="flex flex-col gap-4">
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          La solicitud será revisada por Administración antes de aplicarse.
        </p>

        {error && (
          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--hero-coral-soft-bg, #FEE2E2)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Card del cliente (solo lectura) */}
        <div className="rounded-xl p-4" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}>
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider mb-1" style={{ color: 'var(--ink-400)' }}>
            Cliente
          </div>
          <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
            {operation.clientName ?? operation.rfc}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            <code style={{ ...MONO, fontSize: '12px' }}>{operation.rfc}</code>
            {operation.clientEmail && <> · {operation.clientEmail}</>}
          </div>
          <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-600)' }}>
            {operation.operationType} · {operation.products || 'Sin productos'}
          </div>
        </div>

        {/* Asignación actual / Reasignar a */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Asignación actual
            </label>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13.5px]"
              style={{ border: '1px solid var(--border)', color: '#9E3A15' }}
            >
              <AlertCircle size={15} /> Sin asignar
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
              Reasignar a <span style={{ color: '#9E3A15' }}>*</span>
            </label>
            <select
              value={executiveUserId}
              onChange={(e) => setExecutiveUserId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-[13.5px] outline-none cursor-pointer"
              style={inputStyle}
              disabled={loading}
            >
              <option value="">Buscar ejecutivo…</option>
              {executives.map((ex) => (
                <option key={ex.userId} value={ex.userId}>{ex.name}</option>
              ))}
            </select>
            <p className="text-[11px] mt-1 flex items-center gap-1" style={{ color: 'var(--ink-400)' }}>
              <Users size={11} /> {executives.length} ejecutivo{executives.length === 1 ? '' : 's'} disponible{executives.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {/* Motivo */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Motivo / justificación <span style={{ color: '#9E3A15' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej. Cliente confirmó que Ana le contactó el día 1. Cotización trabajada por ella en CRM."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg text-[13.5px] outline-none focus:ring-2 resize-y"
            style={inputStyle}
            disabled={loading}
          />
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
            Mínimo 10 caracteres. Sé específico — esto lo lee Administración.
          </p>
        </div>

        {/* Evidencia */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Evidencia <span className="font-normal" style={{ color: 'var(--ink-400)' }}>(URL opcional)</span>
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://drive.contabilizate.mx/…"
            className="w-full px-3 py-2.5 rounded-lg text-[13.5px] outline-none focus:ring-2"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] transition cursor-pointer"
            style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong, var(--border))' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Enviar solicitud
          </button>
        </div>
      </div>
    </Modal>
  )
}
