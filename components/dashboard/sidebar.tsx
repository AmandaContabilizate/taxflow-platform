'use client'

import type { ComponentType } from 'react'
import { useState, useEffect } from 'react'
import { ChevronDown, LogOut, Moon, Plus, Sun, PanelLeftClose, PanelLeftOpen, UserPlus, PlusCircle, X } from 'lucide-react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { useNotifications } from '@/hooks/useNotifications'
import { DISPLAY, MONO, ROLE_NAV, roleNavSections, normalizeRole } from './constants'
import type { GoFn, NavDef, Screen } from './types'
import { RFCSelector } from './rfc-selector'

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
  permissions?: string[]
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
  permissions = [],
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const { resolvedTheme, setTheme } = useTheme()
  const isDark = mounted && resolvedTheme === 'dark'
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
  const isClient = roleKey === 'guest'
  // Diseño único: el menú se deriva de los PERMISOS del token (MODULE_CLAIMS);
  // guest y proveedor externo usan su nav fijo. Colapsado (solo íconos) va plano.
  const groupedNav = roleNavSections(roleKey, permissions)
  const baseNav = isClient ? (ROLE_NAV[roleKey] ?? ROLE_NAV.guest) : groupedNav.flatMap((s) => s.items)

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
          style={{ background: 'rgba(34,17,88,0.55)' }}
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
            <Image
              src="/logo.png"
              alt="Contabilízate"
              width={36}
              height={36}
              priority
              className="w-9 h-9 flex-shrink-0 select-none"
            />
            {!collapsed && (
              <span className="text-[18px] font-extrabold tracking-tight truncate" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                contabilízate
              </span>
            )}
          </div>
        </div>

        {roleKey == 'guest' && !collapsed && null}


        <nav className="flex flex-col gap-0 py-0 flex-1 min-h-0 overflow-y-auto overflow-x-hidden -mx-1 px-1">
          {groupedNav && !collapsed ? (
            groupedNav.map((section, idx) => {
              // El primer grupo (Inicio del guest) no tiene título; necesita una key propia.
              const sectionKey = section.section ?? `group-${idx}`
              // Toda sección con título es colapsable (diseño único para todos los roles).
              const isCollapsible = Boolean(section.section)
              const isCollapsed = isCollapsible && collapsedSections.has(section.section ?? '')
              const isFirst = idx === 0
              // Si la sección colapsada contiene la pantalla activa, se marca con un
              // punto de marca para no "perder" dónde estás.
              const hasActive = section.items.some(n => n.id === screen)

              return (
                <div key={sectionKey} className="flex flex-col gap-1">
                  {section.section && (
                    <button
                      onClick={() => toggleSection(section.section ?? '')}
                      aria-expanded={!isCollapsed}
                      className={`group mx-0.5 px-2 ${isFirst ? 'mt-0' : 'mt-3'} py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-2 cursor-pointer`}
                      style={{ color: 'var(--ink-400)', transition: 'background-color 150ms ease, color 150ms ease' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--sidebar-accent)'; e.currentTarget.style.color = 'var(--ink-700)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--ink-400)' }}
                      onFocus={(e) => { e.currentTarget.style.color = 'var(--ink-700)' }}
                      onBlur={(e) => { e.currentTarget.style.color = 'var(--ink-400)' }}
                    >
                      <span>{section.section}</span>
                      {isCollapsed && hasActive && (
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: 'var(--brand-500)' }}
                          aria-hidden
                        />
                      )}
                      <span className="flex-1" />
                      <ChevronDown
                        size={14}
                        style={{
                          transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                          transition: 'transform 200ms cubic-bezier(0.23, 1, 0.32, 1)',
                        }}
                      />
                    </button>
                  )}
                  {/* Colapso animado: grid-template-rows 1fr→0fr (suave, sin medir alturas). */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateRows: isCollapsed ? '0fr' : '1fr',
                      transition: 'grid-template-rows 250ms cubic-bezier(0.23, 1, 0.32, 1)',
                    }}
                  >
                    <div className="min-h-0 overflow-hidden flex flex-col gap-1">
                      {section.items.map(n => (
                        <NavItem
                          key={n.id}
                          id={n.id}
                          label={n.label}
                          Icon={n.Icon}
                          hint={n.hint}
                          badge={n.badge}
                          active={screen === n.id}
                          onClick={() => go(n.id)}
                          collapsed={false}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            navItems.map((n, idx) => (
              <div key={n.id} style={{ marginTop: idx === 0 ? '8px' : undefined }}>
                <NavItem
                  id={n.id}
                  label={n.label}
                  Icon={n.Icon}
                  hint={n.hint}
                  badge={n.badge}
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
            e.currentTarget.style.boxShadow = 'var(--brand-500) 0 0 0 2px rgba(0,211,161,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <span
            className={`rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${collapsed ? 'w-6 h-6' : 'w-9 h-9'}`}
            style={{
              background: isDark ? 'rgba(115,57,253,0.18)' : 'var(--ink-50)',
              color: isDark ? '#7339FD' : 'var(--ink-700)',
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
                  background: 'linear-gradient(135deg,#00D3A1,#00AD87)',
                  boxShadow: '0 4px 12px rgba(0,211,161,0.25)',
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
                background: 'linear-gradient(135deg,#00D3A1,#00AD87)',
                boxShadow: '0 4px 12px rgba(0,211,161,0.25)',
                ...DISPLAY
              }}
              title={firstName}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,211,161,0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,211,161,0.25)'
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

      {/* Panel de RFC activo: solo para el cliente. Los roles operativos no
          eligen RFC desde aquí, así que ni la pestañita flotante deben ver. */}
      {isClient && (
        <>
      {mouseOverPanel && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          onClick={() => setMouseOverPanel(false)}
          style={{ background: 'rgba(34,17,88,0.55)' }}
        />
      )}

      {/* Pestañita flotante para abrir panel */}
      {!mouseOverPanel && (
        <button
          onClick={() => setMouseOverPanel(true)}
          className="fixed right-0 bottom-6 z-[79] rounded-l-lg transition hover:opacity-85 flex items-center justify-center"
          style={{
            background: '#2A1C64',
            border: '1px solid #120A33',
            borderRight: 'none',
            color: 'white',
            padding: '8px 4px',
            width: '32px',
            height: '40px',
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
            className="absolute -left-6 bottom-6 w-6 h-10 rounded-l-lg transition"
            style={{
              background: '#00AD87',
              border: '1px solid #00AD87',
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
        <div className="mb-4">
          <RFCSelector compact={true} />
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
            setMouseOverPanel(false)
          }}
          title="Agregar un RFC"
          className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition hover:opacity-80 font-semibold text-[12px] text-white"
          style={{ background: '#00AD87' }}
        >
          <Plus size={16} />
          <span>Agregar un RFC</span>
        </button>
      </div>
        </>
      )}
    </>
  )
}

interface NavItemProps {
  id?: Screen
  label: string
  Icon: ComponentType<{ size?: number }>
  active: boolean
  onClick: () => void
  hint: string
  badge?: string
  collapsed?: boolean
}

function NavItem({ id, label, Icon, active, onClick, hint, badge, collapsed = false }: NavItemProps) {
  const isNotifications = id === 'centro-notificaciones';
  const { unreadCount } = useNotifications();
  const showBadge = isNotifications && unreadCount > 0;
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
        {showBadge && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition w-full relative group"
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
        <span className="flex items-center gap-1.5 min-w-0">
          <span className="text-[13.5px] font-bold leading-tight truncate">{label}</span>
          {badge && (
            <span
              className="flex-shrink-0 px-1.5 py-px rounded-full text-[9.5px] font-extrabold uppercase tracking-wide"
              style={{ background: '#F97316', color: '#FFFFFF' }}
            >
              {badge}
            </span>
          )}
        </span>
        <span
          className="block text-[11px] font-semibold mt-0.5 truncate"
          style={{ color: active ? 'var(--nav-active-hint)' : 'var(--ink-400)' }}
        >
          {hint}
        </span>
      </span>
      {showBadge && (
        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white shadow-sm animate-pulse flex-shrink-0 ml-1">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
