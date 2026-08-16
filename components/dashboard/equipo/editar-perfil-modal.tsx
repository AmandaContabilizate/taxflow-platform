'use client'

import { Loader2, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { updateExecutiveProfile } from '@/features/team/actions/updateExecutiveProfile.action'
import { B2C_CHANNELS, SEGMENTS, type TeamMember } from '@/features/team/types'
import { Modal } from '../modal'

interface Props {
  member: TeamMember | null
  onClose: () => void
  onSaved: () => void
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export function EditarPerfilModal({ member, onClose, onSaved }: Props) {
  const [segmentId, setSegmentId] = useState<number | ''>('')
  const [b2cChannelId, setB2cChannelId] = useState<number | ''>('')
  const [team, setTeam] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!member) return
    setSegmentId(member.segmentId ?? '')
    setB2cChannelId(member.b2CChannelId ?? '')
    setTeam(member.team ?? '')
    setIsActive(member.isActive)
    setError(null)
  }, [member])

  if (!member) return null

  const isFinderFee = member.profileTypeId === 2
  const isB2C = segmentId === 1 || segmentId === 2
  const canSubmit = isFinderFee || (segmentId !== '' && (!isB2C || b2cChannelId !== ''))

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const res = await updateExecutiveProfile({
      memberUserId: member.userId,
      segmentId: !isFinderFee && segmentId !== '' ? segmentId : undefined,
      b2cChannelId: !isFinderFee && isB2C && b2cChannelId !== '' ? b2cChannelId : undefined,
      team,
      isActive,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    onSaved()
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title={`Editar perfil — ${member.fullName}`}>
      <div className="flex flex-col gap-4">
        {error && (
          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--hero-coral-soft-bg, #FEE2E2)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
          {member.email} · {member.profileTypeName}
          {member.vendorCode && <> · <code>{member.vendorCode}</code></>}
        </div>

        {isFinderFee ? (
          <div className="p-3 rounded-xl text-[12.5px]" style={{ background: 'var(--ink-50)', color: 'var(--ink-600)' }}>
            Los Finder Fee no tienen segmento ni meta: su esquema es 15% plano sobre las
            operaciones donde participan.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                Segmento
              </label>
              <select
                value={segmentId}
                onChange={(e) => {
                  const v = e.target.value === '' ? '' : Number(e.target.value)
                  setSegmentId(v as number | '')
                  if (v !== 1 && v !== 2) setB2cChannelId('')
                }}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer"
                style={inputStyle}
                disabled={loading}
              >
                <option value="">Selecciona segmento…</option>
                {SEGMENTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {isB2C && (
              <div>
                <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                  Canal B2C
                </label>
                <select
                  value={b2cChannelId}
                  onChange={(e) => setB2cChannelId(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer"
                  style={inputStyle}
                  disabled={loading}
                >
                  <option value="">Selecciona canal…</option>
                  {B2C_CHANNELS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
                  Cambiar el canal cambia su tabulador y meta a partir del siguiente cálculo.
                </p>
              </div>
            )}

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                Equipo / Sub-equipo <span className="font-normal" style={{ color: 'var(--ink-400)' }}>(opcional)</span>
              </label>
              <input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="ventas-a"
                maxLength={50}
                className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
                style={inputStyle}
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Activo */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            disabled={loading}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
            Perfil activo <span style={{ color: 'var(--ink-400)' }}>(inactivo: su código deja de ligar clientes)</span>
          </span>
        </label>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] transition cursor-pointer"
            style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong, var(--border))' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || loading}
            className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Guardar cambios
          </button>
        </div>
      </div>
    </Modal>
  )
}
