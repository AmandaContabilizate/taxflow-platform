'use client'

import { Check, Copy, KeyRound, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { roleLabel, type RoleOverviewDto } from '@/features/roles/types'
import { inviteTeamMember } from '@/features/team/actions/inviteTeamMember.action'
import { B2C_CHANNELS, SEGMENTS, type MemberType } from '@/features/team/types'
import { MONO } from '../constants'
import { Modal } from '../modal'

interface Props {
  open: boolean
  onClose: () => void
  onInvited: () => void
}

// Roles que la gerencia comercial puede invitar (el backend valida de nuevo).
const ALLOWED_ROLE_NAMES = new Set(['seller', 'ventas', 'finder fee', 'finderfee'])

// El tipo de miembro determina el rol: Ejecutivo de ventas → Vendedor (Seller),
// Finder Fee → FinderFee. El campo queda bloqueado cuando el rol se resolvió.
function defaultRoleFor(type: MemberType, list: RoleOverviewDto[]): string {
  const wanted = type === 2 ? new Set(['finder fee', 'finderfee']) : new Set(['seller', 'ventas'])
  return list.find((r) => wanted.has(normalizeName(r.name)))?.id ?? ''
}

function normalizeName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

export function InvitarMiembroModal({ open, onClose, onInvited }: Props) {
  const [roles, setRoles] = useState<RoleOverviewDto[]>([])
  const [memberType, setMemberType] = useState<MemberType>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
  const [segmentId, setSegmentId] = useState<number | ''>('')
  const [b2cChannelId, setB2cChannelId] = useState<number | ''>('')
  const [team, setTeam] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentCode, setSentCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const res = await getRolesList()
      if (res.success) {
        const allowed = res.value.filter((r) => ALLOWED_ROLE_NAMES.has(normalizeName(r.name)))
        setRoles(allowed.length > 0 ? allowed : res.value)
      } else {
        // Sin ViewRole (u otro error) el dropdown quedaría vacío en silencio:
        // mejor decirlo para que sea diagnosticable desde la UI.
        setError(`No pudimos cargar los roles: ${res.error.message}`)
      }
    })()
  }, [open])

  // Autoselecciona el rol según el tipo de miembro (y lo re-selecciona al cambiarlo).
  useEffect(() => {
    if (roles.length === 0) return
    setRoleId(defaultRoleFor(memberType, roles))
  }, [memberType, roles])

  const isB2C = segmentId === 1 || segmentId === 2
  const canSubmit =
    fullName.trim().length > 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    roleId !== '' &&
    (memberType === 2 || (segmentId !== '' && (!isB2C || b2cChannelId !== '')))

  const reset = () => {
    setMemberType(1)
    setFullName('')
    setEmail('')
    setRoleId('')
    setSegmentId('')
    setB2cChannelId('')
    setTeam('')
    setError(null)
    setSentCode(null)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = async () => {
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    const res = await inviteTeamMember({
      fullName: fullName.trim(),
      email: email.trim(),
      roleId,
      memberType,
      segmentId: memberType === 1 && segmentId !== '' ? segmentId : undefined,
      b2cChannelId: memberType === 1 && isB2C && b2cChannelId !== '' ? b2cChannelId : undefined,
      team: memberType === 1 ? team : undefined,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setSentCode(res.value.vendorCode)
    onInvited()
  }

  const copyCode = () => {
    if (!sentCode) return
    void navigator.clipboard.writeText(sentCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  if (!open) return null

  // Confirmación post-envío (mockup "Invitación enviada")
  if (sentCode) {
    return (
      <Modal isOpen onClose={close} title="Invitación enviada">
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
            <b>{fullName}</b> recibió un correo con sus credenciales de acceso.
          </p>
          <div className="rounded-xl p-4" style={{ background: 'var(--hero-brand-soft, var(--ink-50))' }}>
            <div className="flex items-center gap-2 text-[12px] font-bold mb-2" style={{ color: 'var(--ink-700)' }}>
              <KeyRound size={14} /> Código de vendedor asignado
            </div>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 px-3 py-2 rounded-lg text-[15px] font-bold"
                style={{ ...MONO, background: 'var(--card)', color: 'var(--ink-900)', border: '1px solid var(--border)' }}
              >
                {sentCode}
              </code>
              <button
                type="button"
                onClick={copyCode}
                title="Copiar código"
                className="p-2.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer"
                style={{ border: '1px solid var(--border)' }}
              >
                {copied ? (
                  <Check size={16} style={{ color: 'var(--brand-700)' }} />
                ) : (
                  <Copy size={16} style={{ color: 'var(--ink-500)' }} />
                )}
              </button>
            </div>
            <p className="text-[12px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Toda venta o usuario registrado con este código se vinculará automáticamente a {fullName.split(' ')[0]}.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="w-full py-3 rounded-full font-bold text-[14px] transition hover:opacity-95 cursor-pointer"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            Listo
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen onClose={close} title="Nuevo miembro del equipo">
      <div className="flex flex-col gap-4">
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Le enviaremos sus credenciales por correo. Al entrar, su perfil quedará creado con los
          permisos de su rol.
        </p>

        {error && (
          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--hero-coral-soft-bg, #FEE2E2)', color: '#991B1B' }}>
            {error}
          </div>
        )}

        {/* Tipo de miembro */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Tipo de miembro
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { value: 1 as MemberType, label: 'Ejecutivo de ventas', hint: 'Empleado de Contabilízate' },
              { value: 2 as MemberType, label: 'Finder Fee', hint: 'Vendedor externo · 15% plano' },
            ]).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMemberType(opt.value)}
                className="p-3 rounded-xl text-left transition-colors cursor-pointer"
                style={{
                  border: `2px solid ${memberType === opt.value ? 'var(--brand-500)' : 'var(--border)'}`,
                  background: memberType === opt.value ? 'var(--hero-brand-soft)' : 'var(--card)',
                }}
              >
                <div className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>{opt.label}</div>
                <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{opt.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Nombre completo
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej. Diana Reyes"
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        {/* Correo */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            {memberType === 1 ? 'Correo corporativo' : 'Correo'}
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={memberType === 1 ? 'nombre@contabilizate.com' : 'correo@ejemplo.com'}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2"
            style={inputStyle}
            disabled={loading}
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
            Rol
          </label>
          {/* El rol lo fija el tipo de miembro; solo se habilita el combo como
              respaldo si el catálogo no trae el rol esperado. */}
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer disabled:cursor-not-allowed"
            style={{ ...inputStyle, opacity: roleId !== '' ? 0.75 : 1 }}
            disabled={loading || roleId !== ''}
          >
            <option value="">Selecciona un rol…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{roleLabel(r)}</option>
            ))}
          </select>
          <p className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>
            El rol se asigna automáticamente según el tipo de miembro.
          </p>
        </div>

        {memberType === 1 && (
          <>
            {/* Segmento */}
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

            {/* Canal B2C */}
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
                  Define su tabulador y meta (Tradicional $60,199 · Módulo $81,150).
                </p>
              </div>
            )}

            {/* Equipo */}
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

        {/* Aviso código de vendedor */}
        <div
          className="flex items-start gap-2.5 p-3 rounded-xl text-[12.5px]"
          style={{ background: 'var(--hero-brand-soft, var(--ink-50))', color: 'var(--ink-700)' }}
        >
          <KeyRound size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-700, var(--primary))' }} />
          <div>
            <b>Código de vendedor</b>
            <br />
            Al aceptar, este código quedará vinculado a sus ventas y a los usuarios que se
            registren con él.
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={close}
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
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Enviar invitación
          </button>
        </div>
      </div>
    </Modal>
  )
}
