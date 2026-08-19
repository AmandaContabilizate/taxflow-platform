import { AlertCircle, CheckCircle2, Upload, Zap } from 'lucide-react'
import { Btn } from '../ui'
import { ForbiddenBadge, NotFoundBadge, ReadyBadge, TestingBadge } from './badges'
import { DocActions, DocCardShell, LoadingLine, MetaLine } from './doc-card-shell'
import type { DocState } from './types'

interface CsfCardProps {
  state: DocState
  downloadDate?: string | null
  busy: string | null
  onConnect: () => void
  onUpload: () => void
  onView: () => void
  onDownload: () => void
}

export function CsfCard({ state, downloadDate, busy, onConnect, onUpload, onView, onDownload }: CsfCardProps) {
  const available = state === 'available'
  const errored = state === 'error'
  const notFound = state === 'rfc-not-found'
  const forbidden = state === 'forbidden'
  const isDownloading = busy === 'csf:download' || busy === 'csf:view'

  return (
    <DocCardShell
      highlighted={state === 'missing'}
      icon={available ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
      iconBg={
        available
          ? 'var(--brand-50)'
          : notFound
            ? 'var(--coral-soft)'
            : forbidden
              ? 'var(--danger-soft)'
              : errored
                ? 'var(--hero-amber-icon-bg)'
                : 'var(--hero-info-icon-bg)'
      }
      iconColor={
        available ? 'var(--brand-700)' : notFound ? 'var(--violet-ink)' : forbidden ? '#8B1E1E' : errored ? 'var(--violet-ink)' : '#fff'
      }
      eyebrow="Constancia de Situación Fiscal"
      title={
        state === 'loading'
          ? 'Cargando…'
          : isDownloading
            ? 'Cargando…'
            : available
              ? 'La tenemos lista'
              : notFound
                ? 'No encontramos este RFC'
                : forbidden
                  ? 'Sin acceso'
                  : errored
                    ? 'Servicio en pruebas'
                    : 'Aún no la tenemos'
      }
      desc={
        available
          ? 'Tu Constancia de Situación Fiscal está vigente y disponible.'
          : notFound
            ? 'Este RFC no está registrado en tu cuenta. Verifica que sea el correcto o regístralo primero.'
            : forbidden
              ? 'No tienes permiso para consultar tu Constancia. Verifica tu sesión o tus permisos e inténtalo de nuevo.'
              : errored
                ? 'Estamos validando este flujo con el SAT en ambiente de pruebas. Vuelve a intentarlo en unos minutos.'
                : 'Conecta tu RFC con CIEC o e.firma para que descarguemos automáticamente tu CSF y activemos el resto del análisis fiscal.'
      }
      badge={
        available ? (
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
      {state === 'loading' ? (
        <LoadingLine label="Cargando…" />
      ) : available ? (
        <div className="flex flex-col gap-3">
          <MetaLine date={downloadDate} />
          <DocActions kind="csf" busy={busy} onView={onView} onDownload={onDownload} />
        </div>
      ) : errored || notFound || forbidden ? null : (
        <div className="flex gap-2 flex-wrap">
          <Btn kind="brand" onClick={onConnect}>
            <Zap size={18} /> Conectar al SAT
          </Btn>
          <Btn kind="ghost" onClick={onUpload}>
            <Upload size={16} /> Subir PDF
          </Btn>
        </div>
      )}
    </DocCardShell>
  )
}
