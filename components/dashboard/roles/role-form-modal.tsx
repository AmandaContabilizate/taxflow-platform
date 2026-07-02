'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createRole } from '@/features/roles/actions/createRole.action'
import { updateRole } from '@/features/roles/actions/updateRole.action'
import { getClaimsCatalog } from '@/features/roles/actions/getClaimsCatalog.action'
import type { ClaimsDepartmentDto, RoleOverviewDto } from '@/features/roles/types'
import { DISPLAY } from '../constants'
import { Btn } from '../ui'

interface RoleFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Rol a editar; null = crear uno nuevo. */
  role: RoleOverviewDto | null
  onSaved: () => void
}

/** Input con focus ring por token (`--ring`), tema claro/oscuro. */
function Field({
  value,
  onChange,
  placeholder,
  disabled,
  mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  disabled?: boolean
  mono?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const style: CSSProperties = {
    background: 'var(--input)',
    border: `1px solid ${focused ? 'var(--ring)' : 'var(--border)'}`,
    boxShadow: focused ? '0 0 0 3px color-mix(in oklab, var(--ring) 22%, transparent)' : 'none',
    color: 'var(--foreground)',
    fontFamily: mono ? 'var(--font-mono)' : undefined,
  }
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition disabled:opacity-60"
      style={style}
    />
  )
}

