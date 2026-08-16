'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { deleteRole } from '@/features/roles/actions/deleteRole.action'
import { roleLabel, type RoleOverviewDto } from '@/features/roles/types'
import { Badge, Btn, Card, ErrorState } from '../ui'
import { RoleEditor } from './role-editor'

export function RolesCatalog() {
  const [roles, setRoles] = useState<RoleOverviewDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<RoleOverviewDto | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

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
    if (!confirm(`¿Eliminar el rol "${role.name}"? Esta acción lo desactiva.`)) return
    setDeletingId(role.id)
    setActionError(null)
    const res = await deleteRole(role.id)
    setDeletingId(null)
    if (res.success) load()
    else setActionError(res.error.message)
  }

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <Card>
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${roles.length} roles`}
          </div>
          <Btn kind="primary" size="sm" onClick={openCreate} disabled={editorOpen && editing === null}>
            <Plus size={15} /> Nuevo rol
          </Btn>
        </div>

        {actionError && (
          <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-out"
          style={{ gridTemplateRows: editorOpen ? '0fr' : '1fr' }}
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
                  {['Rol', 'Descripción', 'Permisos', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          title={
                            r.isSystem
                              ? 'Editar permisos y descripción (el nombre técnico está protegido)'
                              : 'Editar'
                          }
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80"
                          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r)}
                          disabled={r.isSystem || deletingId === r.id}
                          title={r.isSystem ? 'Los roles del sistema no se eliminan' : 'Eliminar'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                          style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
                        >
                          {deletingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {roles.length === 0 && (
              <div className="text-center py-8">
                <div style={{ color: 'var(--ink-500)' }}>No hay roles registrados</div>
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
    </div>
  )
}
