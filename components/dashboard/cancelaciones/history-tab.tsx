'use client'

import { History, Loader2, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'
import {
  ACCOUNT_STATUS,
  type CancellationDeclarationLog,
  type CancellationTaxpayer,
  DECLARATION_STATUS_CANCELLED,
  type TaxpayerDeactivationLog,
} from '@/features/cancellations/types'
import { declarationStatusLabelById, fmtDate } from '../declaraciones/parts'
import { useHasPermission } from '../permissions'
import { Badge, Card, ErrorState } from '../ui'
import { REACTIVATE_CLAIM, declarationPeriodLabel, isDeactivated, secondaryBtn, secondaryBtnStyle } from './parts'
import type { ReactivateTarget } from './reactivate-modal'

const SOURCE_LABEL: Record<string, string> = {
  'gerencia-cancel': 'Cancelación de declaración',
  'gerencia-cancel-cliente': 'Cancelada con la baja del cliente',
  'gerencia-reactivate': 'Reactivación',
}

/** `Catalogs.DeactivationOrigin`: 1 Client, 2 Staff. */
const ORIGIN_LABEL: Record<number, string> = { 1: 'el propio cliente', 2: 'personal interno' }

function accountEventLabel(log: TaxpayerDeactivationLog): { label: string; kind: 'danger' | 'brand' } {
  if (log.accountStatusId === ACCOUNT_STATUS.ACTIVE) return { label: 'Cuenta reactivada', kind: 'brand' }
  if (log.accountStatusId === ACCOUNT_STATUS.DEACTIVATED_HARD) return { label: 'Baja definitiva', kind: 'danger' }
  return { label: 'Cliente cancelado', kind: 'danger' }
}

/**
 * Historial del RFC: bajas/reactivaciones de la cuenta (`Users.TaxpayerDeactivation`) y los
 * movimientos `gerencia-%` de sus declaraciones. "Reactivar" solo con el claim y mientras la
 * declaración siga en 19 (o el cliente en baja Soft).
 */
export function HistoryTab({
  taxpayer,
  taxpayerLogs,
  declarationLogs,
  loading,
  error,
  onReactivate,
}: {
  taxpayer: CancellationTaxpayer
  taxpayerLogs: TaxpayerDeactivationLog[]
  declarationLogs: CancellationDeclarationLog[]
  loading: boolean
  error: string | null
  onReactivate: (target: ReactivateTarget) => void
}) {
  const canReactivate = useHasPermission(REACTIVATE_CLAIM)
  const accountEvents = useMemo(
    () => [...taxpayerLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [taxpayerLogs],
  )
  const declEvents = useMemo(
    () => [...declarationLogs].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()),
    [declarationLogs],
  )
  // Una declaración puede tener varios movimientos; el botón va solo en el más reciente.
  const latestByDeclaration = useMemo(() => {
    const seen = new Set<number>()
    const out = new Set<number>()
    for (const l of declEvents) {
      if (seen.has(l.declarationId)) continue
      seen.add(l.declarationId)
      out.add(l.logId)
    }
    return out
  }, [declEvents])

  if (error) {
    return (
      <Card>
        <ErrorState message={error} />
      </Card>
    )
  }
  if (loading) {
    return (
      <Card>
        <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando historial…
        </div>
      </Card>
    )
  }

  const taxpayerSoft = taxpayer.accountStatusId === ACCOUNT_STATUS.DEACTIVATED_SOFT

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))' }}>
      <Card>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <History size={17} style={{ color: 'var(--ink-500)' }} />
              <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Cuenta del contribuyente</h3>
            </div>
            {canReactivate && taxpayerSoft && (
              <button
                type="button"
                onClick={() => onReactivate({ kind: 'taxpayer', taxpayer })}
                className={`${secondaryBtn} inline-flex items-center gap-1.5 text-[12.5px]`}
                style={secondaryBtnStyle}
              >
                <RotateCcw size={13} /> Reactivar cliente
              </button>
            )}
          </div>
          {accountEvents.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
              {isDeactivated(taxpayer.accountStatusId)
                ? 'El contribuyente está dado de baja, pero no hay bitácora de la baja.'
                : 'La cuenta nunca se ha cancelado.'}
            </p>
          ) : (
            <ol className="flex flex-col">
              {accountEvents.map((log) => {
                const ev = accountEventLabel(log)
                return (
                  <li key={log.id} className="flex flex-col gap-1 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Badge kind={ev.kind}>{ev.label}</Badge>
                      <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{fmtDate(log.createdAt)}</span>
                    </div>
                    <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                      {log.createdByName ?? log.createdBy ?? 'Sistema'}
                      {log.deactivationOriginId != null && ORIGIN_LABEL[log.deactivationOriginId] && ` · ${ORIGIN_LABEL[log.deactivationOriginId]}`}
                      {log.reasonDescription && ` · ${log.reasonDescription}`}
                      {log.requestReference && ` · Folio ${log.requestReference}`}
                    </span>
                    {log.reasonNote && (
                      <div
                        className="mt-1 rounded-lg px-3 py-2 text-[12.5px]"
                        style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--ink-900)' }}
                      >
                        {log.reasonNote}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </Card>

      <Card>
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History size={17} style={{ color: 'var(--ink-500)' }} />
            <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Declaraciones</h3>
          </div>
          {declEvents.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
              Ninguna declaración de este RFC se ha cancelado o reactivado desde gerencia.
            </p>
          ) : (
            <ol className="flex flex-col">
              {declEvents.map((log) => {
                const from = log.oldStatusId != null ? declarationStatusLabelById(log.oldStatusId) : null
                const to = declarationStatusLabelById(log.newStatusId)
                const period = declarationPeriodLabel(log.fiscalYear, log.periodValueId, log.complementNumber)
                const stillCancelled =
                  log.currentStatusId == null
                    ? log.newStatusId === DECLARATION_STATUS_CANCELLED
                    : log.currentStatusId === DECLARATION_STATUS_CANCELLED
                const showReactivate = canReactivate && latestByDeclaration.has(log.logId) && stillCancelled
                return (
                  <li key={log.logId} className="flex flex-col gap-1 py-3" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>
                        {period}
                        {log.regimeSatCode && <span className="font-normal" style={{ color: 'var(--ink-500)' }}> · {log.regimeSatCode}</span>}
                      </span>
                      <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{fmtDate(log.changedAt)}</span>
                    </div>
                    <span className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                      {from && from !== to ? `${from} → ${to}` : to}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                      {SOURCE_LABEL[log.source] ?? log.source}
                      {(log.changedByName ?? log.changedBy) && ` · ${log.changedByName ?? log.changedBy}`}
                    </span>
                    {log.note && (
                      <div
                        className="mt-1 rounded-lg px-3 py-2 text-[12.5px]"
                        style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--ink-900)' }}
                      >
                        {log.note}
                      </div>
                    )}
                    {showReactivate && (
                      <div className="mt-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onReactivate({
                              kind: 'declaration',
                              declarationId: log.declarationId,
                              label: `${period}${log.regimeSatCode ? ` · ${log.regimeSatCode}` : ''}`,
                            })
                          }
                          disabled={taxpayerSoft}
                          title={taxpayerSoft ? 'Reactiva primero al cliente' : 'Regresa la declaración a su estatus anterior'}
                          className={`${secondaryBtn} inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5`}
                          style={secondaryBtnStyle}
                        >
                          <RotateCcw size={12} /> Reactivar
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </div>
      </Card>
    </div>
  )
}
