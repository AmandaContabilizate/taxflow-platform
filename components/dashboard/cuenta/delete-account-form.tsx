'use client'

import { AlertTriangle, Loader2, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { deleteAccount } from '@/features/auth/actions/deleteAccount.action'
import { signOut } from '@/features/auth/actions/signOut.action'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'

const CONFIRM_WORD = 'ELIMINAR'

export function DeleteAccountForm() {
  const [password, setPassword] = useState('')
  const [confirmWord, setConfirmWord] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const wordOk = confirmWord.trim().toUpperCase() === CONFIRM_WORD
  const canSubmit = password.length > 0 && wordOk && !submitting && !done

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    const res = await deleteAccount(password)
    if (!res.success) {
      setSubmitting(false)
      setError(res.error.message)
      return
    }
    setDone(true)
    setPassword('')
    await signOut()
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <div className="text-[16px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Eliminar mi cuenta
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Tu cuenta se desactivará y ya no podrás iniciar sesión. Si necesitas volver, escríbenos
          al centro de ayuda.
        </div>
      </div>

      <div
        className="text-[12.5px] font-semibold px-4 py-3 rounded-xl flex items-start gap-2"
        style={{ background: 'var(--danger-soft)', color: 'var(--violet-ink)' }}
      >
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
        <span>
          Esta acción cierra tu acceso a declaraciones, facturas y documentos. Confirma con tu
          contraseña.
        </span>
      </div>

      <Field label="Tu contraseña">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={done}
          className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </Field>

      <Field label={`Escribe ${CONFIRM_WORD} para confirmar`}>
        <input
          type="text"
          value={confirmWord}
          onChange={(e) => setConfirmWord(e.target.value)}
          autoComplete="off"
          disabled={done}
          className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </Field>

      {error && (
        <div
          className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--danger-soft)', color: 'var(--violet-ink)' }}
        >
          {error}
        </div>
      )}

      {done && (
        <div
          className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
        >
          Cuenta eliminada. Cerrando tu sesión…
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
            <Loader2 size={16} className="animate-spin" /> Eliminando…
          </>
        ) : (
          <>
            <Trash2 size={16} /> Eliminar mi cuenta
          </>
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
