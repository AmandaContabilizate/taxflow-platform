'use client'

import { useMemo, useState } from 'react'
import {
  BarChart3,
  Check,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ALL_PERMISSIONS, DISPLAY } from '../constants'
import { Badge, Btn, Card, Divider, HelpBox, Pill } from '../ui'

interface PermisosScreenProps {
  initialPermissions: string[]
  role: string | null
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; at: string }
  | { kind: 'error'; message: string }

interface PermMeta {
  key: string
  label: string
  hint: string
  group: GroupKey
}

type GroupKey = 'roles' | 'contribuyentes' | 'datos' | 'cuenta'

interface GroupDef {
  key: GroupKey
  title: string
  hint: string
  icon: LucideIcon
  accent: string
  accentFg: string
}

const GROUPS: GroupDef[] = [
  {
    key: 'roles',
    title: 'Roles y equipo',
    hint: 'Quién puede asignar y administrar roles',
    icon: UserCog,
    accent: 'var(--violet-soft)',
    accentFg: 'var(--ink-700)',
  },
  {
    key: 'contribuyentes',
    title: 'Contribuyentes',
    hint: 'Alta y mantenimiento de RFC y datos fiscales',
    icon: Users,
    accent: 'var(--brand-100)',
    accentFg: 'var(--brand-700)',
  },
  {
    key: 'datos',
    title: 'Datos y reportes',
    hint: 'Acceso a ingresos, facturas y reportes',
    icon: BarChart3,
    accent: 'var(--sky-soft)',
    accentFg: 'var(--ink-700)',
  },
  {
    key: 'cuenta',
    title: 'Cuenta del usuario',
    hint: 'Perfil y datos personales',
    icon: FileText,
    accent: 'var(--amber-soft)',
    accentFg: 'var(--violet-ink)',
  },
]

const PERM_META: Record<string, Omit<PermMeta, 'key'>> = {
  AssignRole: { label: 'Asignar rol', hint: 'Otorga un rol a otro usuario', group: 'roles' },
  RemoveRole: { label: 'Quitar rol', hint: 'Remueve el rol asignado a un usuario', group: 'roles' },
  EditRole: { label: 'Editar rol', hint: 'Modifica los permisos de un rol existente', group: 'roles' },
  ViewRole: { label: 'Ver rol', hint: 'Consulta los roles y sus permisos', group: 'roles' },
  DeleteRole: { label: 'Eliminar rol', hint: 'Borra un rol del sistema', group: 'roles' },
  CreateTaxpayer: { label: 'Crear contribuyente', hint: 'Da de alta un RFC nuevo', group: 'contribuyentes' },
  CreateTaxpayerByQr: { label: 'Alta por QR', hint: 'Alta de RFC escaneando un QR del SAT', group: 'contribuyentes' },
  UpdateCIEC: { label: 'Actualizar CIEC', hint: 'Modifica la contraseña CIEC del contribuyente', group: 'contribuyentes' },
  LoadDigitalIdentity: { label: 'Cargar e.firma', hint: 'Sube los archivos .cer y .key del contribuyente', group: 'contribuyentes' },
  CompleteUserProfile: { label: 'Completar perfil', hint: 'Termina el onboarding del usuario', group: 'cuenta' },
  GetMontlyIncome: { label: 'Ver ingresos mensuales', hint: 'Consulta el resumen de ingresos del mes', group: 'datos' },
  MontlyBills: { label: 'Facturas mensuales', hint: 'Acceso al detalle de facturas del mes', group: 'datos' },
}

function meta(key: string): PermMeta {
  const m = PERM_META[key]
  if (m) return { key, ...m }
  return { key, label: key, hint: 'Permiso del sistema', group: 'datos' }
}

