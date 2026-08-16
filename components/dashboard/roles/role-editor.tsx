'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
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
import { DISPLAY, MASTER_NAV_SECTIONS } from '../constants'
import { Btn, Card } from '../ui'

/**
 * Sección del sidebar a la que pertenece cada módulo, derivada del mismo mapa
 * maestro del menú (los departamentos de la BD usan los nombres del sidebar).
 * Los dos cajones sin pantalla llevan sección propia.
 */
const SECTION_BY_MODULE = new Map<string, string>()
const MODULE_ORDER = new Map<string, number>()
{
  let i = 0
  for (const s of MASTER_NAV_SECTIONS) {
    for (const item of s.items) {
      if (s.section) SECTION_BY_MODULE.set(item.label, s.section)
      MODULE_ORDER.set(item.label, i++)
    }
  }
}
SECTION_BY_MODULE.set('Portal del cliente', 'APP DEL CLIENTE')
SECTION_BY_MODULE.set('Sistema interno', 'SISTEMA')
// Sistema interno va pegado al bloque SISTEMA del sidebar (las secciones se
// agrupan por contigüidad); Portal del cliente cierra la lista como su propia sección.
MODULE_ORDER.set('Sistema interno', 850)
MODULE_ORDER.set('Portal del cliente', 900)

interface RoleEditorProps {
  /** Rol a editar; null = crear uno nuevo. */
  role: RoleOverviewDto | null
  onSaved: () => void
  onCancel: () => void
}

/**
 * Etiquetas en español para las claves técnicas del catálogo. Muchos claims
 * legacy no traen descripción y mostrar "GetMontlyIncome" no le dice nada a
 * un administrador. Fallback: separar el camelCase en palabras.
 */
const CLAIM_LABELS: Record<string, string> = {
  ViewRole: 'Ver roles y permisos',
  CreateRole: 'Crear roles',
  EditRole: 'Editar roles',
  DeleteRole: 'Eliminar roles',
  AssignRole: 'Asignar roles a usuarios',
  RemoveRole: 'Quitar roles a usuarios',
  CreateTaxpayer: 'Registrar contribuyentes',
  GetMontlyIncome: 'Ver ingresos mensuales',
}

