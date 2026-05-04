'use client'

import { useState } from 'react'
import type { Profile, UserCredentials, Declaration, FiscalRegime } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

interface Props {
  profile: Profile
  credentials: UserCredentials | null
  declarations: Declaration[]
  regime: FiscalRegime | null
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: 'var(--amber-soft, #FFF1D6)', color: '#7B5312', label: 'Pendiente' },
  completed: { bg: 'var(--brand-100)', color: 'var(--brand-700)', label: 'Completada' },
  submitted: { bg: 'var(--brand-50)', color: 'var(--brand-900)', label: 'Presentada' },
}

export default function Dashboard({ profile, credentials, declarations, regime }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [activeNav, setActiveNav] = useState('dashboard')

  const initials = (profile.full_name ?? profile.email)
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  const pendingDeclarations = declarations.filter(d => d.status === 'pending').length
  const completedDeclarations = declarations.filter(d => d.status === 'completed' || d.status === 'submitted').length

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      ),
    },
    {
      id: 'declarations',
      label: 'Declaraciones',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ),
      badge: pendingDeclarations > 0 ? pendingDeclarations : undefined,
    },
    {
      id: 'fiscal',
      label: 'Datos Fiscales',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      ),
    },
    {
      id: 'planes',
      label: 'Planes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      ),
    },
  ]

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div
            className="flex items-center gap-2.5 px-2 pb-2"
            style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--ink-900)' }}
            >
              <span
                className="text-lg font-black"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--brand-400)' }}
              >
                C
              </span>
            </div>
            <span
              className="text-base font-black tracking-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Contabilízate
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map(item => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => setActiveNav(item.id)}
                  isActive={activeNav === item.id}
                  style={{
                    background: activeNav === item.id ? 'var(--ink-900)' : 'transparent',
                    color: activeNav === item.id ? '#fff' : 'var(--muted-foreground)',
                  }}
                >
                  <span style={{ color: activeNav === item.id ? 'var(--brand-300)' : 'currentColor' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className="ml-auto px-2 py-0.5 rounded-full text-xs font-black"
                      style={{
                        background: activeNav === item.id ? 'rgba(14,209,138,0.2)' : 'var(--brand-100)',
                        color: activeNav === item.id ? 'var(--brand-300)' : 'var(--brand-700)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <div
            className="flex items-center gap-2.5 p-3.5 rounded-2xl"
            style={{ border: '1px solid var(--border)', background: 'var(--muted)' }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-black"
              style={{ background: 'linear-gradient(135deg,#10DA92,#00B073)', color: '#fff' }}
            >
              {profile.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name ?? ''}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate" style={{ color: 'var(--foreground)' }}>
                {profile.full_name ?? profile.email}
              </p>
              {regime && (
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--brand-700)' }}>
                  {regime.name}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: 'var(--muted-foreground)' }}
              title="Cerrar sesión"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <div className="flex items-center gap-3 px-4 py-2 md:hidden">
          <SidebarTrigger />
          <span className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Menú</span>
        </div>

        <main className="flex-1 p-6 md:p-8 max-w-5xl"
        {activeNav === 'dashboard' && (
          <DashboardHome
            profile={profile}
            credentials={credentials}
            regime={regime}
            pendingDeclarations={pendingDeclarations}
            completedDeclarations={completedDeclarations}
          />
        )}
        {activeNav === 'declarations' && (
          <DeclarationsView declarations={declarations} />
        )}
        {activeNav === 'fiscal' && (
          <FiscalDataView credentials={credentials} regime={regime} />
        )}
        {activeNav === 'planes' && (
          <div className="text-center py-12">
            <a
              href="/planes"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm"
              style={{ background: 'var(--brand-500)', color: '#fff' }}
            >
              Ver todos los planes
            </a>
          </div>
        )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function DashboardHome({
  profile,
  credentials,
  regime,
  pendingDeclarations,
  completedDeclarations,
}: {
  profile: Profile
  credentials: UserCredentials | null
  regime: FiscalRegime | null
  pendingDeclarations: number
  completedDeclarations: number
}) {
  const year = new Date().getFullYear()
  const month = new Date().getMonth()

  const stats = [
    {
      label: 'Declaraciones pendientes',
      value: pendingDeclarations,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F5B037" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ),
      bg: 'var(--amber-soft, #FFF1D6)',
      color: '#7B5312',
    },
    {
      label: 'Declaraciones completadas',
      value: completedDeclarations,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      ),
      bg: 'var(--brand-50)',
      color: 'var(--brand-700)',
    },
    {
      label: 'RFC registrado',
      value: credentials?.rfc ?? 'Sin configurar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-600)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      ),
      bg: 'var(--ink-50)',
      color: 'var(--ink-700)',
    },
    {
      label: 'Régimen fiscal',
      value: regime?.name ?? 'Por configurar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-600)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      ),
      bg: 'var(--ink-50)',
      color: 'var(--ink-700)',
    },
  ]

  return (
    <div>
      {/* Greeting */}
      <div className="mb-8">
        <h1
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Hola, {(profile.full_name ?? profile.email).split(' ')[0]}
        </h1>
        <p className="text-sm font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>
          {MONTHS[month]} {year} — tu resumen fiscal
        </p>
      </div>

      {/* Setup banner if no credentials */}
      {!credentials && (
        <div
          className="flex items-center gap-4 p-5 rounded-2xl mb-6"
          style={{
            background: 'var(--ink-900)',
            boxShadow: '0 14px 40px rgba(21,17,63,0.15)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--brand-500)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white">Completa tu perfil fiscal</p>
            <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Configura tu RFC y CIEC para acceder a todas las funciones
            </p>
          </div>
          <a
            href="/onboarding"
            className="px-4 py-2 rounded-xl text-sm font-bold flex-shrink-0 transition-all"
            style={{ background: 'var(--brand-500)', color: '#fff' }}
          >
            Configurar
          </a>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="flex flex-col gap-3 p-5 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
                {stat.value}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2
          className="text-base font-black mb-4"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { label: 'Nueva declaración', desc: 'Presenta tu declaración mensual', href: '/nueva-declaracion', brand: true },
            { label: 'Ver constancia fiscal', desc: 'Descarga tu Constancia de Situación Fiscal', href: '/onboarding', brand: false },
            { label: 'Actualizar CIEC', desc: 'Actualiza tus credenciales del SAT', href: '/onboarding', brand: false },
            { label: 'Cambiar plan', desc: 'Actualiza tu suscripción', href: '/planes', brand: false },
          ].map(action => (
            <a
              key={action.label}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-2xl transition-all"
              style={{
                background: action.brand ? 'var(--ink-900)' : 'var(--card)',
                border: `1px solid ${action.brand ? 'transparent' : 'var(--border)'}`,
              }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: action.brand ? '#fff' : 'var(--foreground)' }}>
                  {action.label}
                </p>
                <p className="text-xs font-semibold" style={{ color: action.brand ? 'rgba(255,255,255,0.6)' : 'var(--muted-foreground)' }}>
                  {action.desc}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={action.brand ? 'var(--brand-400)' : 'var(--muted-foreground)'}
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeclarationsView({ declarations }: { declarations: Declaration[] }) {
  return (
    <div>
      <h1
        className="text-3xl font-black tracking-tight mb-6"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Mis declaraciones
      </h1>
      {declarations.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted-foreground)" strokeWidth="1.5" className="mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <p className="text-base font-bold" style={{ color: 'var(--foreground)' }}>Sin declaraciones aún</p>
          <p className="text-sm font-semibold mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Tus declaraciones aparecerán aquí una vez que tengas una suscripción activa
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {declarations.map(d => {
            const statusStyle = STATUS_STYLES[d.status] ?? STATUS_STYLES.pending
            return (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 rounded-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-black"
                  style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
                >
                  {MONTHS[d.period_month - 1]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                    Declaración {MONTHS[d.period_month - 1]} {d.period_year}
                  </p>
                  {d.due_date && (
                    <p className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Vence: {new Date(d.due_date).toLocaleDateString('es-MX')}
                    </p>
                  )}
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}
                >
                  {statusStyle.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FiscalDataView({ credentials, regime }: { credentials: UserCredentials | null; regime: FiscalRegime | null }) {
  return (
    <div>
      <h1
        className="text-3xl font-black tracking-tight mb-6"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
      >
        Datos fiscales
      </h1>
      <div className="flex flex-col gap-4">
        {[
          { label: 'RFC', value: credentials?.rfc ?? 'No configurado', icon: '🪪' },
          { label: 'CIEC', value: credentials ? '••••••••' : 'No configurado', icon: '🔑' },
          { label: 'e.Firma (FIEL)', value: credentials?.fiel_stored_at ? 'Cargada' : 'No cargada', icon: '📋' },
          { label: 'Régimen fiscal', value: regime?.name ?? 'No configurado', icon: '🏛' },
          { label: 'Última verificación', value: credentials?.verified_at ? new Date(credentials.verified_at).toLocaleDateString('es-MX') : 'Nunca', icon: '✅' },
        ].map(item => (
          <div
            key={item.label}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <span className="text-xl">{item.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>
                {item.label}
              </p>
              <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--foreground)' }}>
                {item.value}
              </p>
            </div>
            <a
              href="/onboarding"
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'var(--muted)', color: 'var(--foreground)' }}
            >
              Editar
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
