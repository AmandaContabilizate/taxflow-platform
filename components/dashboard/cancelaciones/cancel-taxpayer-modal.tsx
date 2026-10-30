'use client'

import { Loader2, UserX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { deactivateTaxpayer } from '@/features/cancellations/actions/deactivateTaxpayer.action'
import { useDeactivationPreview } from '@/features/cancellations/hooks/useCancellationQueries'
import {
  DEACTIVATION_NOTE_MAX_LENGTH,
  DEACTIVATION_REFERENCE_MAX_LENGTH,
} from '@/features/cancellations/schemas/cancelTaxpayer.schema'
import { type CancellationTaxpayer, DEACTIVATION_REASON_COMMERCIAL } from '@/features/cancellations/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import {
  FieldLabel,
  Notice,
  dangerBtn,
  dangerBtnStyle,
  inputStyle,
  primaryBtnStyle,
  secondaryBtn,
  secondaryBtnStyle,
} from './parts'

/**
 * "Cancelar cliente" en dos pasos: (a) preview de lo que se va a tocar y lo que bloquea; (b)
 * confirmación con RFC reescrito, motivo, nota, folio y contraseña del gerente. La contraseña
 * vive solo en el estado de este modal y se borra al cerrar.
 */
export function CancelTaxpayerModal({
  open,
  taxpayer,
  onClose,
  onDone,
}: {
  open: boolean
  taxpayer: CancellationTaxpayer
  onClose: () => void
  onDone: () => void
}) {
  const preview = useDeactivationPreview(taxpayer.taxpayerId, open)
  const [step, setStep] = useState<'preview' | 'confirm' | 'done'>('preview')
  const [confirmRfc, setConfirmRfc] = useState('')
  const [reasonNote, setReasonNote] = useState('')
  const [requestReference, setRequestReference] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    if (!open) {
      setStep('preview')
      setConfirmRfc('')
      setReasonNote('')
      setRequestReference('')
      setPassword('')
      setError(null)
      setWarnings([])
    }
  }, [open])

  const p = preview.data
  const inFlight = (p?.declarationsInFlight?.length ?? 0) > 0 || p?.hasDeclarationInFlight === true
  const rfcOk = confirmRfc.trim().toUpperCase() === taxpayer.rfc.toUpperCase()
  const ready = rfcOk && requestReference.trim().length > 0 && password.length > 0 && !inFlight

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    const res = await deactivateTaxpayer({
      taxpayerId: taxpayer.taxpayerId,
      rfc: taxpayer.rfc,
      confirmRfc,
      reasonId: DEACTIVATION_REASON_COMMERCIAL,
      reasonNote,
      requestReference,
      password,
      cancelOpenDeclarations: true,
      cancelSubscription: true,
    })
    setLoading(false)
    setPassword('')
    if (res.success) {
      setWarnings(res.value.warnings ?? [])
      setStep('done')
      onDone()
    } else {
      setError(res.error.message)
    }
  }

  return (
    <Modal isOpen={open} onClose={() => !loading && onClose()} title="Cancelar cliente" maxWidth={620}>
      {step === 'done' ? (
        <div className="flex flex-col gap-4">
          <Notice kind="success">
            <b>{taxpayer.legalName || taxpayer.rfc}</b> quedó cancelado. Se eliminaron sus credenciales SAT y
            cuentas bancarias, se desasignó al contador y sus declaraciones abiertas pasaron a Cancelada.
          </Notice>
          {warnings.map((w, i) => (
            <Notice key={i}>{w}</Notice>
          ))}
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={secondaryBtn} style={secondaryBtnStyle}>
              Cerrar
            </button>
          </div>
        </div>
      ) : step === 'preview' ? (
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
            Baja lógica de <b>{taxpayer.legalName || taxpayer.rfc}</b>{' '}
            <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-700)' }}>{taxpayer.rfc}</code>. Nada se
            borra de las ventas ni de las declaraciones; se marcan y quedan en bitácora.
          </p>

          <Notice kind="danger">
            Se eliminarán la <b>CIEC</b>, la <b>e.firma</b> y las <b>cuentas bancarias</b> del RFC; si se
            reactiva, el cliente tendrá que cargarlas de nuevo. Si este es su único RFC, su acceso a la app
            queda bloqueado hasta reactivarlo.
          </Notice>

          {preview.isPending ? (
            <div className="py-4 flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
              <Loader2 size={16} className="animate-spin" /> Revisando qué se cancelaría…
            </div>
          ) : preview.isError ? (
            <Notice kind="danger">{preview.error.message}</Notice>
          ) : p ? (
            <div
              className="rounded-xl p-3.5 text-[13px] flex flex-col gap-1.5"
              style={{ background: 'var(--ink-50)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
            >
              <div>
                Declaraciones abiertas que pasarán a <b>Cancelada</b>:{' '}
                <b style={{ color: 'var(--ink-900)' }}>{p.declarationsToCancel}</b>
                <span style={{ color: 'var(--ink-500)' }}> (el crédito del paquete se pierde)</span>
              </div>
              {p.prepaid && (
                <div>
                  Saldo prepagado: <b style={{ color: 'var(--ink-900)' }}>{p.prepaid.assignedNotPresented}</b> asignadas sin
                  presentar · <b style={{ color: 'var(--ink-900)' }}>{p.prepaid.unassignedCredits}</b> créditos sin asignar
                  <span style={{ color: 'var(--ink-500)' }}> (reembolso fuera del sistema)</span>
                </div>
              )}
              <div>
                Suscripción de Stripe:{' '}
                {p.subscription?.found ? (
                  p.subscription.sharedWithOtherRfc ? (
                    <b style={{ color: 'var(--ink-900)' }}>compartida con otro RFC activo, no se cancelará</b>
                  ) : (
                    <b style={{ color: 'var(--ink-900)' }}>se cancelará al fin del periodo</b>
                  )
                ) : (
                  <b style={{ color: 'var(--ink-900)' }}>no se encontró</b>
                )}
              </div>
              {inFlight && (
                <div className="mt-1">
                  <Notice kind="danger">
                    El robot está presentando {p.declarationsInFlight.length === 1 ? 'una declaración' : `${p.declarationsInFlight.length} declaraciones`} de
                    este RFC ante el SAT. Espera a que termine y vuelve a intentarlo.
                  </Notice>
                </div>
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className={secondaryBtn} style={secondaryBtnStyle}>
              Volver
            </button>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              disabled={preview.isPending || preview.isError || inFlight}
              className={dangerBtn}
              style={primaryBtnStyle}
            >
              Continuar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div>
            <FieldLabel hint="(escríbelo tal cual para confirmar)">RFC del contribuyente</FieldLabel>
            <input
              value={confirmRfc}
              onChange={(e) => setConfirmRfc(e.target.value.toUpperCase())}
              placeholder={taxpayer.rfc}
              autoComplete="off"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] uppercase outline-none focus:ring-2"
              style={{ ...inputStyle, ...MONO }}
            />
            {confirmRfc.length > 0 && !rfcOk && (
              <div className="text-[12px] mt-1" style={{ color: 'var(--danger)' }}>El RFC no coincide.</div>
            )}
          </div>
          <div>
            <FieldLabel>Motivo</FieldLabel>
            <div className="px-3 py-2.5 rounded-lg text-[13px]" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}>
              Cancelación comercial (solicitud del cliente o de ventas)
            </div>
          </div>
          <div>
            <FieldLabel hint="(opcional)">Nota</FieldLabel>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value.slice(0, DEACTIVATION_NOTE_MAX_LENGTH))}
              rows={3}
              placeholder="Quién lo pidió, acuerdo de reembolso, contexto…"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 resize-y"
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel hint="(obligatorio)">Folio o ticket de la solicitud</FieldLabel>
            <input
              value={requestReference}
              onChange={(e) => setRequestReference(e.target.value.slice(0, DEACTIVATION_REFERENCE_MAX_LENGTH))}
              placeholder="Zoho / correo / ticket"
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2"
              style={inputStyle}
            />
          </div>
          <div>
            <FieldLabel hint="(para confirmar la baja)">Tu contraseña</FieldLabel>
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

          {error && <Notice kind="danger">{error}</Notice>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setStep('preview')} disabled={loading} className={secondaryBtn} style={secondaryBtnStyle}>
              Atrás
            </button>
            <button type="button" onClick={() => void handleConfirm()} disabled={loading || !ready} className={dangerBtn} style={dangerBtnStyle}>
              {loading ? <Loader2 size={15} className="animate-spin" /> : <UserX size={15} />}
              Cancelar cliente
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