export function RoleFormModal({ open, onOpenChange, role, onSaved }: RoleFormModalProps) {
  const editing = role !== null

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  const [departments, setDepartments] = useState<ClaimsDepartmentDto[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Reinicia el formulario cada vez que se abre.
  useEffect(() => {
    if (!open) return
    setName(role?.name ?? '')
    setDescription(role?.description ?? '')
    setSelected(new Set((role?.claims ?? []).map((c) => c.claimCatalogId)))
    setQuery('')
    setCollapsed(new Set())
    setSaveError(null)
  }, [open, role])

  // Carga el catálogo de claims al abrir.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoadingCatalog(true)
    setCatalogError(null)
    getClaimsCatalog().then((res) => {
      if (cancelled) return
      if (res.success) setDepartments(res.value)
      else setCatalogError(res.error.message)
      setLoadingCatalog(false)
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const totalClaims = useMemo(
    () => departments.reduce((n, d) => n + d.claims.length, 0),
    [departments],
  )

  // claimCatalogId → claimValue del catálogo, para armar el body de PUT /roles.
  const claimValueById = useMemo(() => {
    const map = new Map<number, string | null>()
    for (const dep of departments) {
      for (const c of dep.claims) map.set(c.id, c.claimValue)
    }
    return map
  }, [departments])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return departments
    return departments
      .map((d) => ({
        ...d,
        claims: d.claims.filter(
          (c) =>
            c.claimType.toLowerCase().includes(q) ||
            (c.description ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((d) => d.claims.length > 0)
  }, [departments, query])

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDepartment(dep: ClaimsDepartmentDto) {
    const ids = dep.claims.map((c) => c.id)
    const allOn = ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allOn) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }

  function toggleCollapse(depId: number) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(depId)) next.delete(depId)
      else next.add(depId)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(departments.flatMap((d) => d.claims.map((c) => c.id))))
  }

  function clearAll() {
    setSelected(new Set())
  }

  async function handleSave() {
    if (!name.trim()) {
      setSaveError('El nombre del rol es obligatorio.')
      return
    }
    setSaving(true)
    setSaveError(null)
    const description_ = description.trim() || null
    const selectedIds = Array.from(selected)
    const res = editing
      ? await updateRole({
          roleId: role!.id,
          description: description_,
          // El backend recibe `claims`, no `claimCatalogIds`; adjuntamos el
          // claimValue del catálogo (puede ser null).
          claims: selectedIds.map((id) => ({
            claimCatalogId: id,
            claimValue: claimValueById.get(id) ?? null,
          })),
        })
      : await createRole({
          name: name.trim(),
          description: description_,
          claimCatalogIds: selectedIds,
        })
    setSaving(false)
    if (res.success) {
      onOpenChange(false)
      onSaved()
    } else {
      setSaveError(res.error.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-5 border-b" style={{ borderColor: 'var(--border)' }}>
          <DialogHeader>
            <div className="flex items-start gap-3.5">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
              >
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-[19px] font-extrabold tracking-tight" style={DISPLAY}>
                  {editing ? 'Editar rol' : 'Crear rol'}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  {editing
                    ? 'Modifica el nombre, la descripción y los permisos del rol.'
                    : 'Define el nombre, la descripción y los permisos del nuevo rol.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Body (scroll) ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Datos básicos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
                Nombre
              </span>
              <Field value={name} onChange={setName} placeholder="Ej. Contador" disabled={role?.isSystem} mono />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
                Descripción
              </span>
              <Field value={description} onChange={setDescription} placeholder="Breve descripción del rol" />
            </label>
          </div>

          {role?.isSystem && (
            <div
              className="flex items-center gap-2 text-[12.5px] font-semibold px-3.5 py-2.5 rounded-xl"
              style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
            >
              <Lock size={15} /> Rol del sistema: el nombre no se puede modificar.
            </div>
          )}

          {/* Permisos */}
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  Permisos
                </div>
                <div className="text-[12px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  {selected.size} de {totalClaims || '—'} seleccionados
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!loadingCatalog && !catalogError && (
                  <>
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition hover:opacity-80"
                      style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition hover:opacity-80 disabled:opacity-40"
                      disabled={selected.size === 0}
                      style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                    >
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Buscador */}
            {!loadingCatalog && !catalogError && (
              <div className="relative">
                <Search
                  size={15}
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar permiso por nombre o clave…"
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl text-[13px] outline-none"
                  style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            )}

            {/* Lista */}
            {catalogError ? (
              <div
                className="flex flex-col items-center gap-2 text-center px-4 py-8 rounded-xl"
                style={{ background: 'var(--coral-soft)', border: '1px solid var(--border)' }}
              >
                <AlertCircle size={22} style={{ color: '#9E3A15' }} />
                <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                  No se pudo cargar el catálogo de permisos
                </div>
                <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                  {catalogError}
                </div>
              </div>
            ) : loadingCatalog ? (
              <div
                className="flex items-center justify-center gap-2 py-10 rounded-xl"
                style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}
              >
                <Loader2 size={16} className="animate-spin" /> Cargando permisos…
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {filtered.map((dep, di) => {
                  const ids = dep.claims.map((c) => c.id)
                  const on = ids.filter((id) => selected.has(id)).length
                  const allOn = on === ids.length && ids.length > 0
                  const isCollapsed = collapsed.has(dep.departmentId) && !query
                  return (
                    <div key={`dep-${dep.departmentId}-${di}`} className="border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                      {/* Header depto */}
                      <div
                        className="flex items-center gap-2 px-3.5 py-2.5"
                        style={{ background: 'var(--muted)' }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleCollapse(dep.departmentId)}
                          className="flex items-center gap-2 flex-1 min-w-0 text-left"
                        >
                          <ChevronDown
                            size={15}
                            className="transition-transform flex-shrink-0"
                            style={{ color: 'var(--ink-500)', transform: isCollapsed ? 'rotate(-90deg)' : 'none' }}
                          />
                          <span className="text-[12.5px] font-extrabold truncate" style={{ color: 'var(--ink-900)' }}>
                            {dep.departmentName}
                          </span>
                          <span
                            className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: allOn ? 'var(--brand-100)' : 'var(--card)',
                              color: allOn ? 'var(--brand-900)' : 'var(--ink-500)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {on}/{ids.length}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleDepartment(dep)}
                          className="text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80 flex-shrink-0"
                          style={{ color: 'var(--brand-700)' }}
                        >
                          {allOn ? 'Quitar' : 'Todos'}
                        </button>
                      </div>

                      {/* Claims */}
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ background: 'var(--border)', gap: 1 }}>
                          {dep.claims.map((c, ci) => {
                            const active = selected.has(c.id)
                            return (
                              <button
                                key={`claim-${dep.departmentId}-${c.id}-${ci}`}
                                type="button"
                                onClick={() => toggle(c.id)}
                                className="flex items-start gap-2.5 px-3.5 py-2.5 text-left transition"
                                style={{ background: active ? 'var(--hero-brand-soft)' : 'var(--card)' }}
                              >
                                <span
                                  className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition"
                                  style={{
                                    background: active ? 'var(--brand-500)' : 'transparent',
                                    border: active ? '1px solid var(--brand-500)' : '1.5px solid var(--border-strong)',
                                    color: '#fff',
                                  }}
                                >
                                  {active && <Check size={13} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[12.5px] font-bold leading-snug" style={{ color: 'var(--ink-900)' }}>
                                    {c.description || c.claimType}
                                  </span>
                                  <span className="block text-[10.5px] font-mono mt-0.5 opacity-70" style={{ color: 'var(--ink-500)' }}>
                                    {c.claimType}
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
                {filtered.length === 0 && (
                  <div className="px-4 py-8 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                    {query ? 'Sin permisos que coincidan con la búsqueda.' : 'No hay permisos en el catálogo.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <div
          className="px-6 py-4 border-t flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="min-w-0 flex items-center gap-2 text-[12.5px] font-semibold" style={{ color: '#9E3A15' }}>
            {saveError && (
              <>
                <AlertCircle size={15} className="flex-shrink-0" />
                <span className="truncate">{saveError}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Btn kind="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Btn>
            <Btn kind="brand" size="sm" onClick={handleSave} disabled={saving || loadingCatalog}>
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Guardando…
                </>
              ) : (
                <>
                  <Check size={15} /> {editing ? 'Guardar cambios' : 'Crear rol'}
                </>
              )}
            </Btn>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
