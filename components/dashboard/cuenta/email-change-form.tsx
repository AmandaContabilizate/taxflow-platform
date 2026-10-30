'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { confirmEmailChange } from '@/features/auth/actions/confirmEmailChange.action'
import { requestEmailChange } from '@/features/auth/actions/requestEmailChange.action'
import { resendEmailChange } from '@/features/auth/actions/resendEmailChange.action'
import type { EmailChangeError } from '@/features/auth/types'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'

const CODE_LENGTH = 6

interface Props {
  currentEmail: string
  /** Se llama con el correo nuevo una vez aplicado el cambio (cookies ya reescritas). */
  onChanged: (newEmail: string) => void
}

type Step = 'credentials' | 'code' | 'done'

export function partnerBlockedText(partner: string | null | undefined): string {
  const who = partner && partner !== '1' ? partner : 'tu partner'
  return `Tu acceso lo administra ${who}; para cambiar tu correo contáctalo.`
}

function errorText(e: EmailChangeError): string {
  if (e.errorCode === 'EMAIL_CHANGE_BLOCKED_PARTNER_LOGIN') return partnerBlockedText(e.partner)
  if (e.errorCode === 'INVALID_CODE' && typeof e.attemptsLeft === 'number') {
    return `El código no es correcto. Te ${e.attemptsLeft === 1 ? 'queda 1 intento' : `quedan ${e.attemptsLeft} intentos`}.`
  }
  return e.message
}

function secondsUntil(iso: string | null): number {
  if (!iso) return 0
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000))
}

export function EmailChangeForm({ currentEmail, onChanged }: Props) {
  const [step, setStep] = useState<Step>('credentials')
  const [password, setPassword] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [maskedEmail, setMaskedEmail] = useState('')
  const [resendAt, setResendAt] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    setCooldown(secondsUntil(resendAt))
    if (!resendAt) return
    const id = setInterval(() => setCooldown(secondsUntil(resendAt)), 1000)
    return () => clearInterval(id)
  }, [resendAt])

  const canRequest = password.length > 0 && newEmail.trim().length > 0 && !submitting
  const canConfirm = code.length === CODE_LENGTH && !submitting

  const onRequest = async (e: FormEvent) => {
    e.preventDefault()
    if (!canRequest) return
    setSubmitting(true)
    setError(null)
    const res = await requestEmailChange(password, newEmail)
    setSubmitting(false)
    if (!res.success) {
      setError(errorText(res.error))
      return
    }
    setMaskedEmail(res.value.maskedNewEmail)
    setResendAt(res.value.resendAvailableAt)
    setCode('')
    setNotice(null)
    setStep('code')
  }

  const onResend = async () => {
    if (resending || cooldown > 0) return
    setResending(true)
    setError(null)
    setNotice(null)
    const res = await resendEmailChange(newEmail)
    setResending(false)
    if (!res.success) {
      setError(errorText(res.error))
      return
    }
    setMaskedEmail(res.value.maskedNewEmail)
    setResendAt(res.value.resendAvailableAt)
    setNotice(`Te mandamos otro código a ${res.value.maskedNewEmail}.`)
  }

  const onConfirm = async (e: FormEvent) => {
    e.preventDefault()
    if (!canConfirm) return
    setSubmitting(true)
    setError(null)
    setNotice(null)
    const res = await confirmEmailChange(newEmail, code)
    setSubmitting(false)
    if (!res.success) {
      // EMAIL_CHANGE_CRM_UNAVAILABLE: nada cambió y el código sigue valiendo; se queda en este paso.
      setError(errorText(res.error))
      if (res.error.errorCode === 'EMAIL_CHANGE_TOO_MANY_ATTEMPTS') setCode('')
      return
    }
    setNewEmail(res.value)
    setPassword('')
    setStep('done')
    onChanged(res.value)
  }

  const backToCredentials = () => {
    setStep('credentials')
    setCode('')
    setError(null)
    setNotice(null)
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col gap-4">
        <Header title="Listo" subtitle="Tu correo cambió." />
        <Banner ok>
          <CheckCircle2 size={15} />
          <span>
            Tu correo cambió. A partir de ahora entra con <b>{newEmail}</b>.
          </span>
        </Banner>
      </div>
    )
  }

  if (step === 'code') {
    return (
      <form onSubmit={onConfirm} className="flex flex-col gap-4">
        <Header
          title="Confirma tu nuevo correo"
          subtitle={`Te mandamos un código a ${maskedEmail}. Vence en unos minutos.`}
        />

        <div className="flex justify-center py-1">
          <InputOTP
            maxLength={CODE_LENGTH}
            value={code}
            onChange={setCode}
            inputMode="numeric"
            pattern="^\d+$"
            autoFocus
            disabled={submitting}
          >
            <InputOTPGroup>
              {Array.from({ length: CODE_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-11 text-[18px] font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && <Banner>{error}</Banner>}
        {notice && <Banner ok>{notice}</Banner>}

        <Btn kind="brand" type="submit" disabled={!canConfirm} block>
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Confirmando…
            </>
          ) : (
            'Confirmar'
          )}
        </Btn>

        <div className="flex items-center justify-between gap-3 text-[12.5px] font-semibold">
          <button
            type="button"
            onClick={onResend}
            disabled={resending || cooldown > 0 || submitting}
            className="disabled:opacity-60"
            style={{ color: 'var(--brand-700)' }}
          >
            {resending ? 'Reenviando…' : cooldown > 0 ? `Reenviar en ${cooldown} s` : 'Reenviar código'}
          </button>
          <button
            type="button"
            onClick={backToCredentials}
            disabled={submitting}
            className="disabled:opacity-60"
            style={{ color: 'var(--ink-500)' }}
          >
            Cambiar el correo
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={onRequest} className="flex flex-col gap-4">
      <Header
        title="Confirma tu identidad"
        subtitle={`Tu correo actual es ${currentEmail}. Escribe tu contraseña y el correo nuevo; te mandaremos un código para confirmarlo.`}
      />

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

      <Field label="Correo nuevo">
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          className="w-full px-4 py-2.5 rounded-lg text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </Field>

      {error && <Banner>{error}</Banner>}

      <Btn kind="brand" type="submit" disabled={!canRequest} block>
        {submitting ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Enviando código…
          </>
        ) : (
          'Enviar código'
        )}
      </Btn>
    </form>
  )
}

function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-[16px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
        {title}
      </div>
      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
        {subtitle}
      </div>
    </div>
  )
}

function Banner({ ok, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <div
      className="text-[13px] font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2"
      style={ok ? { background: 'var(--brand-50)', color: 'var(--brand-700)' } : { background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
    >
      {children}
    </div>
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
