'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Search, Star, Trash2, Users, X } from 'lucide-react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { deleteRole } from '@/features/roles/actions/deleteRole.action'
import { roleLabel, type RoleOverviewDto } from '@/features/roles/types'
import { Badge, Btn, Card, ErrorState } from '../ui'
import { RoleEditor } from './role-editor'
import { RoleUsersPanel } from './role-users-panel'

export function RolesCatalog() {
  const [roles, setRoles] = useState<RoleOverviewDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<RoleOverviewDto | null>(null)

  // Vista rol → usuarios (panel inline, misma mecánica de colapso que el editor)
  const [viewingUsers, setViewingUsers] = useState<RoleOverviewDto | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Confirmación inline de borrado (nunca un confirm() del navegador)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return roles
    return roles.filter(
      (r) =>
        roleLabel(r).toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? '').toLowerCase().includes(q),
    )
  }, [roles, query])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getRolesList()
    if (res.success) {
      // Orden alfabético por el nombre visible (español, con fallback al técnico)
      setRoles([...res.value].sort((a, b) => roleLabel(a).localeCompare(roleLabel(b), 'es')))
    } else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setEditorOpen(true)
  }

  function openEdit(role: RoleOverviewDto) {
    setEditing(role)
    setEditorOpen(true)
  }

  async function handleDelete(role: RoleOverviewDto) {
    setConfirmingDeleteId(null)
    setDeletingId(role.id)
    setActionError(null)
    const res = await deleteRole(role.id)
    setDeletingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  // Escape cancela la confirmación inline
  useEffect(() => {
    if (!confirmingDeleteId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmingDeleteId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmingDeleteId])

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <style>{`
        @keyframes rc-pop-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <Card>
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold flex-shrink-0" style={{ color: 'var(--ink-900)' }}>
            {loading
              ? 'Cargando…'
              : query.trim()
                ? `${filtered.length} de ${roles.length} roles`
                : `${roles.length} roles`}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative w-full sm:w-[240px]">
              <Search
                size={14}
                style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Buscar rol…"
                className="w-full pl-8 pr-8 py-2 rounded-xl text-[13px] outline-none"
                style={{
                  background: 'var(--input)',
                  border: `1px solid ${searchFocused ? 'var(--ring)' : 'var(--border)'}`,
                  boxShadow: searchFocused
                    ? '0 0 0 3px color-mix(in oklab, var(--ring) 22%, transparent)'
                    : 'none',
                  color: 'var(--foreground)',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease',
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={11} />
                </button>
              )}
            </div>
            <Btn kind="primary" size="sm" onClick={openCreate} disabled={editorOpen && editing === null}>
              <Plus size={15} /> Nuevo rol
            </Btn>
          </div>
        </div>

        {actionError && (
          <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: editorOpen || viewingUsers ? '0fr' : '1fr' }}
        >
          <div className="overflow-hidden">
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando roles…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Rol', 'Descripción', 'Permisos', 'Usuarios', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{roleLabel(r)}</span>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px', color: 'var(--ink-400)' }}>{r.name}</code>
                        {r.isDefault && (
                          <Badge kind="brand">
                            <Star size={10} /> Default
                          </Badge>
                        )}
                        {r.isSystem && <Badge kind="amber">Sistema</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: 'var(--ink-700)' }}>
                        {r.description || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <Badge kind="default">{r.claims.length}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge kind={r.usersCount > 0 ? 'default' : 'amber'}>{r.usersCount}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {confirmingDeleteId === r.id ? (
                        <div
                          className="flex items-center justify-end gap-2"
                          style={{ animation: 'rc-pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1)', transformOrigin: 'right center' }}
                        >
                          <span className="text-[11.5px] font-semibold text-right leading-tight hidden lg:block" style={{ color: 'var(--violet-ink)', maxWidth: 200 }}>
                            {r.usersCount > 0
                              ? `${r.usersCount} ${r.usersCount === 1 ? 'usuario lo tiene' : 'usuarios lo tienen'} — se desactiva.`
                              : '¿Eliminar este rol? Se desactiva.'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-90"
                            style={{ background: 'var(--violet-ink)', color: '#fff' }}
                          >
                            Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(null)}
                            className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingUsers(r)}
                            title="Ver y asignar usuarios de este rol"
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                          >
                            <Users size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            title={
                              r.isSystem
                                ? 'Editar permisos y descripción (el nombre técnico está protegido)'
                                : 'Editar'
                            }
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteId(r.id)}
                            disabled={r.isSystem || deletingId === r.id}
                            title={r.isSystem ? 'Los roles del sistema no se eliminan' : 'Eliminar'}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
                          >
                            {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-8">
                <div style={{ color: 'var(--ink-500)' }}>
                  {query.trim() ? 'Sin roles que coincidan con la búsqueda.' : 'No hay roles registrados'}
                </div>
              </div>
            )}
          </div>
        )}
          </div>
        </div>
      </Card>

      {editorOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <RoleEditor
            key={editing?.id ?? 'new'}
            role={editing}
            onSaved={() => {
              setEditorOpen(false)
              load()
            }}
            onCancel={() => setEditorOpen(false)}
          />
        </div>
      )}

      {viewingUsers && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <RoleUsersPanel
            key={viewingUsers.id}
            role={viewingUsers}
            onBack={() => setViewingUsers(null)}
            onChanged={load}
          />
        </div>
      )}
    </div>
  )
}
