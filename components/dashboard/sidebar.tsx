'use client'

import type { ComponentType } from 'react'
import { ChevronDown, LogOut, Moon, Sun, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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
  collapsed?: boolean
  onToggleCollapse?: () => void
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
  collapsed = false,
  onToggleCollapse,
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
        className={`fixed lg:sticky top-0 left-0 h-screen shrink-0 z-[80] flex flex-col py-5 transition-all duration-300 lg:translate-x-0 ${collapsed ? 'w-[80px] px-2' : 'w-[260px] px-4'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
        }}
      >
        <div
          className="flex items-center px-2 pb-5 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300"
              style={{
                background: 'var(--brand-500)',
                boxShadow: 'var(--brand-500) 0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <span className="text-base font-black text-white" style={DISPLAY}>
                C
              </span>
            </div>
            {!collapsed && (
              <span className="text-[18px] font-extrabold tracking-tight truncate" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                contabilízate
              </span>
            )}
          </div>
        </div>

        {roleKey == 'guest' && !collapsed && (<div className="px-1 mb-3 flex-shrink-0">
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
              No pudimos cargar tus RFCs
            </div>
          )}
        </div>

        )}


        <nav className="flex flex-col gap-1 py-1 flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mx-1 px-1">
          {navItems.map(n => (
            <NavItem
              key={n.id}
              label={n.label}
              Icon={n.Icon}
              hint={n.hint}
              active={screen === n.id}
              onClick={() => go(n.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
          className={`mt-3 flex-shrink-0 flex items-center gap-3 rounded-2xl text-left transition-all duration-200 ${collapsed ? 'w-10 h-10 justify-center mx-auto' : 'px-3 py-2.5 w-full'}`}
          style={{
            background: 'var(--sidebar-accent)',
            color: 'var(--sidebar-accent-foreground)',
            border: '1px solid var(--sidebar-border)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--brand-500) 0 0 0 2px rgba(16,218,146,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span
            className={`rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-6 h-6' : 'w-9 h-9'}`}
            style={{
              background: isDark ? 'rgba(245,176,55,0.18)' : 'var(--ink-50)',
              color: isDark ? '#F5B037' : 'var(--ink-700)',
            }}
          >
            {isDark ? <Sun size={collapsed ? 14 : 18} /> : <Moon size={collapsed ? 14 : 18} />}
          </span>
          {!collapsed && (
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-bold leading-tight">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
              <span className="block text-[11.5px] font-semibold mt-0.5" style={{ color: 'var(--ink-400)' }}>
                {isDark ? 'Cambia a tema brillante' : 'Cambia a tema oscuro'}
              </span>
            </span>
          )}
        </button>

        <div
          className={`mt-3 flex-shrink-0 rounded-2xl flex items-center gap-2.5 transition-all duration-300 ${collapsed ? 'p-2 justify-center flex-col gap-2' : 'p-3.5'}`}
          style={{ background: 'var(--sidebar-accent)', border: '1.5px solid var(--sidebar-border)' }}
        >
          {!collapsed && (
            <button onClick={() => go('cuenta')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left transition-all duration-200 hover:opacity-80 rounded-lg p-1 -m-1">
              <div
                className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center flex-shrink-0 transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg,#10DA92,#00B073)',
                  boxShadow: '0 4px 12px rgba(16,218,146,0.25)',
                  ...DISPLAY
                }}
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
          )}
          {collapsed && (
            <button
              onClick={() => go('cuenta')}
              className="w-10 h-10 rounded-full text-white font-extrabold flex items-center justify-center flex-shrink-0 transition-all duration-200 group"
              style={{
                background: 'linear-gradient(135deg,#10DA92,#00B073)',
                boxShadow: '0 4px 12px rgba(16,218,146,0.25)',
                ...DISPLAY
              }}
              title={firstName}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16,218,146,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,218,146,0.25)'
              }}
            >
              {initials}
            </button>
          )}
          <button
            onClick={onLogout}
            disabled={signingOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className={`rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-50 ${collapsed ? 'w-9 h-9' : 'w-8 h-8'}`}
            style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '#8B1E1E 0 0 0 2px rgba(139,30,30,0.1)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <LogOut size={collapsed ? 16 : 15} />
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
  collapsed?: boolean
}

function NavItem({ label, Icon, active, onClick, hint, collapsed = false }: NavItemProps) {
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={label}
        className="flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 mx-auto group relative"
        style={
          active
            ? {
                background: 'var(--nav-active-bg)',
                color: 'var(--nav-active-fg)',
                boxShadow: 'var(--nav-active-bg) 0 4px 12px rgba(0,0,0,0.1)'
              }
            : {
                background: 'transparent',
                color: 'var(--ink-600)'
              }
        }
        onMouseEnter={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'var(--ink-50)'
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            e.currentTarget.style.background = 'transparent'
          }
        }}
      >
        <Icon size={18} />
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition w-full"
      style={
        active
          ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)', boxShadow: 'var(--sh-ink)' }
          : { background: 'transparent', color: 'var(--ink-700)' }
      }
    >
      <span
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: active ? 'var(--nav-active-icon-bg)' : 'var(--ink-50)',
          color: active ? 'var(--nav-active-icon-fg)' : 'var(--ink-700)',
        }}
      >
        <Icon size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-bold leading-tight truncate">{label}</span>
        <span
          className="block text-[11px] font-semibold mt-0.5 truncate"
          style={{ color: active ? 'var(--nav-active-hint)' : 'var(--ink-400)' }}
        >
          {hint}
        </span>
      </span>
    </button>
  )
}
