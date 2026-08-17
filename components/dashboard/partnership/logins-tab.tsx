'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { getAuthLogs } from '@/features/partnership/actions/getAuthLogs.action'
import type { AuthLogItem } from '@/features/partnership/types'
import { MONO } from '../constants'
import { Badge, Card, ErrorState } from '../ui'

export function LoginsTab() {
  const [items, setItems] = useState<AuthLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getAuthLogs()
    if (res.success) setItems(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          {loading ? 'Cargando…' : `${items.length} registros (últimos 5 días)`}
        </div>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando logs…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Fecha', 'Resultado', 'Usuario', 'Token ID', 'Detalles'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.authLogId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                    {new Date(item.logDate).toLocaleString('es-MX')}
                  </td>
                  <td className="px-5 py-4">
                    <Badge kind={item.result.toLowerCase() === 'success' ? 'brand' : 'coral'}>
                      {item.result}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs" style={{ ...MONO, color: 'var(--ink-700)' }}>
                    {item.userId ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-xs truncate max-w-[150px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                    {item.tokenId ?? '—'}
                  </td>
                  <td className="px-5 py-4 text-xs truncate max-w-[200px]" style={{ color: 'var(--ink-700)' }}>
                    {item.details ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8">
              <div style={{ color: 'var(--ink-500)' }}>No hay registros de login en los últimos 5 días.</div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
