'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Check, Loader2, Search, UserMinus, UserPlus, X } from 'lucide-react'
import { assignRole } from '@/features/roles/actions/assignRole.action'
import { getRoleUsers } from '@/features/roles/actions/getRoleUsers.action'
import { removeRole } from '@/features/roles/actions/removeRole.action'
import { roleLabel, type RoleOverviewDto, type RoleUserDto } from '@/features/roles/types'
import { getUsers } from '@/features/users/actions/getUsers.action'
import type { UserListItem } from '@/features/users/types'
import { Badge, Btn, Card } from '../ui'

interface Props {
  role: RoleOverviewDto
  onBack: () => void
  /** Notifica cambios (altas/bajas) para refrescar el conteo del catálogo. */
  onChanged: () => void
}

/** Persona en la bandeja de "por asignar", con su estado durante el proceso. */
interface StagedUser {
  userId: string
  fullName: string
  email: string
  status: 'staged' | 'assigning' | 'done' | 'error'
  error?: string
}

const initialsOf = (name: string | null, email: string) => {
  const source = (name?.trim() || email).replace(/@.*$/, '')
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

export function RoleUsersPanel({ role, onBack, onChanged }: Props) {
  const [users, setUsers] = useState<RoleUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Búsqueda para agregar
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserListItem[]>([])
  const [searching, setSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const searchSeq = useRef(0)

  // Bandeja de por asignar + proceso
  const [staged, setStaged] = useState<StagedUser[]>([])
  const [assigning, setAssigning] = useState(false)

  // Bajas: la confirmación vive en la fila (nunca un confirm() del navegador)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getRoleUsers(role.id)
    if (res.success) {
      // Rol activo primero; después alfabético — lo importante arriba.
      setUsers(
        [...res.value].sort(
          (a, b) => Number(b.isDefault) - Number(a.isDefault) || (a.fullName ?? a.email).localeCompare(b.fullName ?? b.email, 'es'),
        ),
      )
    } else setError(res.error.message)
    setLoading(false)
  }, [role.id])

  useEffect(() => {
    load()
  }, [load])

  // Escape cancela la confirmación inline (salida siempre barata)
  useEffect(() => {
    if (!confirmingId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmingId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmingId])

  // Búsqueda con debounce corto; se descartan respuestas fuera de orden.
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setDropdownOpen(false)
      return
    }
    const seq = ++searchSeq.current
    setSearching(true)
    const t = setTimeout(async () => {
      const res = await getUsers({ search: q, take: 8 })
      if (seq !== searchSeq.current) return
      setSearching(false)
      if (res.success) {
        setResults(res.value.items)
        setDropdownOpen(true)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const assignedIds = new Set(users.map((u) => u.userId))
  const stagedIds = new Set(staged.map((s) => s.userId))

  function stage(u: UserListItem) {
    if (assignedIds.has(u.userId) || stagedIds.has(u.userId)) return
    setStaged((prev) => [...prev, { userId: u.userId, fullName: u.fullName, email: u.email, status: 'staged' }])
    setQuery('')
    setResults([])
    setDropdownOpen(false)
  }

  function unstage(userId: string) {
    if (assigning) return
    setStaged((prev) => prev.filter((s) => s.userId !== userId))
  }

  /** Asigna la bandeja en secuencia: cada persona reporta su resultado sin abortar al resto. */
  async function assignStaged() {
    if (assigning || staged.length === 0) return
    setAssigning(true)
    setActionError(null)
    let anyOk = false
    for (const s of staged) {
      if (s.status === 'done') continue
      setStaged((prev) => prev.map((p) => (p.userId === s.userId ? { ...p, status: 'assigning' } : p)))
      const res = await assignRole({ userId: s.userId, roleId: role.id })
      anyOk = anyOk || res.success
      setStaged((prev) =>
        prev.map((p) =>
          p.userId === s.userId
            ? res.success
              ? { ...p, status: 'done' }
              : { ...p, status: 'error', error: res.error.message }
            : p,
        ),
      )
    }
    setAssigning(false)
    if (anyOk) {
      await load()
      onChanged()
      // Los asignados salen de la bandeja; los fallidos se quedan para reintentar.
      setStaged((prev) => prev.filter((s) => s.status !== 'done'))
    }
  }

  async function handleRemove(u: RoleUserDto) {
    setConfirmingId(null)
    setRemovingId(u.userId)
    setActionError(null)
    const res = await removeRole({ userId: u.userId, roleId: role.id })
    setRemovingId(null)
    if (res.success) {
      await load()
      onChanged()
    } else setActionError(res.error.message)
  }

  const pendientes = staged.filter((s) => s.status !== 'done')

  return (
    <Card>
      {/* Animaciones locales del panel: entradas suaves, nunca desde scale(0) */}
      <style>{`
        @keyframes rup-row-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rup-pop-in {
          from { opacity: 0; transform: scale(0.97); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          aria-label="Volver al catálogo"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="min-w-0">
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Usuarios con el rol {roleLabel(role)}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
            {loading ? 'Cargando…' : `${users.length} ${users.length === 1 ? 'usuario tiene' : 'usuarios tienen'} este rol`}
          </div>
        </div>
      </div>

      {/* Agregar usuarios: buscador + bandeja + CTA */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[12px] font-bold mb-2" style={{ color: 'var(--ink-700)' }}>
          Asignar este rol a más usuarios
        </div>
        <div className="relative max-w-[420px]">
          <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
            onFocus={() => results.length > 0 && setDropdownOpen(true)}
            placeholder="Buscar por nombre o correo…"
            disabled={assigning}
            className="w-full pl-8 pr-8 py-2 rounded-xl text-[13px] outline-none"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
          {searching && (
            <Loader2 size={14} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-500)' }} />
          )}

          {dropdownOpen && results.length > 0 && (
            <div
              className="absolute z-20 mt-1.5 w-full rounded-xl overflow-hidden"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                transformOrigin: 'top',
                animation: 'rup-pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              {results.map((u) => {
                const ya = assignedIds.has(u.userId)
                const enBandeja = stagedIds.has(u.userId)
                return (
                  <button
                    key={u.userId}
                    type="button"
                    disabled={ya || enBandeja}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => stage(u)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-left transition-colors duration-150 hover:bg-[var(--ink-50)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10.5px] font-extrabold flex-shrink-0"
                      style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
                    >
                      {initialsOf(u.fullName, u.email)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                        {u.fullName || u.email}
                      </span>
                      <span className="block text-[11.5px] truncate" style={{ color: 'var(--ink-500)' }}>
                        {u.email}
                      </span>
                    </span>
                    {(ya || enBandeja) && (
                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: 'var(--ink-400)' }}>
                        {ya ? 'Ya lo tiene' : 'En la lista'}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {staged.length > 0 && (
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1.5">
              {staged.map((s) => (
                <span
                  key={s.userId}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[12px] font-semibold"
                  style={{
                    background:
                      s.status === 'done' ? 'var(--brand-100)' : s.status === 'error' ? 'var(--coral-soft)' : 'var(--ink-50)',
                    color: s.status === 'error' ? 'var(--violet-ink)' : 'var(--ink-900)',
                    border: '1px solid var(--border)',
                    animation: 'rup-pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                  title={s.status === 'error' ? s.error : s.email}
                >
                  {s.status === 'assigning' && <Loader2 size={11} className="animate-spin" />}
                  {s.status === 'done' && <Check size={11} />}
                  {s.status === 'error' && <AlertCircle size={11} />}
                  {s.fullName || s.email}
                  {(s.status === 'staged' || s.status === 'error') && (
                    <button
                      type="button"
                      onClick={() => unstage(s.userId)}
                      className="w-4 h-4 rounded-full flex items-center justify-center hover:opacity-70"
                      style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
                      aria-label={`Quitar a ${s.fullName || s.email} de la lista`}
                    >
                      <X size={9} />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <div>
              <Btn kind="primary" size="sm" onClick={assignStaged} disabled={assigning || pendientes.length === 0}>
                {assigning ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                {assigning ? 'Asignando…' : `Asignar (${pendientes.length})`}
              </Btn>
            </div>
          </div>
        )}
      </div>

      {actionError && (
        <div className="px-5 py-3 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
          <AlertCircle size={15} /> {actionError}
        </div>
      )}

      {/* Lista de usuarios con el rol */}
      {error ? (
        <div className="px-5 py-8 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
          <AlertCircle size={15} /> {error}
        </div>
      ) : loading ? (
        <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando usuarios…
        </div>
      ) : users.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Nadie tiene este rol todavía — usa el buscador de arriba para asignarlo.
        </div>
      ) : (
        <ul>
          {users.map((u, i) => (
            <li
              key={u.userId}
              className="px-5 py-3 flex items-center gap-3"
              style={{
                borderBottom: '1px solid var(--border)',
                // Entrada en cascada sutil (solo al montar la lista; vista ocasional)
                animation: 'rup-row-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
                animationDelay: `${Math.min(i, 8) * 40}ms`,
              }}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}
              >
                {initialsOf(u.fullName, u.email)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                    {u.fullName || u.email}
                  </span>
                  {u.isDefault && <Badge kind="brand">Rol activo</Badge>}
                </div>
                <div className="text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>
                  {u.email}
                </div>
              </div>
              {confirmingId === u.userId ? (
                // Confirmación inline: deliberada donde se decide, sin diálogos del navegador
                <div
                  className="flex items-center gap-2 flex-shrink-0"
                  style={{ animation: 'rup-pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1)', transformOrigin: 'right center' }}
                >
                  <span className="text-[11.5px] font-semibold text-right leading-tight hidden sm:block" style={{ color: 'var(--violet-ink)', maxWidth: 230 }}>
                    {u.isDefault
                      ? 'Es su rol ACTIVO — al volver a entrar cargará otro de sus roles.'
                      : '¿Quitarle este rol?'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(u)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-90"
                    style={{ background: 'var(--violet-ink)', color: '#fff' }}
                  >
                    Quitar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-bold transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingId(u.userId)}
                  disabled={removingId === u.userId || assigning}
                  title="Quitar este rol al usuario"
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-150 ease-out active:scale-[0.97] hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
                >
                  {removingId === u.userId ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="px-5 py-3 text-[11.5px]" style={{ color: 'var(--ink-400)', borderTop: '1px solid var(--border)' }}>
        Los cambios aplican cuando la persona vuelva a iniciar sesión — los permisos viajan en su token.
      </div>
    </Card>
  )
}
