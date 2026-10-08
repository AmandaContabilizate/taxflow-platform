'use client'

import { CheckCircle2, Loader2, Send, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { forcePostDeclaration } from '@/features/declarations/actions/forcePostDeclaration.action'
import type { PostingReadiness } from '@/features/declarations/types'
import { Modal } from '../modal'
import { useHasPermission } from '../permissions'
import { Btn } from '../ui'

/** Claim del Gerente de Operaciones para autorizar presentaciones (mismo que exige el back). */
export const FORCE_POST_CLAIM = 'Operaciones.ForcePostDeclaration'

const READY_TO_SUBMIT = 11

/**
 * ⚠️ junto al estatus de una declaración en PorPresentar que el robot no va a presentar.
 * Rojo: no se puede presentar ni autorizándola. Ámbar: el GO puede autorizarla.
 * El tooltip lista todos los motivos.
 */
export function PostingReadinessIcon({ readiness }: { readiness?: PostingReadiness | null }) {
  if (!readiness || readiness.level === 'ok') return null

  const blocked = readiness.level === 'blocked'
  const color = blocked ? 'var(--danger)' : 'var(--amber)'

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          tabIndex={0}
          aria-label={blocked ? 'No se puede presentar' : 'El robot no la presentará'}
          className="inline-flex items-center cursor-help align-middle ml-1.5"
        >
          <TriangleAlert size={16} style={{ color }} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[340px] text-left">
        {readiness.blockers.length > 0 && (
          <ReasonList title="No se puede presentar:" reasons={readiness.blockers} />
        )}
        {readiness.warnings.length > 0 && (
          <ReasonList title="El robot no la presentará:" reasons={readiness.warnings} />
        )}
      </TooltipContent>
    </Tooltip>
  )
}

const ReasonList = ({ title, reasons }: { title: string; reasons: string[] }) => (
  <div className="py-0.5">
    <div className="font-bold">{title}</div>
    <ul className="list-disc pl-4">
      {reasons.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  </div>
)

/**
 * "Enviar": encola la declaración en su cola de posteo a nombre del usuario (presentación
 * autorizada). Sólo en PorPresentar, sin advertencia roja y para quien tiene el permiso.
 * Con advertencia ámbar pide confirmar listando lo que se va a saltar.
 */
export function ForcePostButton({
  declarationId,
  statusId,
  readiness,
}: {
  declarationId: number
  statusId: number
  readiness?: PostingReadiness | null
}) {
  const canForcePost = useHasPermission(FORCE_POST_CLAIM)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!canForcePost || statusId !== READY_TO_SUBMIT || readiness?.level === 'blocked') return null

  const warnings = readiness?.warnings ?? []

  const handleSend = async () => {
    setConfirmOpen(false)
    setSending(true)
    setError(null)
    const res = await forcePostDeclaration(declarationId)
    setSending(false)
    if (res.success) {
      setSentTo(res.value.enqueued ? `En cola (${res.value.task})` : 'Ya estaba en cola')
    } else {
      setError(res.error.message)
    }
  }

  const handleClick = () => {
    if (warnings.length > 0) setConfirmOpen(true)
    else void handleSend()
  }

  if (sentTo) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-bold whitespace-nowrap"
        style={{ color: 'var(--ink-700)' }}
      >
        <CheckCircle2 size={14} style={{ color: 'var(--brand, #00AD87)' }} /> {sentTo}
      </span>
    )
  }

  return (
    <>
      <span className="inline-flex flex-col items-end gap-1">
        <Btn kind="ghost" size="sm" onClick={handleClick} disabled={sending}>
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Enviar
        </Btn>
        {error && (
          <span className="text-[11.5px] font-semibold max-w-[260px] text-right" style={{ color: 'var(--danger)' }}>
            {error}
          </span>
        )}
      </span>

      <Modal isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} title="Autorizar presentación">
        <div className="flex flex-col gap-4 text-[14px]" style={{ color: 'var(--foreground)' }}>
          <div className="flex items-start gap-2">
            <TriangleAlert size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--amber)' }} />
            <span>Vas a autorizar la presentación saltando estas validaciones:</span>
          </div>
          <ul className="list-disc pl-9 font-semibold">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <p style={{ color: 'var(--ink-700)' }}>
            Quedará registrado que tú la autorizaste. Presentar ante el SAT no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2">
            <Btn kind="ghost" size="sm" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Btn>
            <Btn kind="primary" size="sm" onClick={() => void handleSend()}>
              <Send size={14} /> Sí, enviar
            </Btn>
          </div>
        </div>
      </Modal>
    </>
  )
}
