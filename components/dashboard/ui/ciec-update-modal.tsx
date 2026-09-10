'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { updateCiec } from '@/features/taxpayers/actions/updateCiec.action'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { Modal } from '../modal'
import { Btn } from './btn'

interface Props {
  isOpen: boolean
  onClose: () => void
  rfc: string
}

type Feedback = { kind: 'invalid' | 'unverified' | 'error'; message: string } | null

const FEEDBACK_COPY: Record<NonNullable<Feedback>['kind'], string> = {
  invalid: 'Esa contraseña tampoco funcionó. El SAT la sigue rechazando: verifica que sea la CIEC vigente e inténtalo de nuevo.',
  unverified: 'No pudimos validarla contra el SAT en este momento. Espera un momento y vuelve a intentar.',
  error: 'No pudimos conectar con el SAT. Intenta de nuevo.',
}

/**
 * Único camino de recuperación para el estado 2 (D2: el worker de reintento no se toca).
 * Reutilizado por el bloqueo de E1 y por Mi cuenta (E2). Nunca persiste la contraseña.
 */
export function CiecUpdateModal({ isOpen, onClose, rfc }: Props) {
  const { refresh } = useRfcStore()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)

  const handleClose = () => {
    if (loading) return
    setPassword('')
    setFeedback(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || loading) return
    setLoading(true)
    setFeedback(null)

    const res = await updateCiec({ rfc, satPassword: password, saveOnInvalidCiec: true })
    setPassword('')

    if (!res.success) {
      setLoading(false)
      setFeedback({ kind: 'error', message: res.error.message })
      return
    }

    await refresh()
    setLoading(false)

    if (res.value.ciecState === 1) {
      handleClose()
      return
    }
    setFeedback({ kind: res.value.ciecState === 2 ? 'invalid' : 'unverified', message: '' })
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Actualiza tu CIEC">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          Captura la contraseña CIEC vigente del SAT para el RFC <strong style={{ color: 'var(--ink-900)' }}>{rfc}</strong>.
          La validamos contra el SAT al momento.
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña CIEC"
          autoComplete="off"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />

        {feedback && (
          <div
            className="text-[13px] font-semibold px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
          >
            {FEEDBACK_COPY[feedback.kind]}
          </div>
        )}

        <Btn type="submit" kind="brand" block disabled={!password || loading}>
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Validando con el SAT…
            </>
          ) : (
            'Validar CIEC'
          )}
        </Btn>
      </form>
    </Modal>
  )
}
