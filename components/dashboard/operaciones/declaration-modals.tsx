'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { memo, useEffect, useState } from 'react'
import { DECLARATION_STATUS } from '@/features/declaration-report/types'
import { useDeclarationReportLink } from '@/features/declarations/hooks/useDeclarationQueries'
import { reopenDeclaration } from '@/features/operations/actions/reopenDeclaration.action'
import { resendDeclarationToClient } from '@/features/operations/actions/resendDeclarationToClient.action'
import {
  REOPEN_COMPLEMENTARY_REASON,
  REOPEN_REASON_MAX_LENGTH,
  type ReopenComplementaryReasonId,
} from '@/features/operations/schemas/reopenDeclaration.schema'
import type { ReopenDeclarationResult } from '@/features/operations/types'
import { Modal } from '../modal'

/**
 * Modales de "Reabrir declaración" y "Enviar Predeclaración". Antes sus textareas
 * eran estado del detalle y cada tecla re-renderizaba la pantalla completa con la
 * pestaña montada; aquí el borrador vive en el modal. Los dos se quedan montados
 * (el `Modal` pinta null cuando está cerrado) para que el borrador sobreviva a un
 * "Cancelar", igual que antes.
 */

export type ResendMessage = { kind: 'success' | 'warning' | 'error'; text: string }

/* -------------------------------------------------------------------------- */
/*  "Reabrir declaración"                                                     */
/* -------------------------------------------------------------------------- */

interface ReopenModalProps {
  open: boolean
  onClose: () => void
  declarationId: number
  legalName: string
  periodo: string
  ejercicio: number
  /** Estaba Presentada: se crea su complementaria y se exige de quién es el error. */
  fromSubmitted: boolean
  /** Reabierta con éxito: el padre cierra el modal y abre la complementaria o muestra el aviso y refresca. */
  onReopened: (result: ReopenDeclarationResult) => void
}

export const ReopenModal = memo(function ReopenModal({
  open,
  onClose,
  declarationId,
  legalName,
  periodo,
  ejercicio,
  fromSubmitted,
  onReopened,
}: ReopenModalProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Solo al reabrir una Presentada: de quién es el error que obliga a la complementaria.
  const [complementReason, setComplementReason] = useState<ReopenComplementaryReasonId | null>(null)

  const ready = reason.trim().length > 0 && (!fromSubmitted || complementReason != null)

  // Al abrir se limpia el error del intento anterior (el motivo se conserva).
  useEffect(() => {
    if (open) setError(null)
  }, [open])

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    const res = await reopenDeclaration(
      declarationId,
      reason,
      fromSubmitted ? (complementReason ?? undefined) : undefined,
    )
    setLoading(false)
    if (res.success) {
      setReason('')
      setComplementReason(null)
      onReopened(res.value)
    } else {
      // El catálogo de errores trae textos pensados para el cliente: aquí se le habla al contador.
      setError(
        res.error.code === 'INVALID_STATUS_TRANSITION'
          ? fromSubmitted
            ? 'Ya existe una complementaria más reciente de este periodo; reabre esa.'
            : 'Solo se puede reabrir una declaración Presentada, Por autorizar o Por presentar.'
          : res.error.code === 'SALE_NOT_PAID'
            ? 'El periodo no tiene una venta pagada ligada; no se puede reabrir como complementaria.'
            : res.error.message,
      )
    }
  }

  return (
    <Modal isOpen={open} onClose={() => !loading && onClose()} title="Reabrir declaración" maxWidth={560}>
      <div className="flex flex-col gap-4">
        {fromSubmitted ? (
          <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
            Se creará la <strong>complementaria</strong> de <strong>{legalName}</strong> ({periodo} {ejercicio})
            en estatus <strong>En proceso</strong> para que la corrijas. La declaración original se conserva
            presentada, con su acuse y línea de captura.
          </p>
        ) : (
          <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
            La declaración de <strong>{legalName}</strong> ({periodo} {ejercicio}) regresará a tus manos
            en estatus <strong>Reabierta</strong> para que la corrijas. Después podrás reenviarla al cliente.
          </p>
        )}
        {fromSubmitted && (
          <div
            className="rounded-xl px-3.5 py-3 flex items-start gap-2 text-[12.5px] font-semibold"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--hero-amber-border, var(--border))' }}
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>
              Esta declaración ya se presentó ante el SAT: la corrección se presentará como complementaria.
            </span>
          </div>
        )}
        {fromSubmitted && (
          <fieldset>
            <legend className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
              ¿De quién es el error? (obligatorio)
            </legend>
            <div className="flex flex-col gap-1.5 mt-1.5">
              {[
                { id: REOPEN_COMPLEMENTARY_REASON.OWN_ERROR, label: 'Error nuestro (Contabilízate)' },
                { id: REOPEN_COMPLEMENTARY_REASON.TAXPAYER_ERROR, label: 'Error atribuible al contribuyente' },
              ].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--foreground)' }}>
                  <input
                    type="radio"
                    name="reopen-complement-reason"
                    checked={complementReason === opt.id}
                    onChange={() => setComplementReason(opt.id)}
                    disabled={loading}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
            Motivo de la reapertura (obligatorio, no lo ve el cliente)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, REOPEN_REASON_MAX_LENGTH))}
            rows={4}
            placeholder="Qué hay que corregir y por qué…"
            className="w-full mt-1.5 px-3 py-2 rounded-lg text-[13px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <div className="text-[11px] text-right mt-1" style={{ color: 'var(--ink-500)' }}>
            {reason.length}/{REOPEN_REASON_MAX_LENGTH}
          </div>
        </div>
        {error && (
          <div
            className="rounded-xl px-3.5 py-3 flex items-start gap-2 text-[12.5px] font-semibold"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            Cancelar
          </button>
          <button
            onClick={() => void handleConfirm()}
            disabled={loading || !ready}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Reabrir
          </button>
        </div>
      </div>
    </Modal>
  )
})

