'use client'

import { useState, useTransition } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { signOut } from '@/features/auth/actions'
import { RfcProvider, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import SatConnectScreen from '@/components/sat-connect-screen'
import { DashboardHeader } from './header'
import { DISPLAY, TITLES, normalizeRole } from './constants'
import { Sidebar } from './sidebar'
import type { DashboardProps, Screen } from './types'
import {
  AprendeScreen,
  AyudaScreen,
  ClientesScreen,
  ContribuyentesScreen,
  CuentaScreen,
  DeclaracionesScreen,
  DiagnosticoScreen,
  DocumentosScreen,
  FacturasScreen,
  HomeScreen,
  MisClientesScreen,
  OperacionesScreen,
  PermisosScreen,
  PlaceholderScreen,
  PlanScreen,
  RegularizacionesScreen,
  RolesScreen,
  TipDetailScreen,
  TramitesScreen,
  TramitesAdicionalesScreen,
  VentasScreen,
  VistaFiscalScreen,
} from './screens'

// Pantallas de tablas/listados densos que aprovechan todo el ancho disponible.
// El resto se mantiene en max-w-[1280px] para lectura cómoda.
const WIDE_SCREENS = new Set<Screen>([
  'operaciones',
  'regularizaciones',
  'tramites-adicionales',
  'mis-clientes',
  'clientes',
  'contribuyentes',
  'ventas',
  'roles',
  'declaraciones',
  'plan',
  'home',
  'vista-fiscal',
])

export default function Dashboard({ fullName, email, rfc, role, permissions, userId, phoneNumber }: DashboardProps) {
  const [screen, setScreen] = useState<Screen>('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [signingOut, startSignOut] = useTransition()

  const initials =
    (fullName || email)
      .split(' ')
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('') || 'U'
  const firstName = fullName.split(' ')[0] || 'Usuario'

  const go = (s: Screen) => {
    setScreen(s)
    setMobileOpen(false)
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }
  const handleLogout = () => {
    startSignOut(() => {
      signOut()
    })
  }

  return (
    <RfcProvider initialRfc={rfc}>
      <div
        className={`grid min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[260px_1fr]'}`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}
      >
          <Sidebar
            screen={screen}
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
            go={go}
            initials={initials}
            firstName={firstName}
            onLogout={handleLogout}
            signingOut={signingOut}
            role={role}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

        {/* Botón de colapso flotante */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          className="hidden lg:flex fixed top-6 z-[85] items-center justify-center rounded-lg transition-all duration-300 hover:opacity-80"
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563EB',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            left: sidebarCollapsed ? 'calc(80px - 16px)' : 'calc(260px - 16px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)'
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)'
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)'
          }}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>

        <main
          className={`min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 ${WIDE_SCREENS.has(screen) ? 'w-full' : 'max-w-[1280px]'
            }`}
        >
          <div className="flex items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <Menu size={18} />
              </button>
              <div>
                <div
                  className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight"
                  style={{ ...DISPLAY, color: 'var(--ink-900)' }}
                >
                  {screen === 'home' ? `Hola, ${firstName} 👋` : TITLES[screen][0]}
                </div>
                <div className="text-[14px] font-semibold mt-1" style={{ color: 'var(--ink-500)' }}>
                  {TITLES[screen][1]}
                </div>
              </div>
            </div>
            {/* Header con buscador y botones de tema */}
            <div className="hidden lg:flex">
              <DashboardHeader />
            </div>
          </div>

          <ScreenRouter
            screen={screen}
            go={go}
            rfc={rfc}
            fullName={fullName}
            email={email}
            firstName={firstName}
            initials={initials}
            onLogout={handleLogout}
            signingOut={signingOut}
            role={role}
            permissions={permissions}
            userId={userId}
            phoneNumber={phoneNumber}
          />
        </main>
      </div>
    </RfcProvider>
  )
}

interface RouterProps {
  screen: Screen
  go: (s: Screen) => void
  rfc: string | null
  fullName: string
  email: string
  firstName: string
  initials: string
  onLogout: () => void
  signingOut: boolean
  role: string | null
  permissions: string[]
  userId?: string | null
  phoneNumber?: string | null
}

function ScreenRouter({
  screen,
  go,
  rfc,
  fullName,
  email,
  firstName,
  initials,
  onLogout,
  signingOut,
  role,
  permissions,
  userId,
  phoneNumber,
}: RouterProps) {
  const roleKey = normalizeRole(role)
  const isGuest = roleKey === 'guest'
  const { rfcs, selectedRfc } = useRfcStore()

  // Pantallas compartidas por todos los roles
  if (screen === 'cuenta') {
    const ciecState = rfcs.find(r => r.rfc === selectedRfc)?.ciecState
    return (
      <CuentaScreen
        fullName={fullName}
        email={email}
        rfc={rfc}
        phoneNumber={phoneNumber ?? undefined}
        ciecState={ciecState}
        initials={initials}
        onLogout={onLogout}
        signingOut={signingOut}
        role={null}
        go={go}
      />
    )
  }
  if (screen === 'permisos') {
    return <PermisosScreen initialPermissions={permissions} role={role} />
  }
  if (screen === 'estatus-sat') {
    return <SatConnectScreen />
  }

  // Para roles operativos, todo es placeholder por ahora (Dashboard incluido).
  if (!isGuest) {
    if (screen === 'home') {
      return (
        <PlaceholderScreen
          title="Dashboard"
          description="Aquí verás tus indicadores y accesos directos según tu rol."
        />
      )
    }
    if (screen === 'operaciones') {
      return <OperacionesScreen />
    }
    if (screen === 'regularizaciones') {
      return <RegularizacionesScreen />
    }
    if (screen === 'tramites-adicionales') {
      return <TramitesAdicionalesScreen />
    }
    if (screen === 'mis-clientes') {
      return <MisClientesScreen />
    }
    if (screen === 'clientes') {
      return <ClientesScreen permissions={permissions} />
    }
    if (screen === 'contribuyentes') {
      return <ContribuyentesScreen />
    }
    if (screen === 'ventas') {
      return <VentasScreen />
    }
    if (screen === 'roles') {
      return <RolesScreen currentUserId={userId ?? undefined} />
    }
    const [title, hint] = TITLES[screen] ?? ['Próximamente', '']
    return <PlaceholderScreen title={title} description={hint || undefined} />
  }

  // Flujo Guest existente
  switch (screen) {
    case 'home':
      return <HomeScreen go={go} firstName={firstName} />
    case 'vista-fiscal':
      return <VistaFiscalScreen go={go} />
    case 'declaraciones':
      return <DeclaracionesScreen go={go} />
    case 'facturas':
      return <FacturasScreen go={go} />
    case 'documentos':
      return <DocumentosScreen go={go} />
    case 'diagnostico':
      return <DiagnosticoScreen go={go} />
    case 'tip-detail':
      return <TipDetailScreen go={go} />
    case 'tramites':
      return <TramitesScreen />
    case 'plan':
      return <PlanScreen go={go} />
    case 'ayuda':
      return <AyudaScreen />
    default:
      return null
  }
}
