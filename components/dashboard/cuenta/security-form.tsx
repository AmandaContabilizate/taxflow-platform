'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { updatePassword } from '@/features/auth/actions/updatePassword.action'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'

const MIN_LENGTH = 8

export function SecurityForm() {
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const tooShort = pwd.length > 0 && pwd.length < MIN_LENGTH
  const mismatch = confirm.length > 0 && confirm !== pwd
  const canSubmit = pwd.length >= MIN_LENGTH && confirm === pwd && !submitting

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setResult(null)
    const res = await updatePassword(pwd)
    setSubmitting(false)
    if (res.success) {
      setResult({ ok: true, text: 'Tu contraseña se actualizó correctamente.' })
      setPwd('')
      setConfirm('')
    } else {
      setResult({ ok: false, text: res.error.message })
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <div className="text-[16px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Cambiar contraseña
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Elige una nueva contraseña de al menos {MIN_LENGTH} caracteres.
        </div>
      </div>

      <Field label="Nueva contraseña">
        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </Field>
      {tooShort && <Hint text={`Mínimo ${MIN_LENGTH} caracteres.`} />}

      <Field label="Confirmar contraseña">
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </Field>
      {mismatch && <Hint text="Las contraseñas no coinciden." />}

      {result && (
        <div
          className="text-[13px] font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
          style={
            result.ok
              ? { background: 'var(--brand-50)', color: 'var(--brand-700)' }
              : { background: 'var(--coral-soft)', color: 'var(--violet-ink)' }
          }
        >
          {result.ok && <CheckCircle2 size={15} />}
          {result.text}
        </div>
      )}

      <Btn kind="brand" type="submit" disabled={!canSubmit} block>
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Guardando…
          </>
        ) : (
          'Actualizar contraseña'
        )}
      </Btn>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-700)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

function Hint({ text }: { text: string }) {
  return (
    <div className="text-[12px] -mt-2" style={{ color: 'var(--violet-ink)' }}>
      {text}
    </div>
  )
}