/* -------------------------------------------------------------------------- */
/*  "Enviar Predeclaración"                                                    */
/* -------------------------------------------------------------------------- */

interface ResendModalProps {
  open: boolean
  onClose: () => void
  declarationId: number
  legalName: string
  /** `statusId` actual de /general; decide el texto de INVALID_STATUS_TRANSITION. */
  statusId: number | null
  /**
   * Sube cada vez que el back escribió en la declaración: el iframe de la vista
   * previa se recarga para que el contador vea las cifras nuevas, sin volver a pedir
   * `report-link` (el token es determinista).
   */
  previewVersion: number
  /**
   * Resultado del envío. El padre cierra el modal, pinta el aviso y, si `refresh`,
   * recarga la declaración (éxito, o `CALCULATION_CHANGED`: el back ya escribió).
   */
  onDone: (message: ResendMessage, opts: { refresh: boolean }) => void
}

export const ResendModal = memo(function ResendModal({
  open,
  onClose,
  declarationId,
  legalName,
  statusId,
  previewVersion,
  onDone,
}: ResendModalProps) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  // La vista previa es el mismo `/reporte` del cliente en modo solo lectura. El
  // `url` que devuelve el back apunta al FrontendUrl configurado y no trae
  // `preview`, por eso se arma local con el token. Se pide una sola vez por
  // declaración (staleTime infinito); un fallo sí se reintenta en la siguiente apertura.
  const link = useDeclarationReportLink(declarationId, open)
  const previewLoading = link.isPending
  const previewUrl = link.data?.token ? `/reporte?t=${encodeURIComponent(link.data.token)}&preview=1` : null
  const previewFailed = link.isError || (link.isSuccess && !previewUrl)

  const handleConfirm = async () => {
    setLoading(true)
    const res = await resendDeclarationToClient(declarationId, note.trim() || undefined)
    setLoading(false)
    if (res.success) {
      setNote('')
      onDone(
        res.value.emailSent
          ? { kind: 'success', text: 'Correo enviado al cliente, declaración en revisión.' }
          : { kind: 'warning', text: 'Estatus actualizado pero el correo falló; reintenta.' },
        { refresh: true },
      )
    } else if (res.error.code === 'CALCULATION_CHANGED') {
      // Llegaron comprobantes después del último cálculo y al recalcular cambiaron las cifras: el
      // back no envió. El texto trae qué cambió; se refresca para que el contador vea lo nuevo y,
      // ya revisado, vuelva a darle a Enviar (el cálculo ya está al día y pasa).
      onDone({ kind: 'warning', text: res.error.message }, { refresh: true })
    } else {
      // El catálogo de errores trae textos pensados para el cliente: aquí se le habla al contador.
      const presentada = statusId === DECLARATION_STATUS.SUBMITTED
      const text =
        res.error.code === 'INVALID_STATUS_TRANSITION'
          ? presentada
            ? 'Esta declaración ya está presentada. Reábrela para poder corregirla y reenviarla al cliente.'
            : 'Con su estatus actual esta declaración no se puede reenviar al cliente.'
          : res.error.message
      onDone({ kind: 'error', text }, { refresh: false })
    }
  }

  return (
    <Modal isOpen={open} onClose={() => !loading && onClose()} title="Enviar Predeclaración" maxWidth={980}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
            Se reenviará la declaración corregida a <strong>{legalName}</strong> para que la vuelva
            a revisar. No presenta nada ante el SAT.
          </p>
          <div>
            <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
              Mensaje del reenvío (opcional, no lo ve el cliente)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Qué corregiste. Queda en el historial y en tu correo de confirmación…"
              className="w-full mt-1.5 px-3 py-2 rounded-lg text-[13px]"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <div className="text-[11px] text-right mt-1" style={{ color: 'var(--ink-500)' }}>
              {note.length}/500
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleConfirm()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {/* Si llegaron comprobantes después del último cálculo, el back recalcula antes de enviar. */}
              {loading ? 'Revisando cálculo y enviando…' : 'Confirmar envío'}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
            Lo que verá el cliente
          </div>
          <div
            className="rounded-xl overflow-hidden h-[460px]"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            {previewLoading && (
              <div
                className="h-full flex items-center justify-center gap-2 text-[13px]"
                style={{ color: 'var(--ink-500)' }}
              >
                <Loader2 size={16} className="animate-spin" /> Cargando vista previa…
              </div>
            )}
            {!previewLoading && previewFailed && (
              <div
                className="h-full flex items-center justify-center px-5 text-center text-[13px]"
                style={{ color: 'var(--ink-500)' }}
              >
                No pudimos cargar la vista previa. Puedes enviar la predeclaración de todos modos.
              </div>
            )}
            {!previewLoading && previewUrl && (
              <iframe
                key={previewVersion}
                src={previewUrl}
                title="Vista previa del reporte del cliente"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
})
