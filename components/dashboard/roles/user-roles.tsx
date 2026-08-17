'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ChevronRight, Loader2, Search, Star, UserCog, Users, Zap } from 'lucide-react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { getRoleUsers } from '@/features/roles/actions/getRoleUsers.action'
import { getUserRoles } from '@/features/roles/actions/getUserRoles.action'
import { getUsers } from '@/features/users/actions/getUsers.action'
import type { UserListItem } from '@/features/users/types'
import { assignRole } from '@/features/roles/actions/assignRole.action'
import { removeRole } from '@/features/roles/actions/removeRole.action'
import { replaceUserRoles } from '@/features/roles/actions/replaceUserRoles.action'
import { switchRole } from '@/features/roles/actions/switchRole.action'
import { roleLabel, type RoleOverviewDto, type RoleUserDto, type UserRoleDto } from '@/features/roles/types'
import { Badge, Btn, Card, ErrorState, HelpBox } from '../ui'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function UserRoles({
  initialUserId,
  selfUserId,
  selfEmail,
}: {
  initialUserId?: string
  selfUserId?: string
  /** Correo del usuario logueado: precarga el buscador para arrancar con uno mismo. */
  selfEmail?: string
}) {
  const router = useRouter()

  // ===== Paso 1: rol seleccionado → sus usuarios =====
  const [catalog, setCatalog] = useState<RoleOverviewDto[]>([])
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [roleUsers, setRoleUsers] = useState<RoleUserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState<string | null>(null)

  // ===== Paso 2: usuario seleccionado → administrar sus roles =====
  const [searchText, setSearchText] = useState(selfEmail ?? '')
  const [searchResults, setSearchResults] = useState<UserListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(initialUserId?.trim() || null)
  /** Nombre/correo del usuario elegido (para el encabezado; nunca mostrar GUID). */
  const [userLabel, setUserLabel] = useState<string | null>(
    initialUserId?.trim() && selfEmail ? selfEmail : null,
  )
  const [userRoles, setUserRoles] = useState<UserRoleDto[]>([])
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    void getRolesList().then((res) => {
      if (res.success) {
        setCatalog(res.value)
        setCatalogError(null)
      } else {
        setCatalogError(res.error.message)
      }
    })
  }, [])

  const loadRoleUsers = useCallback(async (roleId: string) => {
    setLoadingUsers(true)
    setUsersError(null)
    const res = await getRoleUsers(roleId)
    if (res.success) setRoleUsers(res.value)
    else setUsersError(res.error.message)
    setLoadingUsers(false)
  }, [])

  useEffect(() => {
    if (selectedRoleId) void loadRoleUsers(selectedRoleId)
  }, [selectedRoleId, loadRoleUsers])

  const loadUserRoles = useCallback(async (id: string) => {
    setLoadingRoles(true)
    setRolesError(null)
    setActionError(null)
    const res = await getUserRoles(id)
    if (res.success) setUserRoles(res.value)
    else setRolesError(res.error.message)
    setLoadingRoles(false)
  }, [])

  useEffect(() => {
    if (userId) void loadUserRoles(userId)
  }, [userId, loadUserRoles])

  function manageUser(u: { userId: string; fullName: string | null; email: string }) {
    setUserLabel(u.fullName ? `${u.fullName} · ${u.email}` : u.email)
    setUserId(u.userId)
    setSearchResults([])
    setSearchText('')
  }

  const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  async function submitSearch() {
    const q = searchText.trim()
    if (!q || searching) return
    // Un GUID pegado carga directo (uso técnico); lo normal es buscar por nombre/correo.
    if (GUID_RE.test(q)) {
      setUserLabel(null)
      setUserId(q)
      setSearchResults([])
      return
    }
    setSearching(true)
    setSearchError(null)
    const res = await getUsers({ search: q, take: 8 })
    setSearching(false)
    if (!res.success) {
      setSearchError(res.error.message)
      return
    }
    setSearchResults(res.value.items)
    if (res.value.items.length === 0) setSearchError(`Sin usuarios que coincidan con “${q}”.`)
  }

  const assignedIds = new Set(userRoles.map((r) => r.roleId))
  const defaultId = userRoles.find((r) => r.isDefault)?.roleId ?? null

  // Chips de roles: alfabético por nombre en español (DisplayName de la BD).
  const sortedRoles = useMemo(
    () => [...catalog].sort((a, b) => roleLabel(a).localeCompare(roleLabel(b), 'es')),
    [catalog],
  )

  // Tabla de gestión: primero los roles ASIGNADOS al usuario, luego alfabético.
  const sortedCatalog = useMemo(() => {
    const assigned = new Set(userRoles.map((r) => r.roleId))
    return [...catalog].sort((a, b) => {
      const aOrder = assigned.has(a.id) ? 0 : 1
      const bOrder = assigned.has(b.id) ? 0 : 1
      if (aOrder !== bOrder) return aOrder - bOrder
      return roleLabel(a).localeCompare(roleLabel(b), 'es')
    })
  }, [catalog, userRoles])

  async function refresh() {
    if (userId) await loadUserRoles(userId)
    if (selectedRoleId) await loadRoleUsers(selectedRoleId)
  }

  async function handleAssign(roleId: string) {
    if (!userId) return
    setBusyRoleId(roleId)
    setActionError(null)
    const res = await assignRole({ userId, roleId })
    setBusyRoleId(null)
    if (res.success) void refresh()
    else setActionError(res.error.message)
  }

  async function handleRemove(roleId: string) {
    if (!userId) return
    setBusyRoleId(roleId)
    setActionError(null)
    const res = await removeRole({ userId, roleId })
    setBusyRoleId(null)
    if (res.success) void refresh()
    else setActionError(res.error.message)
  }

  async function handleMakeDefault(roleId: string) {
    if (!userId) return
    // Cambiar el rol activo redefine el menú y los permisos con los que entra la
    // persona: pide confirmación explícita (nos pasó en pruebas sin querer).
    const roleForConfirm = catalog.find((r) => r.id === roleId)
    const roleName = roleForConfirm ? roleLabel(roleForConfirm) : 'este rol'
    const who = userLabel ?? 'este usuario'
    if (!confirm(`¿Cambiar el rol activo de ${who} a "${roleName}"?\n\nCon ese rol entrará la próxima vez que inicie sesión: define su menú y sus permisos.`)) {
      return
    }
    setBusyRoleId(roleId)
    setActionError(null)
    // Mantiene los roles asignados y solo cambia el DefaultRoleId (reemplazo en bloque).
    const res = await replaceUserRoles(userId, {
      roleIds: Array.from(assignedIds),
      defaultRoleId: roleId,
    })
    setBusyRoleId(null)
    if (res.success) void refresh()
    else setActionError(res.error.message)
  }

  // Solo aplica cuando el usuario cargado es el propio (switch-role es self-service).
  const isSelf = !!selfUserId && userId === selfUserId

  async function handleSwitch(roleId: string) {
    setBusyRoleId(roleId)
    setActionError(null)
    const res = await switchRole(roleId)
    setBusyRoleId(null)
    if (res.success) {
      router.refresh()
      void refresh()
    } else {
      setActionError(res.error.message)
    }
  }

  const selectedRole = catalog.find((r) => r.id === selectedRoleId) ?? null

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <HelpBox>
        <strong>1)</strong> Elige un rol para ver quiénes lo tienen. <strong>2)</strong> Pulsa
        “Administrar” en una persona para asignarle o quitarle roles. El rol{' '}
        <strong>por defecto</strong> es el <strong>rol activo</strong>: el que carga su sesión al
        iniciar y define su menú y permisos — un usuario puede tener varios roles, pero solo uno
        activo a la vez.
      </HelpBox>

      {/* ===== 1) ¿Quién tiene cada rol? ===== */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            <Users size={17} /> ¿Quién tiene cada rol?
          </div>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            Elige un rol para ver a las personas que lo tienen asignado.
          </p>
        </div>

        {catalogError ? (
          <div className="px-5 pb-5 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
            <AlertCircle size={15} /> {catalogError}
          </div>
        ) : (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {sortedRoles.map((r) => {
              const active = r.id === selectedRoleId
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoleId(active ? null : r.id)}
                  title={r.name}
                  className="px-3.5 py-1.5 rounded-full text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                  style={{
                    background: active ? 'var(--nav-active-bg)' : 'var(--card)',
                    color: active ? 'var(--nav-active-fg)' : 'var(--ink-700)',
                    border: `1px solid ${active ? 'var(--nav-active-bg)' : 'var(--border)'}`,
                    transition: 'background-color 150ms ease, color 150ms ease, transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {roleLabel(r)}
                </button>
              )
            })}
          </div>
        )}

        {selectedRoleId && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            {loadingUsers ? (
              <div className="px-5 py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
                <Loader2 size={16} className="animate-spin" /> Buscando usuarios con el rol…
              </div>
            ) : usersError ? (
              <div className="px-5 py-6 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
                <AlertCircle size={15} /> {usersError}
              </div>
            ) : roleUsers.length === 0 ? (
              <div className="px-5 py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                Nadie tiene el rol <b>{selectedRole ? roleLabel(selectedRole) : ''}</b> todavía.
              </div>
            ) : (
              <div className="overflow-x-auto px-2 py-2">
                <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[`${roleUsers.length} usuario${roleUsers.length === 1 ? '' : 's'} con ${selectedRole ? roleLabel(selectedRole) : 'el rol'}`, 'Rol activo', ''].map((h, i) => (
                        <th key={i} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roleUsers.map((u) => (
                      <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                              style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
                            >
                              {initials(u.fullName ?? u.email)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                                {u.fullName ?? u.email}
                              </div>
                              {u.fullName && (
                                <div className="text-[11.5px] truncate" style={{ color: 'var(--ink-500)' }}>{u.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.isDefault ? (
                            <Badge kind="brand"><Star size={10} /> Activo</Badge>
                          ) : (
                            <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>
                              Tiene el rol, entra con otro
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => manageUser(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors hover:bg-[var(--ink-50)] cursor-pointer"
                            style={{ border: '1px solid var(--border)', color: 'var(--ink-700)' }}
                          >
                            Administrar <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ===== 2) Administrar los roles de una persona ===== */}
      <Card>
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            <UserCog size={17} /> Administrar los roles de una persona
          </div>
          <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            Elige a alguien arriba con “Administrar”, o búscalo por nombre o correo.
          </p>
        </div>

        <div className="px-5 pb-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
              />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void submitSearch()}
                placeholder="Buscar por nombre o correo…"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg outline-none focus:ring-2"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
              />
            </div>
            <Btn kind="primary" size="sm" onClick={() => void submitSearch()} disabled={!searchText.trim() || searching}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : 'Buscar'}
            </Btn>
          </div>

          {searchError && (
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: '#9E3A15' }}>
              <AlertCircle size={14} /> {searchError}
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              {searchResults.map((u, i) => (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() => manageUser({ userId: u.userId, fullName: u.fullName, email: u.email })}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[var(--ink-50)] cursor-pointer"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)', background: 'var(--card)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                    style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
                  >
                    {initials(u.fullName || u.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                      {u.fullName || u.email}
                    </div>
                    <div className="text-[11.5px] truncate" style={{ color: 'var(--ink-500)' }}>{u.email}</div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--ink-400)' }} className="flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {actionError && (
          <div className="px-5 pb-3 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        {!userId ? (
          <div className="px-5 py-10 flex flex-col items-center gap-2 text-center" style={{ borderTop: '1px solid var(--border)' }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}
            >
              <UserCog size={20} />
            </div>
            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
              Nadie seleccionado todavía
            </div>
            <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Elige un rol arriba y pulsa “Administrar” en una persona.
            </p>
          </div>
        ) : rolesError ? (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <ErrorState message={rolesError} />
          </div>
        ) : loadingRoles ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando roles…
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div className="px-5 py-3 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold truncate" style={{ color: 'var(--ink-900)' }}>
                  {userLabel ?? (isSelf ? 'Tu usuario (sesión actual)' : `Usuario ${userId?.slice(0, 8)}…`)}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                  {userRoles.length} rol{userRoles.length === 1 ? '' : 'es'} asignado{userRoles.length === 1 ? '' : 's'} · entra con{' '}
                  <b style={{ color: 'var(--ink-700)' }}>
                    {(() => {
                      const def = userRoles.find((r) => r.isDefault)
                      if (!def) return 'el primero asignado'
                      const cat = catalog.find((c) => c.id === def.roleId)
                      return cat ? roleLabel(cat) : def.roleName
                    })()}
                  </b>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto px-2 py-2">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Rol', 'Estado', 'Rol activo (por defecto)', ''].map((h, i) => (
                      <th key={i} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedCatalog.map((r) => {
                    const assigned = assignedIds.has(r.id)
                    const isDefault = defaultId === r.id
                    const busy = busyRoleId === r.id
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>{roleLabel(r)}</span>
                            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--ink-400)' }}>{r.name}</code>
                            {r.isSystem && <Badge kind="amber">Sistema</Badge>}
                          </div>
                          {r.description && (
                            <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{r.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {assigned ? <Badge kind="brand">Asignado</Badge> : <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>—</span>}
                        </td>
                        <td className="py-3 px-3">
                          {isDefault ? (
                            <Badge kind="brand"><Star size={10} /> Entra con este</Badge>
                          ) : assigned ? (
                            <button
                              type="button"
                              onClick={() => handleMakeDefault(r.id)}
                              disabled={busy}
                              title="Al iniciar sesión, este será su rol activo"
                              className="text-[12px] font-bold px-2.5 py-1 rounded-full transition hover:opacity-80 disabled:opacity-50 cursor-pointer"
                              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                            >
                              Hacerlo el activo
                            </button>
                          ) : (
                            <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>—</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex justify-end items-center gap-1.5">
                            {isSelf && assigned && !isDefault && (
                              <button
                                type="button"
                                onClick={() => handleSwitch(r.id)}
                                disabled={busy}
                                title="Activar este rol en mi sesión"
                                className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full transition hover:opacity-80 disabled:opacity-50 cursor-pointer"
                                style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
                              >
                                <Zap size={12} /> Activar
                              </button>
                            )}
                            {assigned ? (
                              <Btn kind="ghost" size="sm" onClick={() => handleRemove(r.id)} disabled={busy || isDefault}>
                                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Quitar'}
                              </Btn>
                            ) : (
                              <Btn kind="primary" size="sm" onClick={() => handleAssign(r.id)} disabled={busy}>
                                {busy ? <Loader2 size={14} className="animate-spin" /> : 'Asignar'}
                              </Btn>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