function claimLabel(claimType: string, description: string | null): string {
  if (description && description.trim() && description.trim() !== claimType) return description
  if (CLAIM_LABELS[claimType]) return CLAIM_LABELS[claimType]
  // "GerenciaComercial.ManagePartners" → "Gerencia Comercial · Manage Partners"
  return claimType
    .split('.')
    .map((part) => part.replace(/([a-z0-9])([A-Z])/g, '$1 $2'))
    .join(' · ')
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
  const [displayName, setDisplayName] = useState(role?.displayName ?? '')
  const [description, setDescription] = useState(role?.description ?? '')
  const [selected, setSelected] = useState<Set<number>>(
    new Set((role?.claims ?? []).map((c) => c.claimCatalogId)),
  )
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())

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
    // Módulos del sidebar sin permisos todavía: se muestran deshabilitados para
    // que el administrador vea el mapa completo del backoffice.
    if (departments.length > 0) {
      for (const s of MASTER_NAV_SECTIONS) {
        for (const item of s.items) {
          if (!map.has(item.label)) {
            map.set(item.label, {
              departmentId: -1,
              departmentName: item.label,
              departmentCode: '',
              claims: [],
            })
          }
        }
      }
    }

    // Orden del sidebar (independiente del orden en que responda el API)
    return Array.from(map.values()).sort(
      (a, b) =>
        (MODULE_ORDER.get(a.departmentName) ?? 800) - (MODULE_ORDER.get(b.departmentName) ?? 800),
    )
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
            (c.description ?? '').toLowerCase().includes(q) ||
            claimLabel(c.claimType, c.description).toLowerCase().includes(q),
        ),
      }))
      .filter((d) => d.claims.length > 0)
  }, [merged, query])

  // Módulos agrupados por sección del sidebar (cada sección es colapsable).
  const sections = useMemo(() => {
    const list: { section: string; deps: ClaimsDepartmentDto[] }[] = []
    for (const dep of filtered) {
      const sec = SECTION_BY_MODULE.get(dep.departmentName) ?? 'OTROS'
      const last = list[list.length - 1]
      if (last && last.section === sec) last.deps.push(dep)
      else list.push({ section: sec, deps: [dep] })
    }
    return list
  }, [filtered])

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

  const sectionNames = useMemo(
    () =>
      Array.from(new Set(merged.map((d) => SECTION_BY_MODULE.get(d.departmentName) ?? 'OTROS'))),
    [merged],
  )

  const allCollapsed =
    (merged.length > 0 && merged.every((d) => collapsed.has(d.departmentName))) ||
    (sectionNames.length > 0 && sectionNames.every((s) => collapsedSections.has(s)))

  function toggleCollapseAll() {
    if (allCollapsed) {
      setCollapsed(new Set())
      setCollapsedSections(new Set())
    } else {
      setCollapsed(new Set(merged.map((d) => d.departmentName)))
      setCollapsedSections(new Set(sectionNames))
    }
  }

  function toggleSection(name: string) {
    setCollapsedSections((prev) => {
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
    const displayName_ = displayName.trim() || null
    const selectedIds = Array.from(selected)
    const res = editing
      ? await updateRole({
          roleId: role!.id,
          displayName: displayName_,
          description: description_,
          claims: selectedIds.map((id) => ({
            claimCatalogId: id,
            claimValue: claimValueById.get(id) ?? null,
          })),
        })
      : await createRole({
          name: name.trim(),
          displayName: displayName_,
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
              Nombre técnico (inglés)
            </span>
            <Field value={name} onChange={setName} placeholder="Ej. Accounter" disabled={role?.isSystem || editing} mono />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
              Nombre para mostrar (español)
            </span>
            <Field value={displayName} onChange={setDisplayName} placeholder="Ej. Contador" />
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
                    onClick={toggleCollapseAll}
                    disabled={!!query.trim()}
                    title={query.trim() ? 'Con búsqueda activa los grupos permanecen abiertos' : undefined}
                    className="text-[12px] font-bold px-2.5 py-1.5 rounded-lg transition hover:opacity-80 active:scale-[0.98] disabled:opacity-40 flex items-center gap-1.5"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
                  >
                    {allCollapsed ? <ChevronsUpDown size={13} /> : <ChevronsDownUp size={13} />}
                    {allCollapsed ? 'Expandir todo' : 'Contraer todo'}
                  </button>
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
              {sections.map(({ section, deps }) => {
                const isSecCollapsed = collapsedSections.has(section) && !query
                const secClaims = deps.reduce((n, d) => n + d.claims.length, 0)
                return (
                  <Fragment key={section}>
                  {/* Encabezado de sección: toggle que colapsa todos sus módulos */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    aria-expanded={!isSecCollapsed}
                    className="flex items-center gap-1.5 px-1 py-0.5 mt-1.5 first:mt-0 w-fit text-left cursor-pointer rounded-md active:scale-[0.98] role-collapse-toggle"
                  >
                    <ChevronDown
                      size={12}
                      className="flex-shrink-0"
                      style={{
                        color: 'var(--ink-400)',
                        transform: isSecCollapsed ? 'rotate(-90deg)' : 'none',
                        transition: 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)',
                      }}
                    />
                    <span
                      className="text-[10.5px] font-extrabold uppercase tracking-[0.08em]"
                      style={{ color: 'var(--ink-400)' }}
                    >
                      {section}
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--ink-400)' }}>
                      · {deps.length} {deps.length === 1 ? 'módulo' : 'módulos'} · {secClaims} permisos
                    </span>
                  </button>
                  <div
                    className="grid role-collapse"
                    style={{ gridTemplateRows: isSecCollapsed ? '0fr' : '1fr' }}
                  >
                  <div className="overflow-hidden min-h-0" inert={isSecCollapsed || undefined}>
                  <div
                    className="flex flex-col gap-3 role-collapse-inner"
                    style={{
                      opacity: isSecCollapsed ? 0 : 1,
                      transform: isSecCollapsed ? 'translateY(-6px)' : 'none',
                    }}
                  >
                  {deps.map((dep) => {
                    const ids = dep.claims.map((c) => c.id)
                    const on = ids.filter((id) => selected.has(id)).length
                    const allOn = on === ids.length && ids.length > 0
                    const isCollapsed = collapsed.has(dep.departmentName) && !query

                    // Módulo del sidebar sin permisos configurables todavía
                    if (ids.length === 0) {
                      return (
                        <div
                          key={dep.departmentName}
                          className="rounded-2xl px-3.5 py-2.5 flex items-center gap-2 flex-wrap"
                          style={{ border: '1px dashed var(--border-strong)', opacity: 0.7 }}
                        >
                          <span className="text-[12.5px] font-extrabold" style={{ color: 'var(--ink-500)' }}>
                            {dep.departmentName}
                          </span>
                          <span
                            className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
                          >
                            Sin permisos aún
                          </span>
                          <span className="text-[11.5px]" style={{ color: 'var(--ink-400)' }}>
                            Cuando este módulo tenga permisos configurables, aparecerán aquí.
                          </span>
                        </div>
                      )
                    }
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
                        aria-expanded={!isCollapsed}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer rounded-lg -mx-1 px-1 py-0.5 active:scale-[0.99] role-collapse-toggle"
                      >
                        <ChevronDown
                          size={15}
                          className="flex-shrink-0"
                          style={{
                            color: 'var(--ink-500)',
                            transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                            transition: 'transform 220ms cubic-bezier(0.23, 1, 0.32, 1)',
                          }}
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

                    {/* Claims — colapsable con grid-rows 0fr/1fr (mismo patrón que el
                        sidebar): siempre montado, la fila colapsa y el contenido hace
                        fade + leve translate. Solo anima grid-rows/opacity/transform. */}
                    <div
                      className="grid role-collapse"
                      style={{ gridTemplateRows: isCollapsed ? '0fr' : '1fr', background: 'var(--card)' }}
                    >
                      {/* inert: los checkboxes colapsados salen del orden de tabulación */}
                      <div className="overflow-hidden min-h-0" inert={isCollapsed || undefined}>
                      <div
                        className="p-2 grid gap-1 role-collapse-inner"
                        style={{
                          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
                          opacity: isCollapsed ? 0 : 1,
                          transform: isCollapsed ? 'translateY(-6px)' : 'none',
                        }}
                        aria-hidden={isCollapsed}
                      >
                        {dep.claims.map((c) => {
                          const active = selected.has(c.id)
                          return (
                            <button
                              key={`${dep.departmentName}-${c.id}`}
                              type="button"
                              onClick={() => toggle(c.id)}
                              role="checkbox"
                              aria-checked={active}
                              title={c.claimType}
                              className="rounded-xl px-2.5 py-2 flex items-center gap-2.5 text-left cursor-pointer active:scale-[0.99]"
                              style={{
                                background: active ? 'var(--hero-brand-soft)' : 'transparent',
                                border: `1px solid ${active ? 'var(--brand-500)' : 'transparent'}`,
                                transition: 'background-color 150ms ease, border-color 150ms ease, transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                              }}
                              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'var(--ink-50)' }}
                              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                            >
                              <span
                                className="w-[18px] h-[18px] rounded-md flex items-center justify-center flex-shrink-0"
                                style={{
                                  background: active ? 'var(--brand-500)' : 'transparent',
                                  border: active ? '1px solid var(--brand-500)' : '1.5px solid var(--border-strong)',
                                  color: '#fff',
                                  transition: 'background-color 150ms ease, border-color 150ms ease',
                                }}
                              >
                                {active && <Check size={12} />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className="block text-[12.5px] font-semibold leading-tight"
                                  style={{ color: 'var(--ink-900)' }}
                                >
                                  {claimLabel(c.claimType, c.description)}
                                </span>
                                <span
                                  className="block text-[10px] font-mono mt-0.5 truncate"
                                  style={{ color: 'var(--ink-400)' }}
                                >
                                  {c.claimType}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      </div>
                    </div>
                  </div>
                    )
                  })}
                  </div>
                  </div>
                  </div>
                  </Fragment>
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

      <style>{`
        .role-collapse {
          transition: grid-template-rows 280ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .role-collapse-inner {
          transition:
            opacity 200ms ease,
            transform 280ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .role-collapse-toggle {
          transition: background-color 150ms ease, transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .role-collapse-toggle:hover {
          background-color: color-mix(in oklab, var(--ink-500) 8%, transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .role-collapse,
          .role-collapse-inner,
          .role-collapse-toggle {
            transition: none;
          }
        }
      `}</style>
    </Card>
  )
}
