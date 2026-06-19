'use client'

import { AlertCircle, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getPaidPendingDeclarations } from '@/features/operations/actions/getPaidPendingDeclarations.action'
import type { DeclarationKind, PaidPendingDeclaration } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'
import { Card, HelpBox } from '../ui'

function fmtDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Etiqueta + colores por statusCode (tokens del tema). Fallback neutro. */
function statusStyle(code: string): { label: string; bg: string; color: string } {
  switch (code) {
    case 'PendientePago':
      return { label: 'Pendiente de pago', bg: 'var(--coral-soft)', color: '#9E3A15' }
    case 'Pendiente':
      return { label: 'Pendiente', bg: 'var(--amber-soft)', color: '#7B5312' }
    case 'EnProceso':
      return { label: 'En proceso', bg: 'var(--amber-soft)', color: '#7B5312' }
    case 'Presentada':
    case 'Completada':
      return { label: code === 'Presentada' ? 'Presentada' : 'Completada', bg: 'var(--brand-100)', color: '#00A068' }
    default:
      return { label: code || '—', bg: 'var(--ink-50)', color: 'var(--ink-700)' }
  }
}

interface Props {
  kind: DeclarationKind
  help: string
  searchPlaceholder?: string
  emptyText?: string
}

export function PaidPendingList({ kind, help, searchPlaceholder, emptyText }: Props) {
  const [rows, setRows] = useState<PaidPendingDeclaration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getPaidPendingDeclarations(kind)
      if (cancelled) return
      if (res.success) setRows(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [kind])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.legalName.toLowerCase().includes(q) ||
        r.rfc.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.periodo.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>{help}</HelpBox>

      {/* Buscador */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder ?? 'Buscar por nombre, RFC, correo o periodo…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card>
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'}`}
          </div>
        </div>

        {error ? (
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {error}
            </div>
          </div>
        ) : loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando declaraciones…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Cliente', 'RFC', 'Ejercicio', 'Periodo', 'Estado', 'Venta', 'Asignado'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const st = statusStyle(r.statusCode)
                  return (
                    <tr key={r.declarationId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {r.legalName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {r.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{r.rfc}</code>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {r.fiscalYear}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {r.periodo}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                          #{r.saleId}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {fmtDate(r.saleDate)}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {fmtDate(r.assignedAt)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-8">
            <div style={{ color: 'var(--ink-500)' }}>{emptyText ?? 'No hay registros pendientes'}</div>
          </div>
        )}
      </Card>
    </div>
  )
}
