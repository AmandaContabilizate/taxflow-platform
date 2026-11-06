'use client'

import { AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { getStaffEmailChangePreview } from '@/features/auth/actions/getStaffEmailChangePreview.action'
import { staffChangeClientEmail } from '@/features/auth/actions/staffChangeClientEmail.action'
import type { StaffEmailChangePreview } from '@/features/auth/types'
import { DISPLAY, MONO } from '../constants'
import { Modal } from '../modal'
import { Btn } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  taxpayerId: number
  /** Se llama con el correo nuevo una vez aplicado el cambio. */
  onChanged: (newEmail: string) => void
}

/**
 * Staff cambia el correo de acceso de un cliente (permiso Contador.UpdateClientEmail). Sin código:
 * se aplica al confirmar con la contraseña del staff y un motivo; el back cierra las sesiones del
 * cliente, avisa al correo anterior y al nuevo, y lo deja en bitácora.
 */
export function StaffEmailChangeModal({ isOpen, onClose, taxpayerId, onChanged }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar correo del cliente">
      {/* key: cada apertura empieza limpia (sin contraseña ni resultado previos). */}
      {isOpen && <StaffEmailChangeForm key={taxpayerId} taxpayerId={taxpayerId} onChanged={onChanged} onClose={onClose} />}
    </Modal>
  )
}

function StaffEmailChangeForm({ taxpayerId, onChanged, onClose }: { taxpayerId: number; onChanged: (newEmail: string) => void; onClose: () => void }) {
  const [preview, setPreview] = useState<StaffEmailChangePreview | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<{ oldEmail: string; newEmail: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getStaffEmailChangePreview(taxpayerId)
      if (cancelled) return
      if (res.success) setPreview(res.value)
      else setLoadError(res.error.message)
    })()
    return () => {
      cancelled = true
    }
  }, [taxpayerId])

  if (loadError) return <Banner>{loadError}</Banner>
  if (!preview) {
    return (
      <div className="py-8 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={16} className="animate-spin" /> Consultando la cuenta…
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Banner ok>
          <CheckCircle2 size={15} />
          <span>
            Listo. El cliente ahora entra con <b>{done.newEmail}</b>. Cerramos sus sesiones abiertas y le avisamos en los dos correos.
          </span>
        </Banner>
        <Btn kind="brand" block onClick={onClose}>
          Cerrar
        </Btn>
      </div>
    )
  }

  const blocked = preview.blockedReason != null
  const canSubmit =
    !blocked && !submitting && newEmail.trim().length > 0 && reason.trim().length > 0 && password.length > 0

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await staffChangeClientEmail(taxpayerId, newEmail, reason, password)
    setSubmitting(false)
    if (!res.success) {
      setError(res.error.message)
      if (res.error.errorCode === 'INVALID_PASSWORD') setPassword('')
      return
    }
    setPassword('')
    setDone({ oldEmail: res.value.oldEmail, newEmail: res.value.newEmail })
    onChanged(res.value.newEmail)
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <div className="text-[10.5px] font-extrabold uppercase tracking-wide mb-0.5" style={{ color: 'var(--ink-400)' }}>
          Correo actual
        </div>
        <div className="text-[14px] font-semibold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          {preview.currentEmail || '—'}
        </div>
      </div>

      {blocked ? (
        <Banner>{preview.blockedReason}</Banner>
      ) : (
        <>
          <div
            className="text-[12.5px] px-4 py-3 rounded-xl flex gap-2"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
          >
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>
              El correo es de la cuenta, no del RFC: cambia el acceso de{' '}
              {preview.rfcs.length === 1 ? 'su único RFC' : `sus ${preview.rfcs.length} RFCs`}
              {preview.rfcs.length > 0 && (
                <>
                  {' '}(
                  <span style={{ ...MONO, fontSize: '11.5px' }}>{preview.rfcs.join(', ')}</span>)
                </>
              )}
              . Se aplica de inmediato, se cierran sus sesiones y se avisa al correo anterior y al nuevo.
            </span>
          </div>

          <Field label="Correo nuevo">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="off"
              inputMode="email"
              className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </Field>

          <Field label="Motivo (queda en bitácora)">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Ej. El cliente perdió acceso a su correo; lo pidió por WhatsApp (folio …)"
              className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none resize-none"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </Field>

          <Field label="Tu contraseña">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </Field>

          {error && <Banner>{error}</Banner>}

          <Btn kind="brand" type="submit" disabled={!canSubmit} block>
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Cambiando…
              </>
            ) : (
              'Cambiar correo'
            )}
          </Btn>
        </>
      )}
    </form>
  )
}

function Banner({ ok, children }: { ok?: boolean; children: ReactNode }) {
  return (
    <div
      className="text-[13px] font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
      style={ok ? { background: 'var(--brand-50)', color: 'var(--brand-700)' } : { background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
    >
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}
