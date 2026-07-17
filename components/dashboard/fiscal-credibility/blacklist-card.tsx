import { ShieldCheck, Zap } from 'lucide-react'
import { Btn } from '../ui'
import { BlockedBadge, FlaggedBadge, ForbiddenBadge, NotFoundBadge, ReadyBadge, TestingBadge } from './badges'
import { DocCardShell } from './doc-card-shell'
import type { DocState } from './types'

interface BlacklistCardProps {
  state: DocState
  statusText?: string | null
  blocked: boolean
  onConnect: () => void
}

export function BlacklistCard({ state, statusText, blocked, onConnect }: BlacklistCardProps) {
  const available = state === 'available' && !blocked
  const errored = state === 'error' && !blocked
  const notFound = state === 'rfc-not-found' && !blocked
  const forbidden = state === 'forbidden' && !blocked
  const clean = available && (statusText ?? '').trim() === ''
  const flagged = available && (statusText ?? '').trim() !== ''

  return (
    <DocCardShell
      blocked={blocked}
      icon={<ShieldCheck size={22} />}
      iconBg={flagged ? 'var(--coral-soft)' : 'var(--ink-50)'}
      iconColor={flagged ? '#9E3A15' : 'var(--ink-500)'}
      eyebrow="Listas negras SAT"
      title={
        blocked
          ? 'Falta tu CSF'
          : state === 'loading'
            ? 'Verificando…'
            : clean
              ? 'Estatus limpio'
              : flagged
                ? 'Aparece en listas'
                : notFound
                  ? 'No encontramos este RFC'
                  : forbidden
                    ? 'Sin acceso'
                    : errored
                      ? 'Servicio en pruebas'
                      : 'Sin información'
      }
      desc={
        blocked
          ? 'Necesitamos tu CSF para revisar si apareces en las listas del 69-B del SAT.'
          : clean
            ? 'Tu RFC no aparece en las listas del artículo 69-B del SAT. Estás al corriente.'
            : flagged
              ? `Tu RFC aparece con estatus "${statusText}" en las listas del artículo 69-B del SAT. Revisa tu situación.`
              : notFound
                ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
                : forbidden
                  ? 'No tienes permiso para consultar las listas del 69-B. Verifica tu sesión o tus permisos.'
                  : errored
                    ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo más tarde.'
                    : 'Aún no podemos validar tu estatus en las listas negras del SAT.'
      }
      badge={
        blocked ? (
          <BlockedBadge />
        ) : clean ? (
          <ReadyBadge />
        ) : flagged ? (
          <FlaggedBadge />
        ) : notFound ? (
          <NotFoundBadge />
        ) : forbidden ? (
          <ForbiddenBadge />
        ) : errored ? (
          <TestingBadge />
        ) : undefined
      }
    >
      {blocked && (
        <Btn kind="ghost" onClick={onConnect} block>
          <Zap size={16} /> Conectar al SAT
        </Btn>
      )}
    </DocCardShell>
  )
}
