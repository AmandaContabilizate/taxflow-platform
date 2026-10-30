'use client'

import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { ACCOUNT_STATUS } from '@/features/cancellations/types'
import { fmtDate } from '../declaraciones/parts'
import { periodLabel } from '../operaciones/purchased-declarations'
import { Badge } from '../ui'

/** Claims del módulo (departamento Clientes); el menú abre con cualquiera de los tres. */
export const CANCEL_DECLARATIONS_CLAIM = 'GerenciaComercial.CancelDeclaraciones'
export const CANCEL_TAXPAYER_CLAIM = 'GerenciaComercial.CancelCliente'
export const REACTIVATE_CLAIM = 'GerenciaComercial.ReactivarCancelaciones'

export const isDeactivated = (accountStatusId: number | null | undefined) =>
  accountStatusId === ACCOUNT_STATUS.DEACTIVATED_SOFT || accountStatusId === ACCOUNT_STATUS.DEACTIVATED_HARD

/** "Mayo 2026", "Anual 2025 · Complementaria 1". */
export function declarationPeriodLabel(
  fiscalYear: number | null | undefined,
  periodValueId: number | null | undefined,
  complementNumber?: number | null,
): string {
  const base = `${periodLabel(periodValueId)} ${fiscalYear ?? ''}`.trim()
  return (complementNumber ?? 0) > 0 ? `${base} · Complementaria ${complementNumber}` : base
}

/** Chip del estatus de cuenta del contribuyente (`Catalogs.AccountStatus`). */
export function AccountStatusChip({
  accountStatusId,
  deactivatedAt,
  hideActive = false,
}: {
  accountStatusId: number | null | undefined
  deactivatedAt?: string | null
  /** En listados generales (Clientes, Contribuyentes) solo se marca al cancelado. */
  hideActive?: boolean
}) {
  if (accountStatusId === ACCOUNT_STATUS.DEACTIVATED_HARD) return <Badge kind="danger">Baja definitiva</Badge>
  if (accountStatusId === ACCOUNT_STATUS.DEACTIVATED_SOFT) {
    return <Badge kind="danger">Cancelado{deactivatedAt ? ` el ${fmtDate(deactivatedAt)}` : ''}</Badge>
  }
  if (hideActive) return null
  return <Badge kind="brand">Activo</Badge>
}

type NoticeKind = 'warning' | 'danger' | 'success' | 'info'

const NOTICE_STYLE: Record<NoticeKind, { background: string; color: string; border: string }> = {
  warning: { background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--hero-amber-border, var(--border))' },
  danger: { background: 'var(--danger-soft)', color: 'var(--danger-ink)', border: '1px solid var(--border)' },
  success: { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)' },
  info: { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' },
}

/** Aviso inline de los modales (no hay Toaster en el layout: todo se muestra en su lugar). */
export function Notice({ kind = 'warning', children }: { kind?: NoticeKind; children: ReactNode }) {
  return (
    <div
      className="rounded-xl px-3.5 py-3 flex items-start gap-2 text-[12.5px] font-semibold"
      style={NOTICE_STYLE[kind]}
    >
      {kind === 'success' ? (
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}

export const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export const secondaryBtn =
  'px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60 cursor-pointer transition hover:opacity-90'
export const secondaryBtnStyle = {
  background: 'var(--card)',
  border: '1px solid var(--border-strong)',
  color: 'var(--foreground)',
} as const

export const dangerBtn =
  'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition hover:opacity-90'
/** Fondo de color fijo (rojo funcional): el texto blanco literal es la excepción permitida. */
export const dangerBtnStyle = { background: 'var(--danger)', color: '#fff' } as const

export const primaryBtnStyle = { background: 'var(--primary)', color: 'var(--primary-foreground)' } as const

export function FieldLabel({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
      {children}
      {hint && (
        <span className="font-normal" style={{ color: 'var(--ink-400)' }}>
          {' '}
          {hint}
        </span>
      )}
    </label>
  )
}
