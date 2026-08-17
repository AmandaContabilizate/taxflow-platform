'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react'
import { getProviderCors } from '@/features/partnership/actions/getProviderCors.action'
import { addProviderCors } from '@/features/partnership/actions/addProviderCors.action'
import { deleteProviderCors } from '@/features/partnership/actions/deleteProviderCors.action'
import type { ProviderCorsItem } from '@/features/partnership/types'
import { Input } from '@/components/ui/input'
import { Btn, Card, ErrorState } from '../ui'

export function CorsTab() {
  const [items, setItems] = useState<ProviderCorsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [hostName, setHostName] = useState('')
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getProviderCors()
    if (res.success) setItems(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleAdd() {
    if (!hostName.trim()) return
    setAdding(true)
    setActionError(null)
    const res = await addProviderCors({ hostName: hostName.trim(), label: label.trim() || undefined })
    setAdding(false)
    if (res.success) {
      setHostName('')
      setLabel('')
      await load()
    } else {
      setActionError(res.error.message)
    }
  }

  async function handleDelete(item: ProviderCorsItem) {
    if (!confirm(`¿Eliminar el host "${item.hostName}"?`)) return
    setDeletingId(item.providerCorsId)
    setActionError(null)
    const res = await deleteProviderCors(item.providerCorsId)
    setDeletingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  return (
    <Card>
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          {loading ? 'Cargando…' : `${items.length} hosts CORS`}
        </div>
      </div>

      <div className="px-5 py-4 flex gap-3 items-end flex-wrap border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>HostName</label>
          <Input
            placeholder="https://example.com"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>Etiqueta (opcional)</label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} className="w-48" />
        </div>
        <Btn kind="primary" size="sm" onClick={handleAdd} disabled={adding || !hostName.trim()}>
          {adding ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Agregar
        </Btn>
      </div>

      {actionError && (
        <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      {error ? (
        <ErrorState message={error} />
      ) : loading ? (
        <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando hosts…
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['HostName', 'Etiqueta', 'Creado', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.providerCorsId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="px-5 py-4 font-semibold" style={{ color: 'var(--ink-900)' }}>{item.hostName}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>{item.label ?? '—'}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--ink-700)' }}>
                    {new Date(item.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.providerCorsId}
                        title="Eliminar"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-40"
                        style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
                      >
                        {deletingId === item.providerCorsId ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-8">
              <div style={{ color: 'var(--ink-500)' }}>No hay hosts CORS registrados.</div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
