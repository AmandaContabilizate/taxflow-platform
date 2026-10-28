'use client'

import { Loader2, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { reactivateDeclaration } from '@/features/cancellations/actions/reactivateDeclaration.action'
import { reactivateTaxpayer } from '@/features/cancellations/actions/reactivateTaxpayer.action'
import { REACTIVATE_NOTE_MAX_LENGTH } from '@/features/cancellations/schemas/reactivate.schema'
import type { CancellationTaxpayer } from '@/features/cancellations/types'
import { Modal } from '../modal'
import {
  FieldLabel,
  Notice,
  dangerBtn,
  inputStyle,
  primaryBtnStyle,
  secondaryBtn,
  secondaryBtnStyle,
} from './parts'

export type ReactivateTarget =
  | { kind: 'declaration'; declarationId: number; label: string }
  | { kind: 'taxpayer'; taxpayer: CancellationTaxpayer }

/**
 * "Reactivar" una declaración (19 → estatus previo) o al cliente completo. La del cliente avisa
 * antes de confirmar que las credenciales se borraron y que el contador no se restaura.
 */
export function ReactivateModal({
  target,
  onClose,
  onDone,
}: {
  target: ReactivateTarget | null
  onClose: () => void
  onDone: () => void
}) {
  const [note, setNote] = useState('')
  const [reactivateDeclarations, setReactivateDeclarations] = useState(true)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  useEffect(() => {
    if (target) {
      setNote('')
      setReactivateDeclarations(true)
      setPassword('')
      setError(null)
      setDone(null)
    }
  }, [target])

  const handleConfirm = async () => {
    if (!target) return
    setLoading(true)
    setError(null)
    if (target.kind === 'declaration') {
      const res = await reactivateDeclaration({ declarationId: target.declarationId, note })
      setLoading(false)
      if (res.success) {
        setDone(`${target.label} regresó a su estatus anterior.`)
        onDone()
      } else setError(res.error.message)
    } else {
      const res = await reactivateTaxpayer({
        taxpayerId: target.taxpayer.taxpayerId,
        note,
        reactivateDeclarations,
        password,
      })
      setLoading(false)
      if (res.success) {
        setDone(
          `${target.taxpayer.legalName || target.taxpayer.rfc} está activo de nuevo` +
            (res.value.declarationsReactivated.length > 0
              ? ` y se reactivaron ${res.value.declarationsReactivated.length} ${res.value.declarationsReactivated.length === 1 ? 'declaración' : 'declaraciones'}.`
              : '.') +
            ' El cliente debe volver a cargar su CIEC/e.firma y Asignaciones debe darle contador.',
        )
        onDone()
      } else setError(res.error.message)
    }
  }

  const isTaxpayer = target?.kind === 'taxpayer'

  return (
    <Modal
      isOpen={target != null}
      onClose={() => !loading && onClose()}
      title={isTaxpayer ? 'Reactivar cliente' : 'Reactivar declaración'}
      maxWidth={560}
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <Notice kind="success">{done}</Notice>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={secondaryBtn} style={secondaryBtnStyle}>
              Cerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {target?.kind === 'declaration' && (
            <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
              <b>{target.label}</b> regresará al estatus que tenía antes de cancelarse (o a <b>En proceso</b> si
              ese estatus ya no aplica). El crédito del paquete sigue ligado: no hace falta cupo.
            </p>
          )}
          {target?.kind === 'taxpayer' && (
            <>
              <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
                <b>{target.taxpayer.legalName || target.taxpayer.rfc}</b> volverá a estar activo y su cuenta se
                desbloqueará si se había bloqueado.
              </p>
              <Notice>
                La baja borró la <b>CIEC</b>, la <b>e.firma</b> y las <b>cuentas bancarias</b>: el cliente tiene
                que volver a cargar sus credenciales (y restablecer contraseña si su cuenta se bloqueó). Hasta
                entonces los robots no lo toman.
              </Notice>
              <Notice>
                El contador <b>no</b> se restaura: queda sin asignar para que Asignaciones lo vuelva a asignar.
              </Notice>
              <label className="inline-flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--foreground)' }}>
                <input
                  type="checkbox"
                  checked={reactivateDeclarations}
                  onChange={(e) => setReactivateDeclarations(e.target.checked)}
                  disabled={loading}
                  className="accent-[var(--brand-700)]"
                />
                Reactivar también las declaraciones que se cancelaron con la baja
              </label>
              <div>
                <FieldLabel hint="(para confirmar la reactivación)">Tu contraseña</FieldLabel>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2"
                  style={inputStyle}
                />
              </div>
            </>
          )}

          <div>
            <FieldLabel hint="(opcional)">Nota para la bitácora</FieldLabel>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, REACTIVATE_NOTE_MAX_LENGTH))}
              rows={3}
              placeholder="Por qué se reactiva…"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 resize-y"
              style={inputStyle}
            />
            <div className="text-[11px] text-right mt-1" style={{ color: 'var(--ink-500)' }}>
              {note.length}/{REACTIVATE_NOTE_MAX_LENGTH}
            </div>
          </div>

          {error && <Notice kind="danger">{error}</Notice>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={loading} className={secondaryBtn} style={secondaryBtnStyle}>
              Volver
            </button>
            <button type="button" onClick={() => void handleConfirm()} disabled={loading || (isTaxpayer && password.length === 0)} className={dangerBtn} style={primaryBtnStyle}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />}
              Reactivar
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
