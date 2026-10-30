'use client'

import { History, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDiscountCodeAuthorizations } from '@/features/discountCodes/actions/getDiscountCodes.action'
import type { DiscountCodeAuthorization } from '@/features/discountCodes/types'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'

interface DiscountCodesLogModalProps {
  open: boolean
  onClose: () => void
}

export function DiscountCodesLogModal({ open, onClose }: DiscountCodesLogModalProps) {
  const [log, setLog] = useState<DiscountCodeAuthorization[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && log === null) {
      void (async () => {
        setLoading(true)
        setError(null)
        const res = await getDiscountCodeAuthorizations()
        if (res.success) setLog(res.value)
        else setError(res.error.message)
        setLoading(false)
      })()
    }
  }, [open, log])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl border border-[var(--border)] overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4.5 flex items-center justify-between border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
            >
              <History size={18} />
            </div>
            <div>
              <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Bitácora de autorizaciones
              </div>
              <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                Registro de quién activó o desactivó códigos fuera de tope (&gt;20% o &gt;3 declaraciones).
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--ink-400)] hover:text-[var(--ink-800)] hover:bg-[var(--ink-50)] transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto p-4">
          {loading ? (
            <div className="py-16 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
              <Loader2 size={18} className="animate-spin" /> Cargando bitácora…
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center text-[13px]" style={{ color: 'var(--violet-ink)' }}>
              {error}
            </div>
          ) : !log || log.length === 0 ? (
            <div className="py-16 px-6 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
              Aún no hay autorizaciones registradas.
            </div>
          ) : (
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead className="sticky top-0 z-10">
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--card)' }}>
                  {['Fecha', 'Código', 'Acción', 'Descuento', 'Usos máx.', 'RFCs', 'Autorizó'].map((h) => (
                    <th
                      key={h}
                      className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: 'var(--ink-500)', background: 'var(--card)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {log.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                      {new Date(a.authorizedAt).toLocaleString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-3">
                      <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-900)', fontWeight: 700 }}>
                        {a.code}
                      </code>
                    </td>
                    <td className="py-3 px-3">
                      <Badge kind={a.action === 'activated' ? 'brand' : 'default'}>
                        {a.action === 'activated' ? 'Autorizado' : 'Desactivado'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-900)' }}>
                      {a.discountTypeId === 2 ? <b>{a.declarationsCount} futuras</b> : <b>{a.discountPercent}%</b>}
                    </td>
                    <td className="py-3 px-3 text-[12.5px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                      {a.maxUses ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                      {a.whitelistedRfcsCount > 0 ? `${a.whitelistedRfcsCount} exclusivos` : 'Abierto'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                        {a.authorizedByName ?? '—'}
                      </div>
                      {a.authorizedByEmail && (
                        <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                          {a.authorizedByEmail}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
