'use client'

import { History } from 'lucide-react'
import type { DeclarationLog } from '@/features/operations/types'
import { declarationStatusLabelById, fmtDate } from '../declaraciones/parts'
import { Card } from '../ui'

/** Quién originó cada movimiento de la bitácora, en palabras del contador. */
const SOURCE_LABEL: Record<string, string> = {
  'contador-reopen': 'Reapertura del contador',
  'contador-resend': 'Reenvío al cliente',
  'client-report': 'Respuesta del cliente',
  manual: 'Cambio manual',
  'accountant-upload': 'Acuse subido por el contador',
  'ai-poster': 'Presentada por el robot',
  'portal-scrape': 'Detectada en el portal del SAT',
}

/** Encabezado de la nota según quién la escribió. */
const NOTE_LABEL: Record<string, string> = {
  'contador-reopen': 'Motivo de la reapertura',
  'contador-resend': 'Mensaje del reenvío',
  'client-report': 'Comentario del cliente',
}

/**
 * Historial de la declaración (`Declarations.DeclarationLog`): cada cambio de estatus con
 * quién lo hizo y su nota. Aquí es donde el contador ve el motivo de una reapertura y el
 * mensaje que escribió al reenviar, que el cliente nunca ve.
 */
export function DeclarationHistory({ logs, loading }: { logs: DeclarationLog[]; loading: boolean }) {
  const ordered = [...logs].sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())

  return (
    <Card>
      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <History size={17} style={{ color: 'var(--ink-500)' }} />
          <h3 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Historial de la declaración
          </h3>
        </div>

        {loading && (
          <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Cargando historial…
          </p>
        )}

        {!loading && ordered.length === 0 && (
          <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
            Esta declaración todavía no tiene movimientos registrados.
          </p>
        )}

        {!loading && ordered.length > 0 && (
          <ol className="flex flex-col">
            {ordered.map((log) => {
              const from = log.oldStatusId != null ? declarationStatusLabelById(log.oldStatusId) : null
              const to = declarationStatusLabelById(log.newStatusId)
              const noteLabel = NOTE_LABEL[log.source] ?? 'Nota'
              return (
                <li
                  key={log.id}
                  className="flex flex-col gap-1 py-3"
                  style={{ borderTop: '1px solid var(--border)' }}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>
                      {from && from !== to ? `${from} → ${to}` : to}
                    </span>
                    <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                      {fmtDate(log.changedAt)}
                    </span>
                  </div>
                  <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                    {SOURCE_LABEL[log.source] ?? log.source}
                  </span>
                  {log.note && (
                    <div
                      className="mt-1 rounded-lg px-3 py-2 text-[12.5px]"
                      style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--ink-900)' }}
                    >
                      <span className="font-bold" style={{ color: 'var(--ink-700)' }}>
                        {noteLabel}:{' '}
                      </span>
                      {log.note}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </Card>
  )
}
