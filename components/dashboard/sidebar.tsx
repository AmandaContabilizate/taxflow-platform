'use client'

import type { ComponentType } from 'react'
import { useState } from 'react'
import { ChevronDown, LogOut, Moon, Plus, Sun, PanelLeftClose, PanelLeftOpen, UserPlus, PlusCircle, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO, ROLE_NAV, GUEST_NAV_GROUPED, normalizeRole } from './constants'
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

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [mouseOverPanel, setMouseOverPanel] = useState(false)

  const toggleSection = (section: string) => {
    const newCollapsed = new Set(collapsedSections)
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section)
    } else {
      newCollapsed.add(section)
    }
    setCollapsedSections(newCollapsed)
  }

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
  const navItems: NavDef[] = baseNav

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

        {roleKey == 'guest' && !collapsed && null}


        <nav className="flex flex-col gap-0 py-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mx-1 px-1">
          {roleKey === 'guest' && !collapsed ? (
            GUEST_NAV_GROUPED.map((section, idx) => {
              const isCollapsed = collapsedSections.has(section.section ?? '')
              const isCollapsible = ['FISCAL', 'CUENTA', 'AYUDA'].includes(section.section ?? '')
              const isFirst = idx === 0

              return (
                <div key={section.section} className="flex flex-col gap-1">
                  <button
                    onClick={() => isCollapsible && toggleSection(section.section ?? '')}
                    className={`px-2.5 ${isFirst ? 'pt-0' : 'pt-3'} pb-1.5 text-[10px] font-extrabold uppercase tracking-widest flex items-center justify-between transition-colors ${isCollapsible ? 'hover:opacity-70 cursor-pointer' : ''}`}
                    style={{ color: 'var(--ink-400)' }}
                  >
                    <span>{section.section}</span>
                    {isCollapsible && (
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms ease',
                        }}
                      />
                    )}
                  </button>
                  {!isCollapsed && section.items.map(n => (
                    <NavItem
                      key={n.id}
                      label={n.label}
                      Icon={n.Icon}
                      hint={n.hint}
                      active={screen === n.id}
                      onClick={() => go(n.id)}
                      collapsed={false}
                    />
                  ))}
                </div>
              )
            })
          ) : (
            navItems.map((n, idx) => (
              <div key={n.id} style={{ marginTop: idx === 0 ? '8px' : undefined }}>
                <NavItem
                  label={n.label}
                  Icon={n.Icon}
                  hint={n.hint}
                  active={screen === n.id}
                  onClick={() => go(n.id)}
                  collapsed={collapsed}
                />
              </div>
            ))
          )}
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

      {/* Overlay para cerrar panel en mobile */}
      {mouseOverPanel && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          onClick={() => setMouseOverPanel(false)}
          style={{ background: 'rgba(21,17,63,0.55)' }}
        />
      )}

      {/* Pestañita flotante para abrir panel */}
      {!mouseOverPanel && (
        <button
          onClick={() => setMouseOverPanel(true)}
          className="fixed right-0 top-1/2 z-[79] rounded-l-lg transition hover:opacity-85 flex items-center justify-center"
          style={{
            background: '#1E1952',
            border: '1px solid #0F0D2E',
            borderRight: 'none',
            color: 'white',
            padding: '12px 8px',
            width: '48px',
            height: '48px',
            transform: 'translateY(-50%)',
          }}
        >
          <ChevronDown size={18} style={{ transform: 'rotate(90deg)' }} />
        </button>
      )}

      <div
        className="fixed top-0 right-0 h-screen w-[280px] z-[80] transition-transform duration-300 shadow-lg flex flex-col py-6 px-4"
        style={{
          background: 'var(--sidebar)',
          borderLeft: '1px solid var(--sidebar-border)',
          color: 'var(--sidebar-foreground)',
          transform: mouseOverPanel ? 'translateX(0)' : 'translateX(100%)',
        }}
        onMouseEnter={() => setMouseOverPanel(true)}
        onMouseLeave={() => setMouseOverPanel(false)}
      >
        {/* Pestañita lateral para cerrar panel */}
        {mouseOverPanel && (
          <button
            onClick={() => setMouseOverPanel(false)}
            className="absolute -left-8 top-6 w-8 h-12 rounded-l-lg transition"
            style={{
              background: '#10B981',
              border: '1px solid #059669',
              borderRight: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
          </button>
        )}
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
          <h3 className="text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--ink-400)' }}>RFC Activo</h3>
          <button
            onClick={() => setMouseOverPanel(false)}
            className="p-1.5 rounded-lg transition hover:opacity-70"
            style={{ background: 'var(--sidebar-accent)' }}
          >
            <X size={16} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        {/* Selector RFC */}
        <div className="relative rounded-lg mb-3" style={{ background: 'var(--sidebar-accent)', border: '1px solid var(--sidebar-border)' }}>
          <select
            value={selectedRfc ?? ''}
            onChange={e => setSelectedRfc(e.target.value)}
            disabled={loadingRfcs || rfcs.length === 0}
            aria-label="Seleccionar RFC"
            className="w-full appearance-none bg-transparent pl-4 pr-10 py-3 text-[12px] font-bold leading-tight outline-none disabled:opacity-60 cursor-pointer"
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
            size={14}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--ink-500)' }}
          />
        </div>

        {/* Card con nombre y RFC */}
        {selectedRfcInfo && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--brand-50) 0%, var(--brand-100) 100%)',
              border: '1px solid var(--brand-200)',
            }}
          >
            <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--brand-700)' }}>
              Tu RFC Activo
            </div>
            <div className="text-[12px] font-bold mb-2" style={{ color: 'var(--ink-900)' }}>
              {selectedRfcInfo.legalName}
            </div>
            <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>
              {selectedRfc}
            </div>
          </div>
        )}

        {rfcsError && (
          <div className="text-[11px] font-semibold px-1" style={{ color: '#8B1E1E' }}>
            No pudimos cargar tus RFCs
          </div>
        )}

        {/* Botón Agregar RFC */}
        <button
          type="button"
          onClick={() => {
            go('estatus-sat')
            setShowRfcPanel(false)
          }}
          title="Agregar un RFC"
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition hover:opacity-80 font-semibold text-[12px] text-white"
          style={{ background: '#10B981' }}
        >
          <Plus size={16} />
          <span>Agregar un RFC</span>
        </button>
      </div>
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
