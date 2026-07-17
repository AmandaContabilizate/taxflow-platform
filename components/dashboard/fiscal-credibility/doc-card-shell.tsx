import { Download, Eye, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'
import { formatDate } from './helpers'
import type { DocKind } from './types'

interface DocCardShellProps {
  highlighted?: boolean
  blocked?: boolean
  icon: ReactNode
  iconBg: string
  iconColor: string
  eyebrow: string
  title: string
  desc: string
  children?: ReactNode
  badge?: ReactNode
}

export function DocCardShell({
  highlighted,
  blocked,
  icon,
  iconBg,
  iconColor,
  eyebrow,
  title,
  desc,
  children,
  badge,
}: DocCardShellProps) {
  return (
    <div
      className="rounded-3xl p-5 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: highlighted ? 'var(--hero-info)' : 'var(--card)',
        border: `1px solid ${highlighted ? 'var(--hero-info-border)' : 'var(--border)'}`,
        boxShadow: highlighted ? 'none' : 'var(--sh-1)',
        opacity: blocked ? 0.85 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
        {badge}
      </div>
      <div>
        <div className="text-[11px] tracking-widest uppercase font-extrabold mb-1" style={{ color: 'var(--ink-500)' }}>
          {eyebrow}
        </div>
        <div className="font-extrabold text-[18px] leading-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          {title}
        </div>
        <div className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          {desc}
        </div>
      </div>
      {children && <div className="mt-2">{children}</div>}
    </div>
  )
}

interface MetaLineProps {
  date?: string | null
  status?: string | null
}

export function MetaLine({ date, status }: MetaLineProps) {
  if (!date && !status) return null
  return (
    <div className="flex flex-col gap-0.5 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
      {date && <span>Descargado el {formatDate(date)}</span>}
      {status && (
        <span>
          Estatus:{' '}
          <span className="font-bold" style={{ color: 'var(--ink-700)' }}>
            {status}
          </span>
        </span>
      )}
    </div>
  )
}

interface DocActionsProps {
  kind: DocKind
  busy: string | null
  onView: () => void
  onDownload: () => void
}

export function DocActions({ kind, busy, onView, onDownload }: DocActionsProps) {
  const viewing = busy === `${kind}:view`
  const downloading = busy === `${kind}:download`
  const anyBusy = !!busy && busy.startsWith(`${kind}:`)

  return (
    <div className="grid grid-cols-2 gap-2">
      <Btn kind="brand" onClick={onView} disabled={anyBusy} block>
        {viewing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Abriendo…
          </>
        ) : (
          <>
            <Eye size={16} /> Ver
          </>
        )}
      </Btn>
      <Btn kind="ghost" onClick={onDownload} disabled={anyBusy} block>
        {downloading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Descargando…
          </>
        ) : (
          <>
            <Download size={16} /> Descargar
          </>
        )}
      </Btn>
    </div>
  )
}

export function LoadingLine({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--ink-500)' }}>
      <Loader2 size={16} className="animate-spin" /> {label}
    </div>
  )
}
