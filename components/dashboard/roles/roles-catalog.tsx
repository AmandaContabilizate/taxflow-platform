'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, Loader2, Pencil, Plus, Star, Trash2 } from 'lucide-react'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { deleteRole } from '@/features/roles/actions/deleteRole.action'
import type { RoleOverviewDto } from '@/features/roles/types'
import { Badge, Btn, Card } from '../ui'
import { RoleFormModal } from './role-form-modal'

export function RolesCatalog() {
  const [roles, setRoles] = useState<RoleOverviewDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RoleOverviewDto | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getRolesList()
    if (res.success) setRoles(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(role: RoleOverviewDto) {
    setEditing(role)
    setModalOpen(true)
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
          <Btn kind="primary" size="sm" onClick={openCreate}>
            <Plus size={15} /> Nuevo rol
          </Btn>
        </div>

        {actionError && (
          <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: '#9E3A15' }}>
            <AlertCircle size={15} /> {actionError}
          </div>
        )}

        {error ? (
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
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
                        <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>{r.name}</span>
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
                          disabled={r.isSystem}
                          title={r.isSystem ? 'Los roles del sistema no se pueden editar' : 'Editar'}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
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
      </Card>

      <RoleFormModal open={modalOpen} onOpenChange={setModalOpen} role={editing} onSaved={load} />
    </div>
  )
}
