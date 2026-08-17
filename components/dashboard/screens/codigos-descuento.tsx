'use client'

import { AlertCircle, AlertTriangle, Loader2, Pencil, Plus, Tag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getDiscountCodeLookups, getDiscountCodes } from '@/features/discountCodes/actions/getDiscountCodes.action'
import type { DiscountCodeAdmin, DiscountCodeLookups } from '@/features/discountCodes/types'
import { CodigoModal } from '../codigos-descuento/codigo-modal'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'

type OwnerFilter = 'all' | 'user' | 'partner' | 'none'

export function CodigosDescuentoScreen() {
  const [codes, setCodes] = useState<DiscountCodeAdmin[]>([])
  const [lookups, setLookups] = useState<DiscountCodeLookups | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DiscountCodeAdmin | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const [codesRes, lookupsRes] = await Promise.all([getDiscountCodes(), getDiscountCodeLookups()])
    if (codesRes.success) {
      setCodes(codesRes.value)
    } else {
      setError(codesRes.error.message)
    }
    if (lookupsRes.success) setLookups(lookupsRes.value)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = codes.filter((c) => {
    if (ownerFilter !== 'all' && c.ownerType !== ownerFilter) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      return (
        c.code.toLowerCase().includes(q) ||
        (c.ownerName ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (c: DiscountCodeAdmin) => {
    setEditing(c)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o dueño…"
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none focus:ring-2 min-w-[220px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value as OwnerFilter)}
            className="px-3 py-2 rounded-lg text-[13.5px] outline-none focus:ring-2 cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            <option value="all">Todos los dueños</option>
            <option value="user">Ejecutivos / Finder Fee</option>
            <option value="partner">Partners</option>
            <option value="none">Sin dueño</option>
          </select>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={16} /> Nuevo código
        </button>
      </div>

      {loading ? (
        <Card>
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando códigos…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle size={22} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >
              Reintentar
            </button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Tag size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              {codes.length === 0 ? 'Aún no hay códigos — crea el primero' : 'Sin resultados con esos filtros'}
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Código', 'Dueño', 'Descuento', 'Planes', 'Usos', 'RFCs', 'Estatus', ''].map((h) => (
                    <th
                      key={h}
                      className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ color: 'var(--ink-500)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-3">
                      <code style={{ ...MONO, fontSize: '12.5px', color: 'var(--ink-900)', fontWeight: 700 }}>
                        {c.code}
                      </code>
                      {c.description && (
                        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{c.description}</div>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {c.ownerType === 'none' ? (
                        <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Sin dueño</span>
                      ) : (
                        <>
                          <Badge kind={c.ownerType === 'partner' ? 'sky' : c.ownerProfileType === 'Finder Fee' ? 'amber' : 'brand'}>
                            {c.ownerType === 'partner' ? 'Partner' : c.ownerProfileType ?? 'Ejecutivo'}
                          </Badge>
                          <div className="text-[12px] mt-1" style={{ color: 'var(--ink-700)' }}>{c.ownerName}</div>
                        </>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-900)' }}>
                      {c.discountTypeId === 2 ? (
                        <>
                          <b>{c.declarationsCount}</b> declaraciones
                          <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>de regularización</div>
                        </>
                      ) : (
                        <b>{c.discountPercent}%</b>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {c.subscriptionPlanIds.length === 0 ? (
                        <span className="inline-flex items-center gap-1" style={{ color: '#9E3A15' }}>
                          <AlertTriangle size={12} /> sin planes
                        </span>
                      ) : (
                        c.subscriptionPlanIds.length
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                      {c.usedCount}/{c.maxUses ?? '—'}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {c.whitelistedRfcsCount > 0 ? `${c.whitelistedRfcsCount} exclusivos` : 'Abierto'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge kind={c.isActive ? 'brand' : 'default'}>{c.isActive ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        title="Editar código"
                        aria-label={`Editar código ${c.code}`}
                        className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer"
                        style={{ border: '1px solid var(--border)' }}
                      >
                        <Pencil size={14} style={{ color: 'var(--ink-500)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CodigoModal
        open={modalOpen}
        code={editing}
        lookups={lookups}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  )
}
