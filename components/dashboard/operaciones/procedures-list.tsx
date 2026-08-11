'use client'

import { AlertCircle, ExternalLink, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getProcedureSales } from '@/features/operations/actions/getProcedureSales.action'
import type { ProcedureSale } from '@/features/operations/types'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'

function fmtDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusStyle(status: string): { bg: string; color: string } {
  switch (status) {
    case 'Pendiente':
      return { bg: 'var(--amber-soft)', color: '#7B5312' }
    case 'En proceso':
    case 'EnProceso':
      return { bg: 'var(--amber-soft)', color: '#7B5312' }
    case 'Completado':
    case 'Completada':
      return { bg: 'var(--brand-100)', color: '#00A068' }
    default:
      return { bg: 'var(--ink-50)', color: 'var(--ink-700)' }
  }
}

export function ProceduresList() {
  const [rows, setRows] = useState<ProcedureSale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getProcedureSales()
      console.log(res);
      if (cancelled) return
      if (res.success) setRows(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.legalName.toLowerCase().includes(q) ||
        r.rfc.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.productName.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>
        Trámites adicionales vendidos a los contribuyentes. Aquí das seguimiento a su estatus y subes el resultado
        cuando se completan.
      </HelpBox>

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
              placeholder="Buscar por nombre, RFC, correo o trámite…"
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
            {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'trámite' : 'trámites'}`}
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
            <Loader2 size={18} className="animate-spin" /> Cargando trámites…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Cliente', 'RFC', 'Trámite', 'Estado', 'Creado', 'Resultado'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const st = statusStyle(r.status)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
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
                        <div className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {r.productName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          Venta #{r.saleId}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {fmtDate(r.createdAt)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {r.resultPdfUrl ? (
                          <a
                            href={r.resultPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold"
                            style={{ color: 'var(--brand-700)' }}
                          >
                            <ExternalLink size={14} /> Ver PDF
                          </a>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
                            —
                          </span>
                        )}
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
            <div style={{ color: 'var(--ink-500)' }}>No hay trámites adicionales</div>
          </div>
        )}
      </Card>
    </div>
  )
}
