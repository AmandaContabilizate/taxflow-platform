'use client'

import { AlertCircle, Loader2, UserCog, UserMinus, UserPlus, UserRoundCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createCompanyUser, getCompanyUsers, setCompanyUserActive, setCompanyUserRole } from '@/features/empresa/actions/companyUsers.action'
import type { CompanyRoleOption, CompanyUser, EmpresaError } from '@/features/empresa/types'
import { Modal } from '../modal'
import { Badge, Card } from '../ui'

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

function roleLabel(r: { name: string; displayName: string | null }): string {
  return r.displayName?.trim() || r.name
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Usuarios de mi empresa (spec paso 12a): quién entra al portal de la empresa y con qué rol. Solo con
 * Empresa.AdministrarUsuarios. Las personas en seguimiento NO salen aquí: están en Personas.
 */
export function EmpresaUsuariosScreen() {
  const [users, setUsers] = useState<CompanyUser[]>([])
  const [roles, setRoles] = useState<CompanyRoleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [altaOpen, setAltaOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCompanyUsers()
      if (res.success) {
        setUsers(res.value.usuarios)
        setRoles(res.value.roles)
      } else setError(res.error)
    } catch (e) {
      console.error('[EmpresaUsuariosScreen] getCompanyUsers falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar los usuarios. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const changeRole = async (u: CompanyUser, roleId: string) => {
    if (!roleId || roleId === u.roleId) return
    setBusy(u.userId)
    setNotice(null)
    try {
      const res = await setCompanyUserRole(u.userId, roleId)
      if (!res.success) return setNotice(res.error.message)
      await load()
    } catch (e) {
      console.error('[EmpresaUsuariosScreen] setCompanyUserRole falló:', e)
      setNotice('No pudimos cambiar el rol.')
    } finally {
      setBusy(null)
    }
  }

  const toggleActive = async (u: CompanyUser) => {
    const next = !u.isActive
    if (!next && !window.confirm(`¿Dar de baja a ${u.fullName ?? u.email}? Ya no podrá entrar al portal; puedes reactivarlo después.`)) return
    setBusy(u.userId)
    setNotice(null)
    try {
      const res = await setCompanyUserActive(u.userId, next)
      if (!res.success) return setNotice(res.error.message)
      await load()
    } catch (e) {
      console.error('[EmpresaUsuariosScreen] setCompanyUserActive falló:', e)
      setNotice('No pudimos actualizar al usuario.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          {loading ? 'Cargando…' : `${users.length} usuario${users.length === 1 ? '' : 's'} con acceso al portal de tu empresa`}
        </div>
        <button type="button" onClick={() => setAltaOpen(true)} disabled={roles.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13.5px] transition hover:opacity-95 cursor-pointer disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      {notice && <div className="text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>{notice}</div>}

      {loading ? (
        <Card><div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando usuarios…</div></Card>
      ) : error ? (
        <Card><div className="py-10 text-center flex flex-col items-center gap-3"><AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} /><div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error.message}</div></div></Card>
      ) : users.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <UserCog size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>Solo tú entras al portal por ahora</div>
            <p className="text-[13px] max-w-[440px]" style={{ color: 'var(--ink-500)' }}>Da de alta a tu equipo y elige qué puede hacer cada quien. Recibirán su contraseña por correo.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Usuario', 'Rol', 'Alta', 'Estatus', ''].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)', opacity: u.isActive ? 1 : 0.55 }}>
                    <td className="py-3 px-3">
                      <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{u.fullName ?? u.email}</div>
                      <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</div>
                    </td>
                    <td className="py-3 px-3">
                      <select value={u.roleId ?? ''} onChange={(e) => void changeRole(u, e.target.value)} disabled={busy === u.userId || !u.isActive} className="px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none" style={inputStyle}>
                        {roles.map((r) => <option key={r.roleId} value={r.roleId}>{roleLabel(r)}{r.isCompanyOwned ? ' · propio' : ''}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-3"><Badge kind={u.isActive ? 'brand' : 'default'}>{u.isActive ? 'Activo' : 'Baja'}</Badge></td>
                    <td className="py-3 px-3">
                      <button type="button" disabled={busy === u.userId} onClick={() => void toggleActive(u)} title={u.isActive ? 'Dar de baja' : 'Reactivar'} className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer disabled:opacity-60" style={{ border: '1px solid var(--border)' }}>
                        {busy === u.userId ? <Loader2 size={14} className="animate-spin" /> : u.isActive ? <UserMinus size={14} style={{ color: 'var(--ink-500)' }} /> : <UserRoundCheck size={14} style={{ color: 'var(--brand-700)' }} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {altaOpen && <AltaUsuarioModal roles={roles} onClose={() => setAltaOpen(false)} onSaved={() => void load()} />}
    </div>
  )
}

function AltaUsuarioModal({ roles, onClose, onSaved }: { roles: CompanyRoleOption[]; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState(roles[0]?.roleId ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (fullName.trim().length < 3) return setError('Escribe el nombre completo.')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('El correo no es válido.')
    if (!roleId) return setError('Elige un rol.')
    setSaving(true)
    setError(null)
    try {
      const res = await createCompanyUser({ email: email.trim().toLowerCase(), fullName: fullName.trim(), phone: phone.trim() || null, roleId })
      if (!res.success) return setError(res.error.message)
      onSaved()
      onClose()
    } catch (e) {
      console.error('[AltaUsuarioModal] createCompanyUser falló:', e)
      setError('No pudimos dar de alta al usuario. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const selected = roles.find((r) => r.roleId === roleId)

  return (
    <Modal isOpen onClose={onClose} title="Nuevo usuario de mi empresa" maxWidth={520}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Recibirá su contraseña por correo y entrará con el rol que elijas. Siempre verá solo tu empresa.</p>
        <Field label="Nombre completo"><input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={saving} /></Field>
        <Field label="Correo"><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={saving} /></Field>
        <Field label="Teléfono (opcional)"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={saving} /></Field>
        <Field label="Rol" hint={selected?.description ?? undefined}>
          <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none focus:ring-2" style={inputStyle} disabled={saving}>
            {roles.map((r) => <option key={r.roleId} value={r.roleId}>{roleLabel(r)}{r.isCompanyOwned ? ' · propio de tu empresa' : ''}</option>)}
          </select>
        </Field>
        {error && <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>{error}</div>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={saving} className="px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>Cancelar</button>
          <button type="button" onClick={() => void submit()} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition hover:opacity-95 cursor-pointer disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} Dar de alta
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>{label}</label>
      {children}
      {hint && <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>{hint}</div>}
    </div>
  )
}
