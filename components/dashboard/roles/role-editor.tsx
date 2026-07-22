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
import { createRole } from '@/features/roles/actions/createRole.action'
import { updateRole } from '@/features/roles/actions/updateRole.action'
import { getClaimsCatalog } from '@/features/roles/actions/getClaimsCatalog.action'
import type { ClaimsDepartmentDto, RoleOverviewDto } from '@/features/roles/types'
import { DISPLAY } from '../constants'
import { Btn, Card } from '../ui'

interface RoleEditorProps {
  /** Rol a editar; null = crear uno nuevo. */
  role: RoleOverviewDto | null
  onSaved: () => void
  onCancel: () => void
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

export function RoleEditor({ role, onSaved, onCancel }: RoleEditorProps) {
  const editing = role !== null

  const [name, setName] = useState(role?.name ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [selected, setSelected] = useState<Set<number>>(
    new Set((role?.claims ?? []).map((c) => c.claimCatalogId)),
  )
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const [departments, setDepartments] = useState<ClaimsDepartmentDto[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Carga el catálogo de claims al montar.
  useEffect(() => {
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
  }, [])

  /**
   * Fusiona departamentos con el MISMO nombre en una sola card y elimina
   * permisos duplicados (por id) dentro de cada grupo.
   */
  const merged = useMemo<ClaimsDepartmentDto[]>(() => {
    const map = new Map<string, ClaimsDepartmentDto>()
    for (const dep of departments) {
      const key = dep.departmentName
      const existing = map.get(key)
      if (!existing) {
        const seen = new Set<number>()
        const claims = dep.claims.filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)))
        map.set(key, { ...dep, claims })
      } else {
        const seen = new Set(existing.claims.map((c) => c.id))
        for (const c of dep.claims) {
          if (!seen.has(c.id)) {
            existing.claims.push(c)
            seen.add(c.id)
          }
        }
      }
    }
    return Array.from(map.values())
  }, [departments])

  const totalClaims = useMemo(() => merged.reduce((n, d) => n + d.claims.length, 0), [merged])

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
    if (!q) return merged
    return merged
      .map((d) => ({
        ...d,
        claims: d.claims.filter(
          (c) =>
            c.claimType.toLowerCase().includes(q) ||
            (c.description ?? '').toLowerCase().includes(q),
        ),
      }))
      .filter((d) => d.claims.length > 0)
  }, [merged, query])

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

  function toggleCollapse(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(merged.flatMap((d) => d.claims.map((c) => c.id))))
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
    if (res.success) onSaved()
    else setSaveError(res.error.message)
  }

  return (
    <Card>
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start gap-3.5 min-w-0">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
          >
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold tracking-tight" style={DISPLAY}>
              {editing ? 'Editar rol' : 'Crear rol'}
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              {editing
                ? 'Modifica la descripción y los permisos del rol.'
                : 'Define el nombre, la descripción y los permisos del nuevo rol.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cerrar"
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition hover:opacity-80"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 py-5 flex flex-col gap-5">
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

          {/* Cards por departamento */}
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
            <div className="flex flex-col gap-3">
              {filtered.map((dep) => {
                const ids = dep.claims.map((c) => c.id)
                const on = ids.filter((id) => selected.has(id)).length
                const allOn = on === ids.length && ids.length > 0
                const isCollapsed = collapsed.has(dep.departmentName) && !query
                return (
                  <div
                    key={dep.departmentName}
                    className="rounded-2xl overflow-hidden"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    {/* Header del departamento */}
                    <div className="flex items-center gap-2 px-3.5 py-2.5" style={{ background: 'var(--muted)' }}>
                      <button
                        type="button"
                        onClick={() => toggleCollapse(dep.departmentName)}
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

                    {/* Claims — cards cuadradas en grid */}
                    {!isCollapsed && (
                      <div
                        className="p-3 grid gap-2.5"
                        style={{
                          background: 'var(--card)',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        }}
                      >
                        {dep.claims.map((c) => {
                          const active = selected.has(c.id)
                          return (
                            <button
                              key={`${dep.departmentName}-${c.id}`}
                              type="button"
                              onClick={() => toggle(c.id)}
                              title={c.claimType}
                              className="aspect-square rounded-xl p-2.5 flex flex-col justify-between text-left transition hover:opacity-90"
                              style={{
                                background: active ? 'var(--hero-brand-soft)' : 'var(--card)',
                                border: `1.5px solid ${active ? 'var(--brand-500)' : 'var(--border)'}`,
                              }}
                            >
                              <span
                                className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0 transition"
                                style={{
                                  background: active ? 'var(--brand-500)' : 'transparent',
                                  border: active ? '1px solid var(--brand-500)' : '1.5px solid var(--border-strong)',
                                  color: '#fff',
                                }}
                              >
                                {active && <Check size={12} />}
                              </span>
                              <span className="min-w-0">
                                <span
                                  className="block text-[12px] font-bold leading-tight line-clamp-3"
                                  style={{ color: 'var(--ink-900)' }}
                                >
                                  {c.description || c.claimType}
                                </span>
                                <span
                                  className="block text-[9.5px] font-mono mt-1 opacity-70 truncate"
                                  style={{ color: 'var(--ink-500)' }}
                                >
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
                <div
                  className="px-4 py-8 text-center text-[13px] rounded-xl"
                  style={{ border: '1px solid var(--border)', color: 'var(--ink-500)' }}
                >
                  {query ? 'Sin permisos que coincidan con la búsqueda.' : 'No hay permisos en el catálogo.'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-4 border-t flex items-center justify-between gap-3 flex-wrap"
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
          <Btn kind="ghost" size="sm" onClick={onCancel} disabled={saving}>
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
    </Card>
  )
}
