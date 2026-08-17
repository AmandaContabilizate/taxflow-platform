'use client'

import { Database, Globe, Loader2, Lock, MailCheck, MailWarning, Smartphone, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getUsers } from '@/features/users/actions/getUsers.action'
import type { EstatusConteo, UserListItem, UserTaxpayer } from '@/features/users/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import { Pagination, SearchBar } from '../clientes/parts'

const TAKE = 50

type ConfirmedFilter = '' | 'true' | 'false'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Catálogo de roles para el filtro. No hay endpoint de catálogo, así que se
 * acumula con los roles que van apareciendo: al filtrar por uno, la opción
 * activa no desaparece de la lista.
 */
function useRoleOptions(items: UserListItem[]) {
  const [seen, setSeen] = useState<string[]>([])

  useEffect(() => {
    setSeen((prev) => {
      const next = new Set(prev)
      const before = next.size
      for (const u of items) for (const r of u.roles ?? []) next.add(r)
      return next.size === before ? prev : [...next].sort((a, b) => a.localeCompare(b))
    })
  }, [items])

  return seen
}

/**
 * @param scopedToSeller true cuando el rol activo solo tiene Comercial.ReadOwnUsers:
 * el backend acota la lista a su propio embudo (código de referido y/o de descuento).
 */
export function UsuariosScreen({ scopedToSeller = false }: { scopedToSeller?: boolean }) {
  const [items, setItems] = useState<UserListItem[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [search, setSearchState] = useState('')
  const [role, setRoleState] = useState('')
  const [confirmed, setConfirmedState] = useState<ConfirmedFilter>('')
  const [estatus, setEstatusState] = useState('')
  const [estatusCounts, setEstatusCounts] = useState<EstatusConteo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const roleOptions = useRoleOptions(items)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const delay = search ? 350 : 0
    const handle = setTimeout(async () => {
      const res = await getUsers({
        skip,
        take: TAKE,
        search: search.trim() || undefined,
        role: role || undefined,
        emailConfirmed: confirmed === '' ? undefined : confirmed === 'true',
        estatus: estatus || undefined,
      })
      if (cancelled) return
      if (res.success) {
        setItems(res.value.items)
        setTotal(res.value.total)
        setEstatusCounts(res.value.estatus)
      } else {
        setError(res.error.message)
        setItems([])
        setTotal(0)
        setEstatusCounts([])
      }
      setLoading(false)
    }, delay)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [skip, search, role, confirmed, estatus])

  const setSearch = (v: string) => {
    setSkip(0)
    setSearchState(v)
  }
  const setRole = (v: string) => {
    setSkip(0)
    setRoleState(v)
  }
  const setConfirmed = (v: ConfirmedFilter) => {
    setSkip(0)
    setConfirmedState(v)
  }
  /** Click en un chip: alterna el filtro (volver a pulsarlo lo quita). */
  const toggleEstatus = (key: string) => {
    setSkip(0)
    setEstatusState((prev) => (prev === key ? '' : key))
  }

  const selectStyle = {
    background: 'var(--input)',
    border: '1px solid var(--border)',
    color: 'var(--ink-700)',
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        {scopedToSeller ? (
          <>
            Usuarios registrados con tu código de referido y/o código de descuento. Aquí ves
            todo el embudo del onboarding: desde que se crea la cuenta hasta que registra su RFC.
          </>
        ) : (
          <>
            Todos los usuarios registrados en la plataforma, hayan comprado o no. Busca por nombre,
            correo o teléfono, y filtra por rol, estado del correo o avance del alta.
          </>
        )}
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Buscar por nombre, correo o teléfono…"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[210px]"
            style={selectStyle}
          >
            <option value="">Todos los roles</option>
            {roleOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            value={confirmed}
            onChange={(e) => setConfirmed(e.target.value as ConfirmedFilter)}
            className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[200px]"
            style={selectStyle}
          >
            <option value="">Correo: todos</option>
            <option value="true">Solo confirmados</option>
            <option value="false">Solo pendientes</option>
          </select>
          {(search || role || confirmed || estatus) && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setRole('')
                setConfirmed('')
                setEstatusState('')
                setSkip(0)
              }}
              className="px-3.5 py-2.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Chips de avance del alta: cada uno filtra y muestra cuántos hay en la
            búsqueda actual. Volver a pulsar el activo quita el filtro. */}
        {estatusCounts.length > 0 && (
          <div
            className="px-4 pb-4 -mt-1 flex items-center gap-2 flex-wrap"
            role="group"
            aria-label="Filtrar por avance del alta"
          >
            {estatusCounts.map((c) => {
              const active = estatus === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleEstatus(c.key)}
                  aria-pressed={active}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                  style={{
                    background: active ? 'var(--nav-active-bg)' : 'var(--ink-50)',
                    color: active ? 'var(--nav-active-fg)' : 'var(--ink-700)',
                    border: `1px solid ${active ? 'var(--nav-active-bg)' : 'var(--border)'}`,
                    transition: 'background-color 150ms ease, color 150ms ease, transform 120ms cubic-bezier(0.23, 1, 0.32, 1)',
                  }}
                >
                  {c.label}
                  <span
                    className="px-1.5 rounded-full text-[11px] font-extrabold"
                    style={{
                      background: active ? 'rgba(255,255,255,0.22)' : 'var(--card)',
                      color: active ? 'var(--nav-active-fg)' : 'var(--ink-500)',
                    }}
                  >
                    {c.total}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${total} usuarios registrados`}
          </div>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={error} />
          </div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando usuarios…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Usuario', 'Teléfono', 'Roles', 'Contribuyentes', 'Estatus', 'Origen', 'Código de vendedor', 'Código de descuento', 'Vendedor', 'Estado', 'Registro'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((u) => (
                    <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {u.fullName || 'Sin nombre'}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {u.email}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {u.phoneNumber ? (
                          <div className="flex items-center gap-1.5">
                            <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-700)' }}>
                              {u.phoneNumber}
                            </code>
                            {u.phoneNumberConfirmed && (
                              <span title="Teléfono confirmado" style={{ color: 'var(--brand-700)' }}>
                                ✓
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <RolesCell roles={u.roles} />
                      </td>
                      <td className="px-5 py-4">
                        <TaxpayersCell total={u.contribuyentes} taxpayers={u.taxpayers} />
                      </td>
                      <td className="px-5 py-4">
                        <EstatusCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <OrigenCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <CodigoCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <DescuentoCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <VendedorCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <EstadoCell user={u} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs" style={{ color: 'var(--ink-700)' }}>
                          {formatDate(u.createdAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No se encontraron usuarios</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={Math.max(1, Math.ceil(total / TAKE))}
                total={total}
                skip={skip}
                take={TAKE}
                itemCount={items.length}
                onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
                onNext={() => setSkip((s) => (s + TAKE < total ? s + TAKE : s))}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}

function RolesCell({ roles }: { roles: string[] }) {
  if (!roles || roles.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>Sin rol</span>
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          {r}
        </span>
      ))}
    </div>
  )
}

function TaxpayersCell({ total, taxpayers }: { total: number; taxpayers: UserTaxpayer[] }) {
  if (!total) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  const shown = (taxpayers ?? []).slice(0, 2)
  const rest = total - shown.length
  return (
    <div className="flex flex-col gap-1">
      {shown.map((t) => (
        <code
          key={t.taxpayerId}
          title={t.legalName}
          className="block truncate max-w-[170px]"
          style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}
        >
          {t.rfc}
        </code>
      ))}
      {rest > 0 && (
        <span
          title={(taxpayers ?? []).slice(2).map((t) => `${t.rfc} · ${t.legalName}`).join('\n')}
          className="text-[11px] font-semibold"
          style={{ color: 'var(--ink-500)' }}
        >
          +{rest} más
        </span>
      )}
    </div>
  )
}

function EstadoCell({ user }: { user: UserListItem }) {
  return (
    <div className="flex flex-col gap-1 items-start">
      {user.emailConfirmed ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
        >
          <MailCheck size={12} /> Confirmado
        </span>
      ) : (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--amber-soft)', color: '#7B5312' }}
        >
          <MailWarning size={12} /> Sin confirmar
        </span>
      )}
      {user.bloqueado && (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
        >
          <Lock size={12} /> Bloqueado
        </span>
      )}
    </div>
  )
}

/**
 * Avance del alta con punto de color: gris creado · azul correo verificado ·
 * tinta usuario completo · verde RFC registrado. La etiqueta la resuelve el backend.
 */
function EstatusCell({ user }: { user: UserListItem }) {
  const label = user.estatusRegistro ?? `Paso ${user.registrationStatus}`
  const dot =
    user.contribuyentes > 0
      ? 'var(--brand-500)'
      : user.registrationStatus >= 4
        ? 'var(--ink-900)'
        : user.registrationStatus === 3
          ? 'var(--primary)'
          : 'var(--ink-400)'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dot }} />
      {label}
    </span>
  )
}

/** Origen del registro (Catalogs.SystemsOrigin) con icono según el tipo de alta. */
function OrigenCell({ user }: { user: UserListItem }) {
  const name = user.origen
  if (!name) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  const lower = name.toLowerCase()
  const Icon = lower.includes('móvil') || lower.includes('movil') || lower.includes('app')
    ? Smartphone
    : lower.includes('emplead')
      ? Users
      : lower.includes('legacy')
        ? Database
        : Globe
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
      <Icon size={13} style={{ color: 'var(--ink-400)' }} /> {name}
    </span>
  )
}

/** Código de vendedor (referido) con el que se registró la cuenta. */
function CodigoCell({ user }: { user: UserListItem }) {
  if (user.sellerCode) {
    return (
      <code
        className="inline-block px-2 py-0.5 rounded-md"
        style={{ ...MONO, fontSize: '11px', background: 'var(--brand-100)', color: 'var(--brand-900)' }}
      >
        {user.sellerCode}
      </code>
    )
  }
  // Hay vendedor ligado pero sin perfil comercial: el código aún no existe en el módulo.
  const hint = user.sellerUserId
    ? 'El vendedor aún no tiene código comercial asignado'
    : 'Registro sin código de vendedor'
  return <span className="text-xs" title={hint} style={{ color: 'var(--ink-500)' }}>—</span>
}

/** Códigos de descuento con los que ha comprado la cuenta. */
function DescuentoCell({ user }: { user: UserListItem }) {
  const codes = user.discountCodes ?? []
  if (codes.length === 0) {
    return <span className="text-xs" title="No compró con código de descuento" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  const shown = codes.slice(0, 2)
  const rest = codes.length - shown.length
  return (
    <div className="flex flex-col gap-1 items-start">
      {shown.map((c) => (
        <code
          key={c}
          className="inline-block px-2 py-0.5 rounded-md"
          style={{ ...MONO, fontSize: '11px', background: 'var(--amber-soft)', color: '#7B5312' }}
        >
          {c}
        </code>
      ))}
      {rest > 0 && (
        <span className="text-[11px] font-semibold" title={codes.slice(2).join('\n')} style={{ color: 'var(--ink-500)' }}>
          +{rest} más
        </span>
      )}
    </div>
  )
}

/** Vendedor dueño del código con el que se registró la cuenta. */
function VendedorCell({ user }: { user: UserListItem }) {
  if (!user.sellerName && !user.sellerUserId) {
    return <span className="text-xs" title="Registro directo" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  return (
    <div className="min-w-0">
      <div
        className="text-[12.5px] font-semibold truncate max-w-[160px]"
        title={user.sellerEmail ?? undefined}
        style={{ color: 'var(--ink-900)' }}
      >
        {user.sellerName || 'Sin nombre'}
      </div>
      {user.sellerEmail && (
        <div className="text-[11px] truncate max-w-[160px]" style={{ color: 'var(--ink-500)' }}>
          {user.sellerEmail}
        </div>
      )}
    </div>
  )
}
