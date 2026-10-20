'use client'

import { AlertTriangle, Loader2, UserX } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  deactivateTaxpayerAsStaff,
  getDeactivationReasons,
  type DeactivationReason,
  type DeactivationResult,
  type PrepaidBalance,
} from '@/features/taxpayers/actions/taxpayerDeactivation.action'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Btn } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  taxpayerId: number
  rfc: string
  /** soft = baja (borra credenciales); hard = baja definitiva (anonimiza, irreversible). */
  mode: 'soft' | 'hard'
  prepaid: PrepaidBalance | null
  onDone: (result: DeactivationResult) => void
}

const DELETES: Record<Props['mode'], string[]> = {
  soft: [
    'CIEC y e.firma (incluye los archivos .cer/.key)',
    'Historial de validaciones de CIEC y cuentas bancarias',
    'Asignación en la cartera de su contador',
    'Si es su último RFC activo: contraseña, sesiones y notificaciones; la cuenta queda desactivada',
  ],
  hard: [
    'RFC enmascarado (sin fecha ni homoclave) y nombre reducido a iniciales',
    'CURP, domicilio, constancias y opiniones de cumplimiento',
    'Deducciones personales, nómina y CFDI que no son papel de trabajo de una declaración',
    'Si todos sus RFC quedan en baja definitiva: email, teléfono y nombre de la cuenta',
  ],
}

const KEEPS = [
  'Ventas, paquetes y vínculos (comisiones)',
  'Declaraciones con acuses, líneas de captura y los CFDI ligados a ellas',
  'Regímenes, actividades, obligaciones, inicio de operaciones y estatus en el padrón',
  'Bitácora de accesos a la cuenta (quién entró y cuándo)',
]

/**
 * Baja del contribuyente desde el expediente (tab Credenciales). Re-autenticación del staff +
 * RFC escrito de nuevo + motivo + folio de la solicitud del cliente. Hard es irreversible y
 * además pide marcar la casilla de confirmación.
 */
