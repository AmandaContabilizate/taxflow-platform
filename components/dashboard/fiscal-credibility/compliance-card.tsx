import { FileText, Zap } from 'lucide-react'
import { Btn } from '../ui'
import { BlockedBadge, ForbiddenBadge, NotFoundBadge, ReadyBadge, TestingBadge } from './badges'
import { DocActions, DocCardShell, LoadingLine, MetaLine } from './doc-card-shell'
import type { DocState } from './types'

interface ComplianceCardProps {
  state: DocState
  blocked: boolean
  downloadDate?: string | null
  statusText?: string | null
  busy: string | null
  onView: () => void
  onDownload: () => void
  onConnect: () => void
}

export function ComplianceCard({
  state,
  blocked,
  downloadDate,
  statusText,
  busy,
  onView,
  onDownload,
  onConnect,
}: ComplianceCardProps) {
  const available = state === 'available' && !blocked
  const errored = state === 'error' && !blocked
  const notFound = state === 'rfc-not-found' && !blocked
  const forbidden = state === 'forbidden' && !blocked
  const isDownloading = busy === 'opinion:download' || busy === 'opinion:view'

  return (
    <DocCardShell
      blocked={blocked}
      icon={<FileText size={22} />}
      iconBg="var(--ink-50)"
      iconColor="var(--ink-500)"
      eyebrow="Opinión de cumplimiento"
      title={
        blocked
          ? 'Falta tu CSF'
          : state === 'loading'
            ? 'Cargando…'
            : isDownloading
              ? 'Cargando…'
              : available
                ? 'Lista para consultar'
                : notFound
                  ? 'No encontramos este RFC'
                  : forbidden
                    ? 'Sin acceso'
                    : errored
                      ? 'Servicio en pruebas'
                      : 'Aún no disponible'
      }
      desc={
        blocked
          ? 'Necesitamos tu CSF para poder consultar tu opinión de cumplimiento ante el SAT.'
          : available
            ? 'Documento oficial del SAT que confirma que estás al corriente con tus obligaciones.'
            : notFound
              ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
              : forbidden
                ? 'No tienes permiso para consultar tu opinión de cumplimiento. Verifica tu sesión o tus permisos.'
                : errored
                  ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo más tarde.'
                  : 'Estamos consultando con el SAT. Te avisamos cuando esté disponible.'
      }
      badge={
        blocked ? (
          <BlockedBadge />
        ) : available ? (
          <ReadyBadge />
        ) : notFound ? (
          <NotFoundBadge />
        ) : forbidden ? (
          <ForbiddenBadge />
        ) : errored ? (
          <TestingBadge />
        ) : undefined
      }
    >
      {blocked ? (
        <Btn kind="ghost" onClick={onConnect} block>
          <Zap size={16} /> Conectar al SAT
        </Btn>
      ) : state === 'loading' ? (
        <LoadingLine label="Cargando…" />
      ) : available ? (
        <div className="flex flex-col gap-3">
          <MetaLine date={downloadDate} status={statusText} />
          <DocActions kind="opinion" busy={busy} onView={onView} onDownload={onDownload} />
        </div>
      ) : null}
    </DocCardShell>
  )
}
