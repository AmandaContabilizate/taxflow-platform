'use client'

import { Ban, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { cancelDeclarations } from '@/features/cancellations/actions/cancelDeclarations.action'
import { useCancellationReasons } from '@/features/cancellations/hooks/useCancellationQueries'
import { CANCEL_NOTE_MAX_LENGTH } from '@/features/cancellations/schemas/cancelDeclarations.schema'
import {
  CANCELLATION_REASON_OTHER,
  type CancelDeclarationsResult,
  type CancellationDeclaration,
  DECLARATION_STATUSES_WORKED,
  DECLARATION_STATUS_LEGACY,
} from '@/features/cancellations/types'
import { getErrorMessage, hasErrorCode } from '@/lib/api/errorMessages'
import { declarationStatusBadge } from '../declaraciones/parts'
import { Modal } from '../modal'
import { Badge } from '../ui'
import { selectStyle } from '../operaciones/purchased-declarations'
import {
  FieldLabel,
  Notice,
  dangerBtn,
  dangerBtnStyle,
  declarationPeriodLabel,
  inputStyle,
  secondaryBtn,
  secondaryBtnStyle,
} from './parts'

/**
 * "Cancelar seleccionadas": motivo del catálogo + nota (obligatoria con Otro) + avisos fijos. El
 * resultado es parcial y se muestra inline: N canceladas, M rechazadas con su error.
 */
export function CancelDeclarationsModal({
  open,
  declarations,
  onClose,
  onDone,
}: {
  open: boolean
  declarations: CancellationDeclaration[]
  onClose: () => void
  /** Ya escribió el back (aunque sea parcial): el padre refresca la lista. */
  onDone: () => void
}) {
  const reasons = useCancellationReasons()
  const [reasonId, setReasonId] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CancelDeclarationsResult | null>(null)

  useEffect(() => {
    if (open) {
      setError(null)
      setResult(null)
    }
  }, [open])

  const reason = reasons.data?.find((r) => r.id === reasonId) ?? null
  const noteRequired = reason ? reason.requiresNote : reasonId === CANCELLATION_REASON_OTHER
  const ready = reasonId != null && (!noteRequired || note.trim().length > 0) && declarations.length > 0

  const worked = useMemo(() => declarations.filter((d) => DECLARATION_STATUSES_WORKED.has(d.statusId)), [declarations])
  const legacy = useMemo(() => declarations.filter((d) => d.statusId === DECLARATION_STATUS_LEGACY), [declarations])
  const byId = useMemo(() => new Map(declarations.map((d) => [d.declarationId, d])), [declarations])

  const handleConfirm = async () => {
    if (reasonId == null) return
    setLoading(true)
    setError(null)
    const res = await cancelDeclarations({
      declarationIds: declarations.map((d) => d.declarationId),
      reasonId,
      note,
    })
    setLoading(false)
    if (res.success) {
      setResult(res.value)
      setNote('')
      setReasonId(null)
      onDone()
    } else {
      setError(res.error.message)
    }
  }

  const label = (id: number) => {
    const d = byId.get(id)
    return d ? `${declarationPeriodLabel(d.fiscalYear, d.periodValueId, d.complementNumber)} · ${d.regimeSatCode ?? ''}` : `#${id}`
  }

  return (
    <Modal isOpen={open} onClose={() => !loading && onClose()} title="Cancelar declaraciones" maxWidth={620}>
      {result ? (
        <div className="flex flex-col gap-4">
          <Notice kind={result.cancelled.length > 0 ? 'success' : 'danger'}>
            {result.cancelled.length} {result.cancelled.length === 1 ? 'cancelada' : 'canceladas'}
            {result.rejected.length > 0 && `, ${result.rejected.length} ${result.rejected.length === 1 ? 'rechazada' : 'rechazadas'}`}.
          </Notice>
          {result.rejected.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
              {result.rejected.map((r) => (
                <li key={r.declarationId} className="rounded-lg px-3 py-2" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                  <b style={{ color: 'var(--ink-900)' }}>{label(r.declarationId)}</b>
                  <div style={{ color: 'var(--ink-500)' }}>
                    {hasErrorCode(r.errorCode) ? getErrorMessage(r.errorCode) : r.message || r.errorCode}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={secondaryBtn} style={secondaryBtnStyle}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl text-[12.5px] max-h-44 overflow-y-auto"
            style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}
          >
            {declarations.map((d) => {
              const badge = declarationStatusBadge(d.statusCode, d.statusLabel)
              return (
                <div
                  key={d.declarationId}
                  className="px-3 py-2 flex items-center justify-between gap-2"
                  style={{ borderBottom: '1px solid var(--border)', color: 'var(--ink-900)' }}
                >
                  <span className="font-semibold">
                    {declarationPeriodLabel(d.fiscalYear, d.periodValueId, d.complementNumber)}
                    <span className="font-normal" style={{ color: 'var(--ink-500)' }}> · {d.regimeSatCode ?? '—'}</span>
                  </span>
                  <Badge kind={badge.kind}>{badge.label}</Badge>
                </div>
              )
            })}
          </div>

          <Notice kind="danger">
            El crédito del paquete <b>se pierde</b>; no se devuelve al saldo del cliente. Si gerencia reembolsa,
            se hace fuera del sistema y se anota aquí.
          </Notice>
          {worked.length > 0 && (
            <Notice>
              El contador ya trabajó {worked.length === 1 ? 'esta declaración' : `${worked.length} de estas declaraciones`}{' '}
              (por autorizar, rechazada o por presentar): ese trabajo se pierde. No hay nada presentado ante el SAT.
            </Notice>
          )}
          {legacy.length > 0 && (
            <Notice>
              {legacy.length === 1 ? 'Una declaración se gestiona' : `${legacy.length} declaraciones se gestionan`} en
              Contabox Legacy: cancelar aquí <b>no</b> la cancela allá.
            </Notice>
          )}

          <div>
            <FieldLabel>Motivo (obligatorio)</FieldLabel>
            <select
              value={reasonId ?? ''}
              onChange={(e) => setReasonId(e.target.value ? Number(e.target.value) : null)}
              disabled={loading || reasons.isPending}
              className="w-full px-3 py-2.5 rounded-lg text-[13px]"
              style={selectStyle}
            >
              <option value="">{reasons.isPending ? 'Cargando motivos…' : 'Elige un motivo'}</option>
              {reasons.data?.map((r) => (
                <option key={r.id} value={r.id}>{r.description}</option>
              ))}
            </select>
            {reasons.isError && (
              <div className="text-[12px] mt-1" style={{ color: 'var(--danger)' }}>{reasons.error.message}</div>
            )}
          </div>

          <div>
            <FieldLabel hint={noteRequired ? '(obligatoria con este motivo)' : '(opcional)'}>Nota para la bitácora</FieldLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, CANCEL_NOTE_MAX_LENGTH))}
              rows={3}
              placeholder="Quién lo pidió, ticket, reembolso acordado…"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 resize-y"
              style={inputStyle}
            />
            <div className="text-[11px] text-right mt-1" style={{ color: 'var(--ink-500)' }}>
              {note.length}/{CANCEL_NOTE_MAX_LENGTH}
            </div>
          </div>

          {error && <Notice kind="danger">{error}</Notice>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn} style={secondaryBtnStyle}>
              Volver
            </button>
            <button type="button" onClick={() => void handleConfirm()} disabled={loading || !ready} className={dangerBtn} style={dangerBtnStyle}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />}
              Cancelar {declarations.length} {declarations.length === 1 ? 'declaración' : 'declaraciones'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
