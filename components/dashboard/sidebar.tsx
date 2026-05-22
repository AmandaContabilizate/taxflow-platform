'use client'

import type { ComponentType } from 'react'
import { ChevronDown, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO, PERMISOS_NAV, ROLE_NAV, normalizeRole } from './constants'
import type { GoFn, NavDef, Screen } from './types'

interface SidebarProps {
  screen: Screen
  mobileOpen: boolean
  onClose: () => void
  go: GoFn
  initials: string
  firstName: string
  onLogout: () => void
  signingOut: boolean
  role: string | null
}

export function Sidebar({
  screen,
  mobileOpen,
  onClose,
  go,
  initials,
  firstName,
  onLogout,
  signingOut,
  role,
}: SidebarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

  const roleKey = normalizeRole(role)
  const baseNav = ROLE_NAV[roleKey] ?? ROLE_NAV.guest

  const {
    rfcs,
    selectedRfc,
    selectedRfcInfo,
    loading: loadingRfcs,
    error: rfcsError,
    setSelectedRfc,
  } = useRfcStore()
  // Mientras estamos en pruebas, el modificador de permisos sólo se muestra
  // a Guest. Cuando exista el rol "Master" se cambia aquí.
  const navItems: NavDef[] = roleKey === 'guest' ? [...baseNav, PERMISOS_NAV] : baseNav

  return (
    <>
      {mobileOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-[70] lg:hidden"
          style={{ background: 'rgba(21,17,63,0.55)' }}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] z-[80] flex flex-col px-4 py-5 gap-1 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
        }}
      >
        <div
          className="flex items-center gap-2.5 px-2 pb-5 mb-3"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--brand-500)' }}
          >
            <span className="text-base font-black text-white" style={DISPLAY}>
              C
            </span>
          </div>
          <span className="text-[18px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            contabilízate
          </span>
        </div>

        {roleKey == 'guest' && (<div className="px-1 mb-3">
          <label
            className="block text-[10.5px] font-bold uppercase tracking-wider mb-1.5 px-1"
            style={{ color: 'var(--ink-500)' }}
          >
            RFC activo
          </label>
          <div
            className="relative rounded-2xl"
            style={{
              background: 'var(--sidebar-accent)',
              border: '1px solid var(--sidebar-border)',
            }}
          >
            <select
              value={selectedRfc ?? ''}
              onChange={e => setSelectedRfc(e.target.value)}
              disabled={loadingRfcs || rfcs.length === 0}
              aria-label="Seleccionar RFC"
              className="w-full appearance-none bg-transparent pl-3 pr-9 py-2.5 text-[13px] font-bold leading-tight outline-none disabled:opacity-60 cursor-pointer"
              style={{ ...MONO, color: 'var(--sidebar-accent-foreground)' }}
            >
              {loadingRfcs && <option value="">Cargando…</option>}
              {!loadingRfcs && rfcs.length === 0 && (
                <option value="">Sin RFC disponibles</option>
              )}
              {rfcs.map(r => (
                <option key={r.rfc} value={r.rfc} title={r.legalName}>
                  {r.rfc}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--ink-500)' }}
            />
          </div>
          {selectedRfcInfo && (
            <div
              className="text-[11px] font-semibold mt-1.5 px-1 truncate"
              style={{ color: 'var(--ink-500)' }}
              title={selectedRfcInfo.legalName}
            >
              {selectedRfcInfo.legalName}
            </div>
          )}
          {rfcsError && (
            <div
              className="text-[11px] font-semibold mt-1.5 px-1"
              style={{ color: '#8B1E1E' }}
            >
              {rfcsError}
            </div>
          )}
        </div>

        )}


        <nav className="flex flex-col gap-1.5 py-1">
          {navItems.map(n => (
            <NavItem
              key={n.id}
              label={n.label}
              Icon={n.Icon}
              hint={n.hint}
              active={screen === n.id}
              onClick={() => go(n.id)}
            />
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition w-full hover:opacity-90"
          style={{
            background: 'var(--sidebar-accent)',
            color: 'var(--sidebar-accent-foreground)',
            border: '1px solid var(--sidebar-border)',
          }}
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: isDark ? 'rgba(245,176,55,0.18)' : 'var(--ink-50)',
              color: isDark ? '#F5B037' : 'var(--ink-700)',
            }}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] font-bold leading-tight">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
            <span className="block text-[11.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-400)' }}>
              {isDark ? 'Cambia a tema brillante' : 'Cambia a tema oscuro'}
            </span>
          </span>
        </button>

        <div
          className="mt-3 p-3.5 rounded-2xl flex items-center gap-2.5"
          style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}
        >
          <button onClick={() => go('cuenta')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <div
              className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#10DA92,#00B073)', ...DISPLAY }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[13px] truncate">{firstName}</div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                Mi cuenta
              </div>
            </div>
          </button>
          <button
            onClick={onLogout}
            disabled={signingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}

interface NavItemProps {
  label: string
  Icon: ComponentType<{ size?: number }>
  active: boolean
  onClick: () => void
  hint: string
}

function NavItem({ label, Icon, active, onClick, hint }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition w-full"
      style={
        active
          ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)', boxShadow: 'var(--sh-ink)' }
          : { background: 'transparent', color: 'var(--ink-700)' }
      }
    >
      <span
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: active ? 'var(--nav-active-icon-bg)' : 'var(--ink-50)',
          color: active ? 'var(--nav-active-icon-fg)' : 'var(--ink-700)',
        }}
      >
        <Icon size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold leading-tight">{label}</span>
        <span
          className="block text-[11.5px] font-semibold mt-0.5"
          style={{ color: active ? 'var(--nav-active-hint)' : 'var(--ink-400)' }}
        >
          {hint}
        </span>
      </span>
    </button>
  )
}
