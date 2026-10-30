'use client'

import { AlertCircle, Briefcase, Loader2, Pencil, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPartners } from '@/features/partners/actions/getPartners.action'
import type { Partner } from '@/features/partners/types'
import { MONO } from '../constants'
import { PartnerModal } from '../partners/partner-modal'
import { Badge, Card } from '../ui'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function PartnersScreen() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Partner | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const res = await getPartners()
    if (res.success) {
      setPartners(res.value)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (p: Partner) => {
    setEditing(p)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <Briefcase size={16} />
          {loading ? 'Cargando…' : `${partners.length} partner${partners.length === 1 ? '' : 's'}`}
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={16} /> Nuevo partner
        </button>
      </div>

      {loading ? (
        <Card>
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando partners…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} />
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
      ) : partners.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Briefcase size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Aún no hay partners
            </div>
            <p className="text-[13px] max-w-[380px]" style={{ color: 'var(--ink-500)' }}>
              Da de alta al primero: se generarán sus 3 códigos de descuento automáticos, listos
              para configurar.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <Plus size={16} /> Nuevo partner
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Partner', 'Código', 'Comisión', 'Alianza B2B2C', 'Códigos', 'Alta', 'Estatus', ''].map((h) => (
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
                {partners.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 px-3 text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                      {p.name}
                    </td>
                    <td className="py-3 px-3">
                      <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-700)' }}>{p.code}</code>
                    </td>
                    <td className="py-3 px-3">
                      <Badge kind={p.receivesCommission ? 'brand' : 'default'}>
                        {p.receivesCommission ? 'Sí · 10%' : 'No'}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {p.isAlliance ? (
                        <>
                          {p.b2B2CExecutiveName ?? '—'}
                          <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                            desde {formatDate(p.allianceStartDate)}
                          </div>
                        </>
                      ) : (
                        <span style={{ color: 'var(--ink-400)' }}>—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                      {p.discountCodesCount}
                    </td>
                    <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="py-3 px-3">
                      <Badge kind={p.isActive ? 'brand' : 'default'}>{p.isActive ? 'Activo' : 'Inactivo'}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        title="Editar partner"
                        aria-label={`Editar partner ${p.name}`}
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

      <PartnerModal
        open={modalOpen}
        partner={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => void load()}
      />
    </div>
  )
}
