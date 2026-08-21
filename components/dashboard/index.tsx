'use client';

import { useState, useTransition, useEffect } from 'react'
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { signOut } from '@/features/auth/actions'
import { RfcProvider, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import SatConnectScreen from '@/components/sat-connect-screen'
import { DashboardHeader } from './header'
import NotificationCenterPage from '@/app/dashboard/notificaciones/page'
import { PushNotificationPrompt } from './PushNotificationPrompt'
import { DISPLAY, TITLES, normalizeRole } from './constants'
import { Sidebar } from './sidebar'
import type { DashboardProps, Screen } from './types'
import { useUrlState } from './url-state'
import {
  AprendeScreen,
  AyudaScreen,
  ClientesScreen,
  ContribuyentesScreen,
  PanelComercialScreen,
  PanelContadorScreen,
  PanelGerenciaContableScreen,
  CuentaScreen,
  DeclaracionesScreen,
  AsignacionesScreen,
  CodigosDescuentoScreen,
  ComisionesScreen,
  ConfiguracionScreen,
  DiagnosticoScreen,
  DocumentosScreen,
  EquipoScreen,
  EquipoOperacionesScreen,
  EstatusSatScreen,
  FacturasScreen,
  GeorgeScreen,
  HomeScreen,
  ManualScreen,
  MarketingScreen,
  MisClientesScreen,
  NotificacionesScreen,
  OperacionesScreen,
  PartnersScreen,
  PartnershipScreen,
  PermisosScreen,
  PlaceholderScreen,
  PlanScreen,
  RegularizacionesScreen,
  RenovacionesScreen,
  RolesScreen,
  TipDetailScreen,
  TramitesScreen,
  TramitesAdicionalesScreen,
  UsuariosScreen,
  VentasScreen,
  VistaFiscalScreen,
} from './screens';

// Pantallas de tablas/listados densos que aprovechan todo el ancho disponible.
// El resto se mantiene en max-w-[1280px] para lectura cómoda.
const WIDE_SCREENS = new Set<Screen>([
  'operaciones',
  'regularizaciones',
  'tramites-adicionales',
  'tramites',
  'mis-clientes',
  'equipo-operaciones',
  'clientes',
  'contribuyentes',
  'usuarios',
  'renovaciones',
  'ventas',
  'roles',
  'plan',
  'home',
  'vista-fiscal',
  'diagnostico',
  'estatussat',
  'facturas',
  'george',
  'documentos',
  'manual',
  'ayuda',
  'partnership',
  'centro-notificaciones',
]);

const isScreen = (v: string | null): v is Screen =>
  !!v && Object.prototype.hasOwnProperty.call(TITLES, v)

export default function Dashboard({ fullName, email, rfc, role, permissions, userId, phoneNumber }: DashboardProps) {
  const { params, setParams } = useUrlState()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [autoOpenPlanPicker, setAutoOpenPlanPicker] = useState(false)
  const [signingOut, startSignOut] = useTransition()
  const isClient = normalizeRole(role) === 'guest'

  // La URL manda. `localStorage` solo cubre la entrada limpia a /dashboard
  // (sin query), para seguir cayendo en la última pantalla usada.
  const fromUrl = params.get('s')
  const screen: Screen = isScreen(fromUrl) ? fromUrl : 'home'

  useEffect(() => {
    if (isScreen(fromUrl)) return
    const saved = localStorage.getItem('dashboard-screen')
    if (isScreen(saved) && saved !== 'home') setParams({ s: saved }, { replace: true })
  }, [fromUrl, setParams])

  useEffect(() => {
    localStorage.setItem('dashboard-screen', screen)
  }, [screen])

  const initials =
    (fullName || email)
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'U';
  const firstName = fullName.split(' ')[0] || 'Usuario';

  // Cambiar de pantalla limpia el estado profundo de la anterior (contribuyente,
  // declaración abierta, filtros); si no, quedan parámetros huérfanos en la URL.
  const go = (s: Screen) => {
    setParams({ s, rfc: null, regimen: null, decl: null, year: null, period: null, status: null })
    setMobileOpen(false)
    window.scrollTo(0, 0)
  }
  const handleLogout = () => {
    startSignOut(() => {
      signOut();
    });
  };
  // Desde Trámites: manda a "Mi plan" y deja que la pantalla abra el modal de pago.
  const goToPlanPicker = () => {
    setAutoOpenPlanPicker(true);
    go('plan');
  };

  return (
    <RfcProvider>
      <div
        className={`grid min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'lg:grid-cols-[80px_1fr]' : 'lg:grid-cols-[260px_1fr]'}`}
        style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
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
          permissions={permissions}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Botón de colapso flotante */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          title={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
          className='hidden lg:flex fixed top-6 z-[85] items-center justify-center rounded-lg transition-all duration-300 hover:opacity-80'
          style={{
            width: '32px',
            height: '32px',
            background: 'rgba(37, 99, 235, 0.1)',
            color: '#2563EB',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            left: sidebarCollapsed ? 'calc(80px - 16px)' : 'calc(260px - 16px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.15)';
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(37, 99, 235, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.2)';
          }}>
          {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        <main className={`min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 ${WIDE_SCREENS.has(screen) ? 'w-full' : 'max-w-[1280px]'}`}>
          <div className='flex items-center justify-between gap-4 mb-7'>
            <div className='flex items-center gap-3 flex-1'>
              <button
                onClick={() => setMobileOpen(true)}
                aria-label='Abrir menú'
                className='lg:hidden w-10 h-10 rounded-full flex items-center justify-center'
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <Menu size={18} />
              </button>
              <div>
                <div
                  className='text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight'
                  style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                  {screen === 'home' ? `Hola, ${firstName} 👋` : (TITLES[screen]?.[0] ?? '')}
                </div>
                <div
                  className='text-[14px] font-semibold mt-1'
                  style={{ color: 'var(--ink-500)' }}>
                  {TITLES[screen]?.[1] ?? ''}
                </div>
              </div>
            </div>
            {/* Selector de RFC y alta de RFC: solo para el cliente. Los roles
                operativos no operan sobre un RFC propio. */}
            {isClient && (
              <div className='hidden lg:flex'>
                <DashboardHeader go={go} />
              </div>
            )}
          </div>

          <PushNotificationPrompt userId={userId} />

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
            autoOpenPlanPicker={autoOpenPlanPicker}
            onPlanPickerHandled={() => setAutoOpenPlanPicker(false)}
            goToPlanPicker={goToPlanPicker}
          />
        </main>
      </div>
    </RfcProvider>
  );
}

interface RouterProps {
  screen: Screen;
  go: (s: Screen) => void;
  rfc: string | null;
  fullName: string;
  email: string;
  firstName: string;
  initials: string;
  onLogout: () => void;
  signingOut: boolean;
  role: string | null;
  permissions: string[];
  userId?: string | null;
  phoneNumber?: string | null;
  autoOpenPlanPicker: boolean;
  onPlanPickerHandled: () => void;
  goToPlanPicker: () => void;
}

function ScreenRouter({ screen, go, rfc, fullName, email, firstName, initials, onLogout, signingOut, role, permissions, userId, phoneNumber, autoOpenPlanPicker, onPlanPickerHandled, goToPlanPicker }: RouterProps) {
  const roleKey = normalizeRole(role);
  const isGuest = roleKey === 'guest';
  const { rfcs, selectedRfc } = useRfcStore();

  // Pantallas compartidas por todos los roles
  if (screen === 'cuenta') {
    const ciecState = rfcs.find((r) => r.rfc === selectedRfc)?.ciecState;
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
        isClient={isGuest}
        go={go}
      />
    );
  }
  if (screen === 'permisos') {
    return (
      <PermisosScreen
        initialPermissions={permissions}
        role={role}
      />
    );
  }
  if (screen === 'estatus-sat') {
    return <SatConnectScreen go={go} />;
  }

  if (!isGuest) {
    if (screen === 'home') {
      // Cada dashboard tiene su propio permiso (Dashboard.*), administrable por rol.
      // Orden de especificidad: gerencia (embudo global) > ventas (embudo propio) >
      // contador (su cartera). Los dashboards futuros se agregan aquí.
      const dashGerencia = permissions.includes('Dashboard.GerenciaComercial');
      const dashVentas = permissions.includes('Dashboard.Ventas');
      const dashGerenciaContable = permissions.includes('Dashboard.GerenciaContable');
      const dashContador = permissions.includes('Dashboard.Contador');
      if (dashGerencia || dashVentas) {
        return (
          <PanelComercialScreen
            go={go}
            scopedToSeller={dashVentas && !dashGerencia}
            canReadCommissions={permissions.includes('Comercial.ReadOwnCommissions')}
          />
        );
      }
      if (dashGerenciaContable) {
        return <PanelGerenciaContableScreen />;
      }
      if (dashContador) {
        return <PanelContadorScreen go={go} />;
      }
      return (
        <PlaceholderScreen
          title='Dashboard'
          description='Aquí verás tus indicadores y accesos directos según tu rol.'
        />
      );
    }
    if (screen === 'operaciones') {
      return <OperacionesScreen currentUser={{ userId: userId ?? '', fullName }} />
    }
    if (screen === 'regularizaciones') {
      return <RegularizacionesScreen currentUser={{ userId: userId ?? '', fullName }} />
    }
    if (screen === 'renovaciones') {
      return <RenovacionesScreen />
    }
    if (screen === 'tramites-adicionales') {
      return <TramitesAdicionalesScreen go={go} />;
    }
    if (screen === 'mis-clientes') {
      // Contador ve su cartera; gerencia (AssignAccountant) ve todas con filtro.
      return <MisClientesScreen permissions={permissions} userId={userId} />;
    }
    if (screen === 'clientes') {
      return <ClientesScreen permissions={permissions} />;
    }
    if (screen === 'contribuyentes') {
      return <ContribuyentesScreen />;
    }
    if (screen === 'usuarios') {
      // Alcance de vendedor: solo su embudo (referidos y códigos de descuento propios).
      return (
        <UsuariosScreen
          scopedToSeller={
            permissions.includes('Comercial.ReadOwnUsers') &&
            !permissions.includes('Backoffice.ReadUsers')
          }
        />
      );
    }
    if (screen === 'ventas') {
      return <VentasScreen />;
    }
    if (screen === 'equipo') {
      return <EquipoScreen />;
    }
    if (screen === 'partners') {
      return <PartnersScreen />;
    }
    if (screen === 'codigos-descuento') {
      // permissions: Admin.AuthorizeHighDiscount habilita autorizar códigos fuera de tope.
      return <CodigosDescuentoScreen permissions={permissions} />;
    }
    if (screen === 'asignaciones') {
      // Claim-driven: quien tiene Admin.ApproveAssignments revisa/aprueba;
      // la gerencia comercial (ManageAssignments) solicita/retira.
      return <AsignacionesScreen isAdmin={permissions.includes('Admin.ApproveAssignments')} />;
    }
    if (screen === 'comisiones') {
      return <ComisionesScreen permissions={permissions} />;
    }
    if (screen === 'roles') {
      return <RolesScreen currentUserId={userId ?? undefined} currentUserEmail={email || undefined} />;
    }
    if (screen === 'configuracion') {
      // Hub de configuración: cada card/tab se pinta según los claims Sistema.*
      return <ConfiguracionScreen permissions={permissions} />;
    }
    if (screen === 'equipo-operaciones') {
      // Carga por contador + invitación de contadores (gerencia de contabilidad).
      return <EquipoOperacionesScreen permissions={permissions} />;
    }
    if (screen === 'partnership') {
      return <PartnershipScreen />;
    }
    if (screen === 'marketing') {
      return <MarketingScreen />;
    }
    if (screen === 'notificaciones') {
      return <NotificacionesScreen />;
    }
    const [title, hint] = TITLES[screen] ?? ['Próximamente', ''];
    return (
      <PlaceholderScreen
        title={title}
        description={hint || undefined}
      />
    );
  }

  // Flujo Guest existente
  switch (screen) {
    case 'home':
      return (
        <HomeScreen
          go={go}
          firstName={firstName}
        />
      );
    case 'vista-fiscal':
      return <VistaFiscalScreen go={go} firstName={firstName} />;
    case 'declaraciones':
      return <DeclaracionesScreen go={go} currentUser={{ userId: userId ?? '', fullName }} />
    case 'facturas':
      return <FacturasScreen go={go} />;
    case 'george':
      return <GeorgeScreen go={go} />;
    case 'documentos':
      return <DocumentosScreen go={go} />;
    case 'diagnostico':
      return <DiagnosticoScreen go={go} />;
    case 'estatussat':
      return <EstatusSatScreen go={go} />;
    case 'aprende':
      return <AprendeScreen go={go} />;
    case 'tip-detail':
      return <TipDetailScreen go={go} />;
    case 'tramites':
      return <TramitesScreen onContratar={goToPlanPicker} go={go} />;
    case 'plan':
      return (
        <PlanScreen
          go={go}
          autoOpenPicker={autoOpenPlanPicker}
          onAutoOpenHandled={onPlanPickerHandled}
        />
      );
    case 'centro-notificaciones':
      return <NotificationCenterPage />;
    case 'ayuda':
      return <AyudaScreen />;
    case 'manual':
      return <ManualScreen go={go} />;
    default:
      return null;
  }
}
