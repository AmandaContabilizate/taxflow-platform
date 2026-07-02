'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2, Search, Star, UserCog, Zap } from 'lucide-react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { getUserRoles } from '@/features/roles/actions/getUserRoles.action'
import { assignRole } from '@/features/roles/actions/assignRole.action'
import { removeRole } from '@/features/roles/actions/removeRole.action'
import { replaceUserRoles } from '@/features/roles/actions/replaceUserRoles.action'
import { switchRole } from '@/features/roles/actions/switchRole.action'
import type { RoleOverviewDto, UserRoleDto } from '@/features/roles/types'
import { MONO } from '../constants'
import { Badge, Btn, Card, HelpBox } from '../ui'

export function UserRoles({ initialUserId, selfUserId }: { initialUserId?: string; selfUserId?: string }) {
  const router = useRouter()
  const [userIdInput, setUserIdInput] = useState(initialUserId ?? '')
  const [userId, setUserId] = useState<string | null>(initialUserId?.trim() || null)

  const [catalog, setCatalog] = useState<RoleOverviewDto[]>([])
  const [userRoles, setUserRoles] = useState<UserRoleDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyRoleId, setBusyRoleId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    setActionError(null)
    const [catRes, rolesRes] = await Promise.all([getRolesList(), getUserRoles(id)])
    if (!catRes.success) setError(catRes.error.message)
    else setCatalog(catRes.value)
    if (!rolesRes.success) setError((prev) => prev ?? rolesRes.error.message)
    else setUserRoles(rolesRes.value)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (userId) load(userId)
  }, [userId, load])

  function submitSearch() {
    const id = userIdInput.trim()
    if (id) setUserId(id)
  }

  const assignedIds = new Set(userRoles.map((r) => r.roleId))
  const defaultId = userRoles.find((r) => r.isDefault)?.roleId ?? null

  async function refresh() {
    if (userId) await load(userId)
  }

  async function handleAssign(roleId: string) {
    if (!userId) return
    setBusyRoleId(roleId)
    setActionError(null)
    const res = await assignRole({ userId, roleId })
    setBusyRoleId(null)
    if (res.success) refresh()
    else setActionError(res.error.message)
  }

  async function handleRemove(roleId: string) {
    if (!userId) return
    setBusyRoleId(roleId)
    setActionError(null)
    const res = await removeRole({ userId, roleId })
    setBusyRoleId(null)
    if (res.success) refresh()
    else setActionError(res.error.message)
  }

  async function handleMakeDefault(roleId: string) {
    if (!userId) return
    setBusyRoleId(roleId)
    setActionError(null)
    // Mantiene los roles asignados y solo cambia el DefaultRoleId (reemplazo en bloque).
    const res = await replaceUserRoles(userId, {
      roleIds: Array.from(assignedIds),
      defaultRoleId: roleId,
    })
    setBusyRoleId(null)
    if (res.success) refresh()
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
      refresh()
    } else {
      setActionError(res.error.message)
    }
  }

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <HelpBox>
        Ingresa el <strong>ID de usuario</strong> para ver y administrar sus roles. Puedes asignar o
        quitar roles individualmente y definir cuál es su rol por defecto.
      </HelpBox>

      <Card>
        <div className="p-4 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
            />
            <input
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
              placeholder="ID de usuario (GUID)…"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{ ...MONO, background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
          <Btn kind="primary" size="sm" onClick={submitSearch} disabled={!userIdInput.trim()}>
            Cargar roles
          </Btn>
        </div>
      </Card>

      {actionError && (
        <div className="px-1 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      {!userId ? (
        <Card>
          <div className="px-5 py-12 flex flex-col items-center gap-2 text-center">
            <UserCog size={26} style={{ color: 'var(--ink-500)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              Ingresa un ID de usuario para empezar.
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        </Card>
      ) : loading ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando roles…
          </div>
        </Card>
      ) : (
        <Card>
          <div
            className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {userRoles.length} de {catalog.length} roles asignados
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Rol', 'Estado', 'Por defecto', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalog.map((r) => {
                  const assigned = assignedIds.has(r.id)
                  const isDefault = defaultId === r.id
                  const busy = busyRoleId === r.id
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{r.name}</span>
                          {r.isSystem && <Badge kind="amber">Sistema</Badge>}
                        </div>
                        {r.description && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>{r.description}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {assigned ? <Badge kind="brand">Asignado</Badge> : <span style={{ color: 'var(--ink-500)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {isDefault ? (
                          <Badge kind="brand"><Star size={10} /> Default</Badge>
                        ) : assigned ? (
                          <button
                            type="button"
                            onClick={() => handleMakeDefault(r.id)}
                            disabled={busy}
                            className="text-[12px] font-bold px-2.5 py-1 rounded-full transition hover:opacity-80 disabled:opacity-50"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                          >
                            Hacer default
                          </button>
                        ) : (
                          <span style={{ color: 'var(--ink-500)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end items-center gap-1.5">
                          {isSelf && assigned && !isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSwitch(r.id)}
                              disabled={busy}
                              title="Activar este rol en mi sesión"
                              className="inline-flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full transition hover:opacity-80 disabled:opacity-50"
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
        </Card>
      )}
    </div>
  )
}