export function PermisosScreen({ initialPermissions, role }: PermisosScreenProps) {
  const [permissions, setPermissions] = useState<string[]>(initialPermissions)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [query, setQuery] = useState('')

  const dirty = useMemo(() => {
    if (permissions.length !== initialPermissions.length) return true
    const a = [...permissions].sort()
    const b = [...initialPermissions].sort()
    return a.some((p, i) => p !== b[i])
  }, [permissions, initialPermissions])

  function toggle(perm: string) {
    setPermissions((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]))
    setStatus({ kind: 'idle' })
  }

  function reset() {
    setPermissions(initialPermissions)
    setStatus({ kind: 'idle' })
  }

  function selectAllInGroup(group: GroupKey) {
    const keys = ALL_PERMISSIONS.filter((p) => meta(p).group === group)
    setPermissions((prev) => Array.from(new Set([...prev, ...keys])))
    setStatus({ kind: 'idle' })
  }

  function clearGroup(group: GroupKey) {
    const keys = new Set<string>(ALL_PERMISSIONS.filter((p) => meta(p).group === group))
    setPermissions((prev) => prev.filter((p) => !keys.has(p)))
    setStatus({ kind: 'idle' })
  }

  async function save() {
    setStatus({ kind: 'saving' })
    await new Promise((r) => setTimeout(r, 900))
    console.info('[permisos] payload simulado →', { role, permissions })
    setStatus({ kind: 'success', at: new Date().toLocaleTimeString() })
  }

  const filterFn = (p: string) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    const m = meta(p)
    return m.label.toLowerCase().includes(q) || m.key.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q)
  }

  const total = ALL_PERMISSIONS.length
  const granted = permissions.length
  const pct = Math.round((granted / total) * 100)

  return (
    <div className="flex flex-col gap-5 max-w-[1040px]">
      <HelpBox>
        Configura qué puede hacer este rol. Los cambios se aplican a <strong>{role ?? 'el rol actual'}</strong>. Cuando
        guardes, todos los usuarios con este rol verán las nuevas reglas.
      </HelpBox>

      {/* Hero / resumen */}
      <div
        className="rounded-3xl p-6 lg:p-7 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg,#2A1C64 0%,#221158 100%)',
          boxShadow: 'var(--sh-ink)',
        }}
      >
        <div
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#00D3A1 0%, transparent 70%)' }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)' }}
            >
              <ShieldCheck size={26} />
            </div>
            <div>
              <Pill kind="brand">
                <Sparkles size={11} /> Rol
              </Pill>
              <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-2" style={DISPLAY}>
                {role ?? 'Sin rol'}
              </div>
              <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {granted} de {total} permisos activos
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-[44px] font-extrabold tracking-tight leading-none" style={DISPLAY}>
              {pct}%
            </div>
            <div className="w-[160px] h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#00D3A1,#06FF94)' }}
              />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Cobertura
            </div>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div
        className="flex items-center gap-2 rounded-2xl px-4 py-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
      >
        <Search size={16} style={{ color: 'var(--ink-500)' }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca un permiso…"
          className="flex-1 bg-transparent outline-none text-[14px] font-semibold"
          style={{ color: 'var(--foreground)' }}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
            aria-label="Limpiar"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Grupos */}
      <div className="flex flex-col gap-4">
        {GROUPS.map((g) => {
          const items = ALL_PERMISSIONS.filter((p) => meta(p).group === g.key).filter(filterFn)
          if (items.length === 0) return null
          const groupGranted = items.filter((p) => permissions.includes(p)).length
          const Icon = g.icon
          return (
            <Card key={g.key}>
              <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: g.accent, color: g.accentFg }}
                  >
                    <Icon size={20} />
                  </div>
                  <div>
                    <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                      {g.title}
                    </div>
                    <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                      {g.hint}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge kind={groupGranted === items.length ? 'brand' : 'default'}>
                    {groupGranted} / {items.length}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => (groupGranted === items.length ? clearGroup(g.key) : selectAllInGroup(g.key))}
                    className="text-[12px] font-extrabold px-3 py-1.5 rounded-full transition hover:opacity-80"
                    style={{
                      background: 'var(--ink-50)',
                      color: 'var(--ink-700)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {groupGranted === items.length ? 'Quitar todos' : 'Activar todos'}
                  </button>
                </div>
              </div>
              <Divider />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
                {items.map((p) => {
                  const m = meta(p)
                  const active = permissions.includes(p)
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(p)}
                      className="flex items-start gap-3 px-5 py-4 text-left transition group"
                      style={{ background: 'var(--card)' }}
                    >
                      <span
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition"
                        style={{
                          background: active ? 'var(--brand-500)' : 'transparent',
                          border: active ? '1px solid var(--brand-500)' : '1.5px solid var(--border-strong)',
                          color: '#fff',
                        }}
                      >
                        {active && <Check size={14} />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span
                          className="block text-[14px] font-bold"
                          style={{ color: active ? 'var(--ink-900)' : 'var(--ink-700)' }}
                        >
                          {m.label}
                        </span>
                        <span className="block text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {m.hint}
                        </span>
                        <span
                          className="block text-[10.5px] font-mono mt-1 opacity-60"
                          style={{ color: 'var(--ink-500)' }}
                        >
                          {m.key}
                        </span>
                      </span>
                      {active && (
                        <span className="opacity-0 group-hover:opacity-100 transition">
                          <Badge kind="brand">Activo</Badge>
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Barra de guardado sticky */}
      <div
        className="sticky bottom-4 z-10 rounded-2xl px-5 py-4 flex flex-wrap items-center gap-3 justify-between backdrop-blur"
        style={{
          background: 'color-mix(in oklab, var(--card) 92%, transparent)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--sh-2)',
        }}
      >
        <div className="flex items-center gap-2 text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: dirty ? 'var(--amber)' : 'var(--brand-500)',
              boxShadow: dirty ? '0 0 0 3px var(--amber-soft)' : '0 0 0 3px var(--brand-100)',
            }}
          />
          {dirty ? 'Hay cambios sin guardar' : 'Todo está guardado'}
          {status.kind === 'success' && (
            <span className="ml-2 font-extrabold" style={{ color: 'var(--brand-700)' }}>
              ✓ Guardado a las {status.at}
            </span>
          )}
          {status.kind === 'error' && (
            <span className="ml-2 font-extrabold" style={{ color: 'var(--destructive)' }}>
              {status.message}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Btn kind="ghost" onClick={reset} disabled={!dirty || status.kind === 'saving'}>
            Descartar
          </Btn>
          <Btn kind="primary" onClick={save} disabled={!dirty || status.kind === 'saving'}>
            {status.kind === 'saving' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando…
              </>
            ) : (
              <>
                <Check size={16} /> Guardar cambios
              </>
            )}
          </Btn>
        </div>
      </div>
    </div>
  )
}