export function DeactivateTaxpayerModal({ isOpen, onClose, taxpayerId, rfc, mode, prepaid, onDone }: Props) {
  const [reasons, setReasons] = useState<DeactivationReason[]>([])
  const [reasonId, setReasonId] = useState<number | ''>('')
  const [reasonNote, setReasonNote] = useState('')
  const [requestReference, setRequestReference] = useState('')
  const [confirmRfc, setConfirmRfc] = useState('')
  const [password, setPassword] = useState('')
  const [irreversibleOk, setIrreversibleOk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    void getDeactivationReasons().then((res) => {
      if (res.success) setReasons(res.value)
      else setError(res.error.message)
    })
  }, [isOpen])

  const hard = mode === 'hard'
  const reason = reasons.find((r) => r.id === reasonId)
  const rfcOk = confirmRfc.trim().toUpperCase() === rfc.trim().toUpperCase()
  const canSubmit =
    rfcOk &&
    reasonId !== '' &&
    (!reason?.requiresNote || reasonNote.trim().length > 0) &&
    requestReference.trim().length > 0 &&
    password.length > 0 &&
    (!hard || irreversibleOk) &&
    !submitting

  const reset = () => {
    setReasonId('')
    setReasonNote('')
    setRequestReference('')
    setConfirmRfc('')
    setPassword('')
    setIrreversibleOk(false)
    setError(null)
  }

  const handleClose = () => {
    if (submitting) return
    reset()
    onClose()
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await deactivateTaxpayerAsStaff({
      taxpayerId,
      hard,
      confirmRfc: confirmRfc.trim().toUpperCase(),
      reasonId,
      reasonNote: reasonNote.trim() || undefined,
      requestReference: requestReference.trim(),
      password,
    })
    setPassword('')
    setSubmitting(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    reset()
    onDone(res.value)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={hard ? 'Baja definitiva del contribuyente' : 'Dar de baja al contribuyente'}
      maxWidth={620}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div
          className="text-[12.5px] font-semibold px-4 py-3 rounded-xl flex items-start gap-2"
          style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)' }}
        >
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            {hard
              ? 'Esta acción es irreversible: los datos personales no se pueden recuperar.'
              : 'El cliente deja de recibir descargas, presentaciones y avisos. Para volver necesitará capturar de nuevo su CIEC o e.firma.'}
          </span>
        </div>

        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <ListBox title="Se borra" items={DELETES[mode]} tone="danger" />
          <ListBox title="Se conserva" items={KEEPS} tone="ink" />
        </div>

        {prepaid && (prepaid.assignedNotPresented > 0 || prepaid.unassignedCredits > 0) && (
          <div
            className="text-[12.5px] px-4 py-3 rounded-xl"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
          >
            <strong>Saldo prepagado del cliente:</strong> {prepaid.assignedNotPresented} declaración(es) pagadas sin
            presentar y {prepaid.unassignedCredits} crédito(s) sin usar. Gestiona el reembolso antes de la baja
            definitiva.
          </div>
        )}

        <Field label="Motivo">
          <select
            value={reasonId}
            onChange={(e) => setReasonId(e.target.value === '' ? '' : Number(e.target.value))}
            disabled={submitting}
            className={INPUT}
            style={INPUT_STYLE}
          >
            <option value="">Selecciona un motivo…</option>
            {reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.description}
              </option>
            ))}
          </select>
        </Field>

        {(reason?.requiresNote || reasonNote) && (
          <Field label={reason?.requiresNote ? 'Detalle del motivo (obligatorio)' : 'Detalle del motivo'}>
            <textarea
              value={reasonNote}
              onChange={(e) => setReasonNote(e.target.value)}
              maxLength={1000}
              rows={2}
              disabled={submitting}
              className={INPUT}
              style={INPUT_STYLE}
            />
          </Field>
        )}

        <Field label="Folio o evidencia de la solicitud del cliente">
          <input
            type="text"
            value={requestReference}
            onChange={(e) => setRequestReference(e.target.value)}
            maxLength={255}
            placeholder="Ej. ticket de soporte, correo del cliente, folio ARCO"
            disabled={submitting}
            className={INPUT}
            style={INPUT_STYLE}
          />
        </Field>

        <Field label={<>Escribe el RFC <code style={{ ...MONO, fontSize: '12px' }}>{rfc}</code> para confirmar</>}>
          <input
            type="text"
            value={confirmRfc}
            onChange={(e) => setConfirmRfc(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={submitting}
            className={INPUT}
            style={{ ...INPUT_STYLE, ...MONO, textTransform: 'uppercase' }}
          />
        </Field>

        <Field label="Tu contraseña">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={submitting}
            className={INPUT}
            style={INPUT_STYLE}
          />
        </Field>

        {hard && (
          <label className="flex items-start gap-2 text-[12.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
            <input
              type="checkbox"
              checked={irreversibleOk}
              onChange={(e) => setIrreversibleOk(e.target.checked)}
              disabled={submitting}
              className="mt-0.5"
            />
            Entiendo que la baja definitiva no se puede deshacer.
          </label>
        )}

        {error && (
          <div
            className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger-ink)' }}
          >
            {error}
          </div>
        )}

        <Btn
          kind="ghost"
          type="submit"
          disabled={!canSubmit}
          block
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Procesando baja…
            </>
          ) : (
            <>
              <UserX size={16} /> {hard ? 'Dar de baja definitiva' : 'Dar de baja'}
            </>
          )}
        </Btn>
      </form>
    </Modal>
  )
}

const INPUT = 'w-full px-4 py-2.5 rounded-lg text-[14px] outline-none'
const INPUT_STYLE = { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }

function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function ListBox({ title, items, tone }: { title: string; items: string[]; tone: 'danger' | 'ink' }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ border: '1px solid var(--border)' }}>
      <div
        className="text-[10.5px] font-extrabold uppercase tracking-wide mb-1.5"
        style={{ color: tone === 'danger' ? 'var(--danger)' : 'var(--ink-400)' }}
      >
        {title}
      </div>
      <ul className="flex flex-col gap-1 text-[12.5px] list-disc pl-4" style={{ color: 'var(--ink-700)' }}>
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  )
}
