'use client'

import { useState, useTransition } from 'react'
import { Menu } from 'lucide-react'
import { signOut } from '@/features/auth/actions'
import { RfcProvider } from '@/features/taxpayers/stores/rfcStore'
import SatConnectScreen from '@/components/sat-connect-screen'
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
  PartnershipScreen,
  PermisosScreen,
  PlaceholderScreen,
  PlanScreen,
  RegularizacionesScreen,
  RolesScreen,
  TipDetailScreen,
  TramitesScreen,
  TramitesAdicionalesScreen,
  VentasScreen,
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
  'partnership',
])

export default function Dashboard({ fullName, email, rfc, role, permissions, userId }: DashboardProps) {
  const [screen, setScreen] = useState<Screen>('home')
  const [mobileOpen, setMobileOpen] = useState(false)
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
        className="grid min-h-screen lg:grid-cols-[260px_1fr]"
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
        />

        <main
          className={`min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 ${WIDE_SCREENS.has(screen) ? 'w-full' : 'max-w-[1280px]'
            }`}
        >
          <div className="flex items-center justify-between gap-4 mb-7">
            <div className="flex items-center gap-3">
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
}: RouterProps) {
  const roleKey = normalizeRole(role)
  const isGuest = roleKey === 'guest'

  // Pantallas compartidas por todos los roles
  if (screen === 'cuenta') {
    return (
      <CuentaScreen
        fullName={fullName}
        email={email}
        rfc={rfc}
        initials={initials}
        onLogout={onLogout}
        signingOut={signingOut} role={null} go={function (s: Screen): void {
          throw new Error('Function not implemented.')
        }} />
    )
  }
  if (screen === 'permisos') {
    return <PermisosScreen initialPermissions={permissions} role={role} />
  }
  if (screen === 'estatus-sat') {
    return <SatConnectScreen go={go} />
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
    if (screen === 'partnership') {
      return <PartnershipScreen />
    }
    const [title, hint] = TITLES[screen] ?? ['Próximamente', '']
    return <PlaceholderScreen title={title} description={hint || undefined} />
  }

  // Flujo Guest existente
  switch (screen) {
    case 'home':
      return <HomeScreen go={go} firstName={firstName} />
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
      return <PlanScreen />
    case 'ayuda':
      return <AyudaScreen />
    default:
      return null
  }
}
