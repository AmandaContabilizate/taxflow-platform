'use client'

import { AlertCircle, Check, Copy, Loader2, Pencil, UserPlus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTeamMembers } from '@/features/team/actions/getTeamMembers.action'
import type { TeamMember } from '@/features/team/types'
import { MONO } from '../constants'
import { EditarPerfilModal } from '../equipo/editar-perfil-modal'
import { InvitarMiembroModal } from '../equipo/invitar-miembro-modal'
import { Badge, Card } from '../ui'

export function EquipoScreen() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    const res = await getTeamMembers()
    if (res.success) {
      setMembers(res.value)
    } else {
      setError(res.error.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <Users size={16} />
          {loading ? 'Cargando…' : `${members.length} colaborador${members.length === 1 ? '' : 'es'} a tu cargo`}
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <UserPlus size={16} /> Invitar miembro
        </button>
      </div>

      {/* Estados */}
      {loading ? (
        <Card>
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando tu equipo…
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
      ) : members.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Users size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Aún no tienes colaboradores
            </div>
            <p className="text-[13px] max-w-[360px]" style={{ color: 'var(--ink-500)' }}>
              Invita al primero: recibirá sus credenciales por correo y su código de vendedor
              quedará listo para ligar clientes y ventas.
            </p>
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="mt-1 inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              <UserPlus size={16} /> Invitar miembro
            </button>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Colaborador', 'Tipo', 'Segmento', 'Código', 'Equipo', 'Estatus', ''].map((h) => (
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
                {members.map((m) => (
                  <MemberRow key={m.userId} member={m} onEdit={() => setEditing(m)} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <InvitarMiembroModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvited={() => void load()}
      />
      <EditarPerfilModal
        member={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void load()}
      />
    </div>
  )
}

function MemberRow({ member, onEdit }: { member: TeamMember; onEdit: () => void }) {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    if (!member.vendorCode) return
    void navigator.clipboard.writeText(member.vendorCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  const isFinderFee = member.profileTypeId === 2

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="py-3 px-3">
        <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
          {member.fullName}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{member.email}</div>
      </td>
      <td className="py-3 px-3">
        <Badge kind={isFinderFee ? 'amber' : 'brand'}>{member.profileTypeName}</Badge>
      </td>
      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
        {member.segmentName ?? '—'}
        {member.b2CChannelName && (
          <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{member.b2CChannelName}</div>
        )}
      </td>
      <td className="py-3 px-3">
        {member.vendorCode ? (
          <span className="inline-flex items-center gap-1.5">
            <code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-900)' }}>{member.vendorCode}</code>
            <button
              type="button"
              onClick={copy}
              title="Copiar código"
              aria-label={`Copiar código ${member.vendorCode}`}
              className="p-1 rounded-md transition hover:bg-[var(--ink-50)] cursor-pointer"
            >
              {copied ? (
                <Check size={13} style={{ color: 'var(--brand-700)' }} />
              ) : (
                <Copy size={13} style={{ color: 'var(--ink-400)' }} />
              )}
            </button>
          </span>
        ) : (
          <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>—</span>
        )}
      </td>
      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
        {member.team ?? '—'}
      </td>
      <td className="py-3 px-3">
        <Badge kind={member.isActive ? 'brand' : 'default'}>{member.isActive ? 'Activo' : 'Inactivo'}</Badge>
      </td>
      <td className="py-3 px-3">
        <button
          type="button"
          onClick={onEdit}
          title="Editar perfil comercial"
          aria-label={`Editar perfil de ${member.fullName}`}
          className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer"
          style={{ border: '1px solid var(--border)' }}
        >
          <Pencil size={14} style={{ color: 'var(--ink-500)' }} />
        </button>
      </td>
    </tr>
  )
}
