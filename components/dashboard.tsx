'use client'

import { useState, useTransition, type ComponentType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, AlertTriangle, ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Bell, BellRing,
  Building, Building2, Calendar, CalendarCheck, CalendarClock, Car, Check, CheckCircle2,
  ChevronLeft, ChevronRight, CreditCard, Download, Eye, Factory, FileCheck, FileCheck2, FileClock,
  FileDown, FilePlus, FilePlus2, FileText, FileWarning, FolderLock, Fuel, Gem, Gift, HeartPulse,
  Home, House, Key, Landmark, LayoutDashboard, LifeBuoy, Lightbulb, Link2, Lock, LogOut, Mail,
  MapPin, Menu, MessageCircle, Microscope, MoveHorizontal, PiggyBank, Plus, RefreshCcw, Receipt,
  Send, Settings, Share2, Shield, ShieldCheck, Smartphone, Sparkles, Stethoscope, Target,
  TrendingUp, Tv, UserCog, UserRound, Zap,
} from 'lucide-react'
import { signOut } from '@/features/auth/actions'

interface Props {
  fullName: string
  email: string
  rfc: string | null
}

type Screen =
  | 'home' | 'fiscal' | 'diagnostico' | 'estatus-sat' | 'declaraciones' | 'facturar' | 'boveda'
  | 'analisis' | 'pagar' | 'seguros' | 'creditos' | 'aprende' | 'tip-detail' | 'yo' | 'plan' | 'tramites'

const TITLES: Record<Screen, [string, string]> = {
  home: ['Tu panel fiscal', 'Hola de nuevo · Abril 2026'],
  fiscal: ['Tu vida fiscal', 'Todas tus herramientas en un solo lugar'],
  diagnostico: ['Diagnóstico fiscal', '9 facturas y 3 declaraciones analizadas'],
  'estatus-sat': ['Estatus ante SAT', 'Monitoreo continuo de listas y cumplimiento'],
  declaraciones: ['Declaraciones', 'Al día con tus obligaciones mensuales'],
  facturar: ['Facturación CFDI', 'Emite y gestiona tus facturas'],
  boveda: ['Bóveda SAT', 'Sincronización en vivo con el SAT'],
  analisis: ['Análisis IA', 'Tu asesor personal con inteligencia artificial'],
  pagar: ['Hub+ · Servicios', 'Paga servicios y genera CFDI deducible'],
  seguros: ['Hub+ · Seguros', 'Protege tu patrimonio · deducible'],
  creditos: ['Hub+ · Crédito', 'Preaprobado gracias a tu score fiscal'],
  aprende: ['Aprende', 'Tu guía financiera personalizada'],
  'tip-detail': ['Lección', 'Deduce gasolina, mantenimiento y seguro'],
  yo: ['Mi cuenta', 'Gestión de perfil y preferencias'],
  plan: ['Mi plan', 'Platinum · Mensual · renueva 28 abr'],
  tramites: ['Trámites adicionales', 'Servicios puntuales ante el SAT'],
}

interface NavDef { id: Screen; label: string; Icon: ComponentType<{ size?: number }>; meta?: string }
const NAV_FISCAL: NavDef[] = [
  { id: 'fiscal', label: 'Vista fiscal', Icon: LayoutDashboard },
  { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope },
  { id: 'estatus-sat', label: 'Estatus SAT', Icon: ShieldCheck },
  { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, meta: '5' },
  { id: 'facturar', label: 'Facturación', Icon: FilePlus },
  { id: 'boveda', label: 'Bóveda', Icon: FolderLock },
  { id: 'analisis', label: 'Análisis IA', Icon: Microscope },
]
const NAV_HUB: NavDef[] = [
  { id: 'pagar', label: 'Servicios', Icon: Zap },
  { id: 'seguros', label: 'Seguros', Icon: Shield },
  { id: 'creditos', label: 'Crédito', Icon: CreditCard },
]
const NAV_RES: NavDef[] = [
  { id: 'aprende', label: 'Aprende', Icon: Sparkles },
  { id: 'tramites', label: 'Trámites', Icon: FilePlus2 },
  { id: 'plan', label: 'Mi plan', Icon: Gem },
]

const DISPLAY = { fontFamily: 'var(--font-display)' } as const
const MONO = { fontFamily: 'var(--font-mono)' } as const

export default function Dashboard({ fullName, email, rfc }: Props) {
  const [screen, setScreen] = useState<Screen>('home')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, startSignOut] = useTransition()

  const initials = (fullName || email).split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || 'U'
  const firstName = fullName.split(' ')[0] || 'Usuario'

  const go = (s: Screen) => { setScreen(s); setMobileOpen(false); if (typeof window !== 'undefined') window.scrollTo(0, 0) }
  const handleLogout = () => { startSignOut(() => { signOut() }) }

  return (
    <div className="grid min-h-screen lg:grid-cols-[264px_1fr]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[70] lg:hidden" style={{ background: 'rgba(21,17,63,0.55)' }} />
      )}

      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[264px] z-[80] flex flex-col px-4 py-5 gap-1 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5 px-2 pb-5 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-500)' }}>
            <span className="text-base font-black text-white" style={DISPLAY}>C</span>
          </div>
          <span className="text-[18px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>contabilízate</span>
        </div>

        <nav className="flex flex-col gap-0.5 py-1">
          <NavItem id="home" label="Inicio" Icon={House} active={screen === 'home'} onClick={() => go('home')} />
          <NavSection>Fiscal</NavSection>
          {NAV_FISCAL.map(n => <NavItem key={n.id} {...n} active={screen === n.id} onClick={() => go(n.id)} />)}
          <NavSection>Hub+</NavSection>
          {NAV_HUB.map(n => <NavItem key={n.id} {...n} active={screen === n.id} onClick={() => go(n.id)} />)}
          <NavSection>Recursos</NavSection>
          {NAV_RES.map(n => <NavItem key={n.id} {...n} active={screen === n.id} onClick={() => go(n.id)} />)}
        </nav>

        <div
          className="mt-auto p-3.5 rounded-2xl flex items-center gap-2.5"
          style={{ background: 'linear-gradient(160deg,#FFF,#F9FAFB)', border: '1px solid var(--border)' }}
        >
          <button onClick={() => go('yo')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <div className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#10DA92,#00B073)', ...DISPLAY }}>{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[13px] truncate">{fullName}</div>
              <div className="text-[11px] font-bold" style={{ color: 'var(--brand-700)' }}>Platinum</div>
            </div>
          </button>
          <button
            onClick={() => go('yo')}
            aria-label="Configuración"
            title="Configuración"
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition hover:opacity-90"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
          >
            <Settings size={15} />
          </button>
          <button
            onClick={handleLogout}
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

      {/* ============ MAIN ============ */}
      <main className="min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 max-w-[1440px]">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Menu size={18} />
            </button>
            <div>
              <div className="text-[24px] lg:text-[28px] font-extrabold tracking-tight leading-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>{TITLES[screen][0]}</div>
              <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
                {screen === 'home' ? `Hola de nuevo, ${firstName} · Abril 2026` : TITLES[screen][1]}
              </div>
            </div>
          </div>
        </div>

        {screen === 'home' && <HomeScreen go={go} rfc={rfc} />}
        {screen === 'fiscal' && <FiscalScreen go={go} />}
        {screen === 'diagnostico' && <DiagnosticoScreen />}
        {screen === 'estatus-sat' && <EstatusSatScreen rfc={rfc} />}
        {screen === 'declaraciones' && <DeclaracionesScreen />}
        {screen === 'facturar' && <FacturarScreen />}
        {screen === 'boveda' && <BovedaScreen />}
        {screen === 'analisis' && <AnalisisScreen />}
        {screen === 'pagar' && <PagarScreen go={go} />}
        {screen === 'seguros' && <SegurosScreen go={go} />}
        {screen === 'creditos' && <CreditosScreen go={go} />}
        {screen === 'aprende' && <AprendeScreen go={go} />}
        {screen === 'tip-detail' && <TipDetailScreen go={go} />}
        {screen === 'yo' && <YoScreen fullName={fullName} email={email} rfc={rfc} initials={initials} go={go} onLogout={handleLogout} signingOut={signingOut} />}
        {screen === 'plan' && <PlanScreen />}
        {screen === 'tramites' && <TramitesScreen />}
      </main>
    </div>
  )
}

// ============ Sidebar pieces ============
function NavSection({ children }: { children: ReactNode }) {
  return <div className="text-[10.5px] tracking-[0.14em] uppercase font-extrabold px-3 pt-3.5 pb-1.5" style={{ color: 'var(--ink-400)' }}>{children}</div>
}
function NavItem({ label, Icon, active, onClick, meta }: { label: string; Icon: ComponentType<{ size?: number }>; active: boolean; onClick: () => void; meta?: string; id?: Screen }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-semibold transition w-full text-left"
      style={
        active
          ? { background: 'var(--ink-900)', color: '#fff', boxShadow: 'var(--sh-ink)' }
          : { background: 'transparent', color: 'var(--ink-500)' }
      }
    >
      <span className="w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ color: active ? 'var(--brand-300)' : undefined }}>
        <Icon size={18} />
      </span>
      {label}
      {meta && (
        <span
          className="ml-auto text-[10px] font-extrabold px-1.5 py-0.5 rounded-full"
          style={
            active
              ? { background: 'rgba(14,209,138,0.2)', color: 'var(--brand-300)' }
              : { background: 'var(--brand-100)', color: 'var(--brand-900)' }
          }
        >{meta}</span>
      )}
    </button>
  )
}

// ============ Reusable bits ============
function Card({ children, style, className = '' }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={`rounded-3xl overflow-hidden ${className}`} style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-2)', ...style }}>{children}</div>
}
function Eyebrow({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div className="text-[11px] tracking-[0.1em] uppercase font-extrabold" style={{ color: 'var(--ink-400)', ...style }}>{children}</div>
}
function Pill({ children, kind = 'default', style }: { children: ReactNode; kind?: 'default' | 'brand' | 'coral' | 'amber' | 'ink' | 'sky' | 'danger'; style?: React.CSSProperties }) {
  const map: Record<string, React.CSSProperties> = {
    default: { background: 'var(--card)', color: 'var(--ink-700)', border: '1px solid var(--border-strong)' },
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15', border: '1px solid rgba(255,136,98,0.35)' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312', border: '1px solid rgba(245,176,55,0.35)' },
    ink: { background: 'var(--ink-900)', color: '#fff', border: '1px solid transparent' },
    sky: { background: 'var(--sky-soft)', color: '#1C4C96', border: '1px solid rgba(94,168,255,0.35)' },
    danger: { background: 'var(--danger-soft)', color: '#8B1E1E', border: '1px solid rgba(232,77,77,0.35)' },
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold" style={{ ...map[kind], ...style }}>{children}</span>
}
function Badge({ children, kind = 'default' }: { children: ReactNode; kind?: 'default' | 'brand' | 'amber' | 'coral' | 'danger' | 'ink' | 'sky' | 'outline' | 'violet' }) {
  const map: Record<string, React.CSSProperties> = {
    default: { background: 'var(--ink-50)', color: 'var(--ink-700)' },
    brand: { background: 'var(--brand-100)', color: 'var(--brand-900)' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
    danger: { background: 'var(--danger-soft)', color: '#8B1E1E' },
    ink: { background: 'var(--ink-900)', color: 'var(--brand-300)' },
    sky: { background: 'var(--sky-soft)', color: '#1C4C96' },
    violet: { background: 'var(--violet-soft)', color: '#403A8D' },
    outline: { background: 'transparent', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' },
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold" style={map[kind]}>{children}</span>
}
function Btn({ children, kind = 'primary', size = 'md', onClick, block, style }: { children: ReactNode; kind?: 'primary' | 'brand' | 'ghost' | 'coral'; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; block?: boolean; style?: React.CSSProperties }) {
  const padding = size === 'sm' ? 'px-3.5 py-2 text-[13px] min-h-[34px]' : size === 'lg' ? 'px-6 py-3.5 text-[15px] min-h-[50px]' : 'px-5 py-3 text-[14px] min-h-[42px]'
  const stylesByKind: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--ink-900)', color: '#fff', boxShadow: 'var(--sh-ink)' },
    brand: { background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
    ghost: { background: 'var(--card)', color: 'var(--ink-900)', border: '1px solid var(--border-strong)' },
    coral: { background: 'var(--coral)', color: '#fff', boxShadow: '0 14px 34px -10px rgba(255,136,98,0.5)' },
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] hover:opacity-95 ${padding} ${block ? 'w-full' : ''}`}
      style={{ ...stylesByKind[kind], ...style }}
    >{children}</button>
  )
}
function ListItem({ icon, iconKind = 'default', title, sub, right, onClick }: { icon: ReactNode; iconKind?: 'default' | 'brand' | 'coral' | 'amber' | 'sky' | 'violet' | 'danger'; title: ReactNode; sub?: ReactNode; right?: ReactNode; onClick?: () => void }) {
  const iconBg: Record<string, React.CSSProperties> = {
    default: { background: 'var(--ink-50)', color: 'var(--ink-700)' },
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    sky: { background: 'var(--sky-soft)', color: '#1C4C96' },
    violet: { background: 'var(--violet-soft)', color: '#403A8D' },
    danger: { background: 'var(--danger-soft)', color: '#8B1E1E' },
  }
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3.5 px-4 py-3.5 w-full text-left rounded-2xl transition hover:translate-y-[-1px]"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
    >
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={iconBg[iconKind]}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14px] leading-tight">{title}</div>
        {sub && <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>{sub}</div>}
      </div>
      {right}
    </button>
  )
}
function Tile({ children, onClick, style }: { children: ReactNode; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      className="p-[18px] rounded-2xl flex flex-col gap-3 text-left transition hover:translate-y-[-2px] min-h-[130px]"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)', ...style }}
    >{children}</button>
  )
}
function TIcon({ children, kind = 'default' }: { children: ReactNode; kind?: 'default' | 'brand' | 'coral' | 'ink' | 'sky' | 'amber' | 'violet' | 'danger' }) {
  const map: Record<string, React.CSSProperties> = {
    default: { background: 'var(--ink-50)', color: 'var(--ink-800)' },
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
    ink: { background: 'var(--ink-900)', color: 'var(--brand-300)' },
    sky: { background: 'var(--sky-soft)', color: '#1C4C96' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    violet: { background: 'var(--violet-soft)', color: '#403A8D' },
    danger: { background: 'var(--danger-soft)', color: '#8B1E1E' },
  }
  return <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center" style={map[kind]}>{children}</div>
}
function Divider({ dark = false }: { dark?: boolean }) {
  return <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.08)' : 'var(--border)' }} />
}

// ============ HOME ============
function HomeScreen({ go, rfc }: { go: (s: Screen) => void; rfc: string | null }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  return (
    <>
      <div className="grid grid-cols-12 gap-[18px]">
        {/* Hero score */}
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-[36px] p-7 relative overflow-hidden text-white" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)', minHeight: 280 }}>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)', boxShadow: '0 0 0 3px var(--brand-100)' }} />SAT sincronizado · hace 2 min
              </span>
              <Badge kind="ink">Platinum</Badge>
            </div>

            <div className="flex items-end gap-7 mt-7">
              <div className="relative inline-flex">
                <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
                  <circle cx="80" cy="80" r="68" fill="none" stroke="url(#ringG)" strokeWidth="12" strokeLinecap="round" strokeDasharray="427.3" strokeDashoffset="77" />
                  <defs>
                    <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#74EFC0" /><stop offset="1" stopColor="#0ED18A" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[56px] font-extrabold leading-none tracking-tight" style={{ ...DISPLAY }}>82</div>
                  <div className="text-[12px] font-bold" style={{ color: 'rgba(255,255,255,0.62)' }}>/ 100</div>
                </div>
              </div>
              <div className="flex-1">
                <Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Tu score fiscal</Eyebrow>
                <div className="text-[40px] font-extrabold tracking-tight leading-none mt-1.5" style={DISPLAY}>Muy bueno</div>
                <div className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.62)' }}>Suma <strong className="text-white">+8 pts</strong> regularizando 5 declaraciones pendientes.</div>
              </div>
            </div>

            <Divider dark />
            <div className="flex items-center justify-between mt-5">
              <div>
                <Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Tu acción de hoy</Eyebrow>
                <div className="text-[16px] font-bold mt-1">Declaración mensual · vence el día 17</div>
                <div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.62)' }}>Tu contador revisa 9 facturas · te avisamos cuando esté lista</div>
              </div>
              <Btn size="sm" onClick={() => go('declaraciones')} style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>Ver detalle <ArrowUpRight size={14} /></Btn>
            </div>
          </div>
        </div>

        {/* AI insight */}
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-3xl overflow-hidden h-full" style={{ border: '1px solid var(--coral-soft)' }}>
            <div className="p-[22px] h-full flex flex-col" style={{ background: 'linear-gradient(135deg,#FFF1E6 0%,#FFFAF4 100%)' }}>
              <div className="w-[64px] h-[64px] rounded-full p-[4px] flex items-center justify-center" style={{ background: 'conic-gradient(from 0deg, var(--coral), #FFD4B8, var(--brand-400), var(--brand-500), var(--coral))' }}>
                <div className="w-full h-full rounded-full flex items-center justify-center text-white" style={{ background: 'var(--ink-900)' }}><Sparkles size={24} /></div>
              </div>
              <div className="flex items-center gap-2 mt-4"><Eyebrow style={{ color: '#9E3A15' }}>IA detectó</Eyebrow><Badge kind="coral">+$900 MXN</Badge></div>
              <div className="text-[30px] font-extrabold tracking-tight mt-2" style={DISPLAY}>Podrías ahorrar</div>
              <div className="text-[13px] mt-2 leading-relaxed" style={{ color: 'var(--ink-500)' }}>Cambiando la forma de pago de 3 gastos de efectivo a débito, los vuelves deducibles en tu próxima declaración.</div>
              <div className="flex gap-2 mt-auto pt-4">
                <Btn size="sm" kind="coral" block onClick={() => go('analisis')}>Aplicar con IA</Btn>
                <Btn size="sm" kind="ghost" onClick={() => go('analisis')}>Detalle</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credibilidad fiscal */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>Tu credibilidad fiscal</div>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-400)' }}>Los documentos oficiales que te respaldan</div>
          </div>
          {hasCsf
            ? <Pill kind="brand"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)', boxShadow: '0 0 0 3px var(--brand-100)' }} />3 de 3 en orden</Pill>
            : <Pill kind="sky"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#5EA8FF' }} />Falta tu CSF</Pill>}
        </div>

        <div className="grid grid-cols-12 gap-[18px]">
          {/* Constancia */}
          <div className="col-span-12 lg:col-span-6">
            {hasCsf ? (
              <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid var(--brand-200)' }}>
                <div className="p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#EEFEF6 0%,#F9FAFB 65%)' }}>
                  <div className="flex items-center gap-3 relative z-[2]">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(140deg,#10DA92,#00A068)', boxShadow: '0 10px 24px -8px rgba(14,209,138,0.55)' }}>
                      <BadgeCheck size={28} color="#fff" />
                    </div>
                    <div>
                      <Eyebrow style={{ color: 'var(--brand-700)' }}>Constancia de situación fiscal</Eyebrow>
                      <div className="text-[20px] font-bold tracking-tight mt-0.5" style={DISPLAY}>Vigente · al día</div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between mt-5 pt-4 relative z-[2] gap-3 flex-wrap" style={{ borderTop: '1px solid rgba(14,209,138,0.25)' }}>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>RFC</div>
                      <div className="text-[14px] font-extrabold mt-0.5" style={MONO}>{rfc}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Actualizada</div>
                      <div className="text-[14px] font-extrabold mt-0.5">Hoy</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Régimen</div>
                      <div className="text-[14px] font-extrabold mt-0.5">—</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 relative z-[2]">
                    <Btn size="sm" kind="ghost" block><Eye size={14} /> Ver documento</Btn>
                    <Btn size="sm" kind="brand" block><Share2 size={14} /> Compartir</Btn>
                  </div>
                </div>
              </div>
            ) : (
              <CsfMissingCard go={go} />
            )}
          </div>

          <div className="col-span-6 lg:col-span-3">
            <button onClick={() => go('estatus-sat')} className="w-full h-full rounded-3xl p-5 text-left flex flex-col gap-3.5" style={hasCsf ? { background: 'linear-gradient(160deg,#FFF,#F6FDF9)', border: '1px solid var(--brand-200)' } : { background: 'var(--card)', border: '1px solid var(--border)', opacity: 0.85 }}>
              <div className="flex items-center justify-between">
                <TIcon kind={hasCsf ? 'brand' : 'default'}><FileCheck2 size={22} /></TIcon>
                {hasCsf
                  ? <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-500)', boxShadow: '0 0 0 3px var(--brand-100)' }} />
                  : <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Bloqueado</span>}
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Opinión de cumplimiento</div>
                <div className="text-[24px] font-extrabold tracking-tight mt-1" style={DISPLAY}>{hasCsf ? 'Positiva' : '—'}</div>
                <div className="text-[12px] font-bold mt-0.5" style={{ color: hasCsf ? 'var(--brand-700)' : 'var(--ink-400)' }}>{hasCsf ? 'Vigente · 22 may 2026' : 'Conecta el SAT primero'}</div>
              </div>
            </button>
          </div>

          <div className="col-span-6 lg:col-span-3">
            <button onClick={() => go('estatus-sat')} className="w-full h-full rounded-3xl p-5 text-left flex flex-col gap-3.5" style={hasCsf ? { background: 'linear-gradient(160deg,#FFF,#F6FDF9)', border: '1px solid var(--brand-200)' } : { background: 'var(--card)', border: '1px solid var(--border)', opacity: 0.85 }}>
              <div className="flex items-center justify-between">
                <TIcon kind={hasCsf ? 'brand' : 'default'}><ShieldCheck size={22} /></TIcon>
                {hasCsf
                  ? <span className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-500)', boxShadow: '0 0 0 3px var(--brand-100)' }} />
                  : <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Bloqueado</span>}
              </div>
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>Listas negras SAT</div>
                <div className="text-[24px] font-extrabold tracking-tight mt-1" style={DISPLAY}>{hasCsf ? 'Limpia' : '—'}</div>
                <div className="text-[12px] font-bold mt-0.5" style={{ color: hasCsf ? 'var(--brand-700)' : 'var(--ink-400)' }}>{hasCsf ? '0 alertas · 6 listas' : 'Conecta el SAT primero'}</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="mt-7">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>Este mes en números</div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-400)' }}>Abril 2026</div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
          <Card><div className="p-5">
            <div className="flex items-center justify-between"><Eyebrow>Ingresos</Eyebrow><Badge kind="brand">+8%</Badge></div>
            <div className="text-[30px] font-extrabold tracking-tight mt-2.5" style={DISPLAY}>$28K</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>vs $25,920 marzo</div>
            <svg className="block mt-2.5 w-full" height="38" viewBox="0 0 180 38"><path d="M0 26 L20 22 L40 28 L60 20 L80 24 L100 12 L120 16 L140 10 L160 14 L180 6" fill="none" stroke="#0ED18A" strokeWidth="2" strokeLinecap="round" /></svg>
          </div></Card>
          <Card><div className="p-5">
            <div className="flex items-center justify-between"><Eyebrow>Impuestos est.</Eyebrow><Badge kind="outline">Estimado</Badge></div>
            <div className="text-[30px] font-extrabold tracking-tight mt-2.5" style={DISPLAY}>$3,920</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Antes de optimizar</div>
            <svg className="block mt-2.5 w-full" height="38" viewBox="0 0 180 38"><path d="M0 16 L20 18 L40 14 L60 22 L80 18 L100 24 L120 20 L140 26 L160 22 L180 28" fill="none" stroke="#F5B037" strokeWidth="2" strokeLinecap="round" /></svg>
          </div></Card>
          <div className="rounded-3xl text-white p-5" style={{ background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)', boxShadow: 'var(--sh-brand)' }}>
            <div className="flex items-center justify-between"><Eyebrow style={{ color: 'rgba(255,255,255,0.82)' }}>Ahorro detectado</Eyebrow><TrendingUp size={18} color="#fff" /></div>
            <div className="text-[30px] font-extrabold tracking-tight mt-2.5" style={DISPLAY}>$900</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.82)' }}>Con ajustes simples</div>
            <Btn size="sm" onClick={() => go('analisis')} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', boxShadow: 'none', marginTop: 10, alignSelf: 'flex-start' }}>Ver cómo <ArrowRight size={14} /></Btn>
          </div>
          <Card><div className="p-5">
            <Eyebrow>Facturas emitidas</Eyebrow>
            <div className="text-[30px] font-extrabold tracking-tight mt-2.5" style={DISPLAY}>5</div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>$128,000 MXN total</div>
            <svg className="block mt-2.5 w-full" height="38" viewBox="0 0 180 38"><path d="M0 30 L30 26 L60 28 L90 18 L120 22 L150 12 L180 14" fill="none" stroke="#5EA8FF" strokeWidth="2" strokeLinecap="round" /></svg>
          </div></Card>
        </div>
      </div>

      {/* Calendar + accesos */}
      <div className="grid grid-cols-12 gap-[18px] mt-7">
        <div className="col-span-12 lg:col-span-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>Tu calendario fiscal</div>
            <button onClick={() => go('declaraciones')} className="text-[13px] font-bold flex items-center gap-1" style={{ color: 'var(--ink-500)' }}>Ver todo <ChevronRight size={12} /></button>
          </div>
          <Card><div className="p-5 flex flex-col gap-3">
            <DateRow day="17" mo="Abr" title="Declaración mensual · marzo" sub="Vence en 1 día · Régimen Plataformas" right={<Badge kind="coral">Urgente</Badge>} />
            <Divider />
            <DateRow day="30" mo="Abr" title="Declaración anual 2025" sub="Vence en 14 días · Contador asignado" right={<Badge kind="outline">En proceso</Badge>} />
            <Divider />
            <DateRow day="17" mo="May" title="Declaración mensual · abril" sub="En 25 días" muted right={<Badge>Programada</Badge>} />
          </div></Card>
        </div>
        <div className="col-span-12 lg:col-span-7">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>Para tu día a día</div>
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-400)' }}>Accesos rápidos</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
            <Tile onClick={() => go('pagar')}><TIcon kind="coral"><Zap size={20} /></TIcon><div><div className="font-bold text-[15px] leading-tight">Paga luz, agua, internet</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Factura automática deducible</div></div></Tile>
            <Tile onClick={() => go('seguros')}><TIcon kind="sky"><Shield size={20} /></TIcon><div><div className="font-bold text-[15px] leading-tight">Seguros inteligentes</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Gastos médicos deducibles</div></div></Tile>
            <Tile onClick={() => go('creditos')}><TIcon kind="violet"><CreditCard size={20} /></TIcon><div><div className="font-bold text-[15px] leading-tight">Crédito preaprobado</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Hasta $150K con tu score</div></div></Tile>
            <Tile onClick={() => go('aprende')}><TIcon kind="amber"><Lightbulb size={20} /></TIcon><div><div className="font-bold text-[15px] leading-tight">Tips para ti</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>3 nuevos esta semana</div></div></Tile>
          </div>
        </div>
      </div>

      {/* Testimonio */}
      <div className="mt-7">
        <div className="rounded-3xl p-7 text-center" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
          <div className="text-[20px] font-bold tracking-tight leading-snug max-w-[620px] mx-auto" style={{ ...DISPLAY, color: 'var(--ink-800)' }}>"Antes pagaba a mi contador $2,500 al mes. Con Contabilízate pago menos y duermo tranquila."</div>
          <div className="text-[13px] font-semibold mt-3" style={{ color: 'var(--ink-400)' }}>Valentina · Diseñadora freelance · CDMX</div>
        </div>
      </div>
    </>
  )
}
function CsfMissingCard({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="rounded-3xl overflow-hidden h-full" style={{ border: '1px dashed rgba(94,168,255,0.55)' }}>
      <div className="p-6 relative overflow-hidden h-full" style={{ background: 'linear-gradient(135deg,#DDEBFF 0%,#F4F7FB 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(140deg,#5EA8FF,#1C4C96)', boxShadow: '0 10px 24px -8px rgba(94,168,255,0.55)' }}>
            <AlertCircle size={28} color="#fff" />
          </div>
          <div>
            <Eyebrow style={{ color: '#1C4C96' }}>Constancia de situación fiscal</Eyebrow>
            <div className="text-[20px] font-bold tracking-tight mt-0.5" style={DISPLAY}>Aún no la tenemos</div>
          </div>
        </div>
        <div className="text-[13px] mt-4 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          Conecta tu RFC con CIEC o e.firma para que descarguemos automáticamente tu CSF y activemos el resto del análisis fiscal.
        </div>
        <div className="flex gap-2 mt-4">
          <Btn size="sm" kind="brand" block onClick={() => go('estatus-sat')}><Zap size={14} /> Conectar al SAT</Btn>
          <Btn size="sm" kind="ghost" onClick={() => go('boveda')}>Subir PDF</Btn>
        </div>
      </div>
    </div>
  )
}

function DateRow({ day, mo, title, sub, right, muted }: { day: string; mo: string; title: string; sub: string; right?: ReactNode; muted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-14 text-center flex-shrink-0">
        <div className="text-[30px] font-extrabold leading-none" style={{ ...DISPLAY, color: muted ? 'var(--ink-400)' : 'var(--ink-900)' }}>{day}</div>
        <div className="text-[10px] tracking-widest uppercase font-extrabold" style={{ color: 'var(--ink-400)' }}>{mo}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[14px] ${muted ? 'opacity-70' : ''}`}>{title}</div>
        <div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{sub}</div>
      </div>
      {right}
    </div>
  )
}

// ============ FISCAL ============
function FiscalScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="grid grid-cols-12 gap-[18px]">
      <div className="col-span-12 lg:col-span-8">
        <div className="rounded-3xl p-6 mb-[18px]" style={{ background: 'linear-gradient(160deg,#F9FAFB 0%,#EEFEF6 100%)', border: '1px solid var(--brand-100)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Eyebrow style={{ color: 'var(--brand-700)' }}>Tu régimen fiscal</Eyebrow>
              <div className="text-[30px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Plataformas Tecnológicas</div>
              <div className="text-[13px] mt-1" style={{ ...MONO, color: 'var(--ink-400)' }}>CURP · CARM920101ABC · Alta feb 2022</div>
            </div>
            <Pill kind="brand"><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} />Al día</Pill>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-[18px]">
          <Tile onClick={() => go('diagnostico')}><TIcon kind="brand"><Stethoscope size={20} /></TIcon><div><div className="font-bold text-[15px]">Diagnóstico fiscal</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>9 facturas · 3 declaraciones</div></div></Tile>
          <Tile onClick={() => go('declaraciones')}><TIcon kind="coral"><FileText size={20} /></TIcon><div><div className="font-bold text-[15px]">Declaraciones</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>5 pendientes · 1 lista</div></div></Tile>
          <Tile onClick={() => go('facturar')}><TIcon kind="ink"><FilePlus size={20} /></TIcon><div><div className="font-bold text-[15px]">Facturación CFDI</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Emite y recibe</div></div></Tile>
          <Tile onClick={() => go('boveda')}><TIcon kind="sky"><FolderLock size={20} /></TIcon><div><div className="font-bold text-[15px]">Bóveda SAT</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Sincronizada hace 2 min</div></div></Tile>
          <Tile onClick={() => go('estatus-sat')}><TIcon kind="amber"><ShieldCheck size={20} /></TIcon><div><div className="font-bold text-[15px]">Estatus SAT</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>6 listas · limpia</div></div></Tile>
          <Tile onClick={() => go('analisis')}><TIcon kind="violet"><Microscope size={20} /></TIcon><div><div className="font-bold text-[15px]">Análisis IA</div><div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Ahorra $8,760 MXN</div></div></Tile>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-4">
        <Card><div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative inline-flex">
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}><circle cx="36" cy="36" r="30" fill="none" stroke="var(--ink-100)" strokeWidth="7" /><circle cx="36" cy="36" r="30" fill="none" stroke="#0ED18A" strokeWidth="7" strokeLinecap="round" strokeDasharray="188.5" strokeDashoffset="33.9" /></svg>
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-[17px]" style={DISPLAY}>82</div>
            </div>
            <div><Eyebrow>Score fiscal</Eyebrow><div className="text-[16px] font-bold">Muy bueno</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>+5 pts este mes</div></div>
          </div>
          <Divider />
          <div className="flex justify-between mt-3.5">
            <div><Eyebrow style={{ color: '#9E3A15' }}>Pendientes</Eyebrow><div className="text-[24px] font-extrabold mt-1" style={{ ...DISPLAY, color: '#9E3A15' }}>5</div><div className="text-[12px] font-semibold" style={{ color: '#9E3A15' }}>declaraciones</div></div>
            <div><Eyebrow style={{ color: 'var(--brand-700)' }}>Adeudo</Eyebrow><div className="text-[24px] font-extrabold mt-1" style={{ ...DISPLAY, color: 'var(--brand-700)' }}>$4.8K</div><div className="text-[12px] font-semibold" style={{ color: 'var(--brand-700)' }}>regularizable</div></div>
          </div>
        </div></Card>
        <div className="mt-[18px]">
          <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Atiende esto primero</Eyebrow>
          <div className="flex flex-col gap-2.5">
            <ListItem icon={<AlertTriangle size={20} />} iconKind="danger" title="Pagos en efectivo" sub="$10,700 · 2 facturas" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('analisis')} />
            <ListItem icon={<FileWarning size={20} />} iconKind="amber" title="CFDI incorrecto" sub="$3,500 · 1 factura" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('analisis')} />
            <ListItem icon={<Link2 size={20} />} iconKind="sky" title="Verifica proveedores" sub="24 emisores · 69-B" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('estatus-sat')} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ ESTATUS SAT ============
function EstatusSatScreen({ rfc }: { rfc: string | null }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)

  if (!hasCsf) return <SatConnectScreen />

  return (
    <div className="grid grid-cols-12 gap-[18px]">
      <div className="col-span-12 lg:col-span-7">
        <div className="rounded-[36px] p-7 text-white relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#10DA92,#00B073)', boxShadow: '0 10px 30px -8px rgba(14,209,138,0.6)' }}><ShieldCheck color="#fff" size={32} /></div>
            <div><Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Veredicto</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Estás limpia</div></div>
          </div>
          <div className="text-[14px] mt-4 leading-relaxed max-w-[480px]" style={{ color: 'rgba(255,255,255,0.82)' }}>No apareces en ninguna lista negra del SAT. Tu cumplimiento de obligaciones es <strong>positivo</strong> y tu RFC está activo.</div>
          <Divider dark />
          <div className="flex items-center justify-between mt-5">
            <div><Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Última consulta</Eyebrow><div className="text-[15px] font-bold mt-0.5">Hoy, 9:32 am · revalidación automática cada hora</div></div>
            <Btn size="sm" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>Revalidar ahora</Btn>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2.5"><Eyebrow>Proveedores escaneados</Eyebrow><Badge kind="brand">24 OK · 0 alerta</Badge></div>
          <Card><div className="p-5">
            <div className="text-[14px]" style={{ color: 'var(--ink-500)' }}><span className="text-[18px] font-bold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Buenas noticias.</span> Ninguno de tus emisores está en listas negras. Te avisamos si alguno aparece.</div>
            <div className="flex flex-wrap gap-2 mt-3.5">
              {['CFE', 'Telmex', 'Office Depot', 'Gasolinera Express', 'Farmacia del Ahorro', '+19 más'].map(n => <Pill key={n} kind="brand"><Check size={12} /> {n}</Pill>)}
            </div>
          </div></Card>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Revisamos 6 listas oficiales</Eyebrow>
        <Card><div>
          {[
            { ok: true, t: 'Opinión de cumplimiento', s: 'Vigente hasta 22-may-2026', b: <Badge kind="brand">Positiva</Badge> },
            { ok: true, t: 'Art. 69-B · EFOS', s: 'Operaciones simuladas', b: <Badge kind="brand">Limpia</Badge> },
            { ok: true, t: 'Art. 69-B Bis', s: 'Transmisión indebida de pérdidas', b: <Badge kind="brand">Limpia</Badge> },
            { ok: true, t: 'No localizados', s: 'Sin domicilio fiscal', b: <Badge kind="brand">No aparece</Badge> },
            { ok: false, t: 'Créditos fiscales firmes', s: 'Adeudos cancelados >12 meses', b: <Badge kind="amber">Monitor.</Badge> },
            { ok: true, t: 'RFC cancelado', s: 'Estatus del registro', b: <Badge kind="brand">Activo</Badge> },
          ].map((it, i) => (
            <div key={it.t}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: it.ok ? 'var(--brand-50)' : 'var(--amber-soft)', color: it.ok ? 'var(--brand-700)' : '#7B5312' }}>
                  {it.ok ? <Check size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div className="flex-1 min-w-0"><div className="font-bold text-[14px]">{it.t}</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{it.s}</div></div>
                {it.b}
              </div>
              {i < 5 && <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div></Card>
        <Btn kind="ghost" block style={{ marginTop: 18 }}><BellRing size={18} /> Avísame si cambia algo</Btn>
      </div>
    </div>
  )
}

function SatConnectScreen() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'ciec' | 'fiel'>('ciec')
  const [rfc, setRfc] = useState('')
  const [ciec, setCiec] = useState('')
  const [showCiec, setShowCiec] = useState(false)
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [fielPwd, setFielPwd] = useState('')
  const [showFielPwd, setShowFielPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rfc.trim().length < 12 || rfc.trim().length > 13) {
      setError('El RFC debe tener entre 12 y 13 caracteres')
      return
    }
    if (authMethod === 'ciec' && !ciec.trim()) {
      setError('Ingresa tu contraseña CIEC')
      return
    }
    if (authMethod === 'fiel' && (!cerFile || !keyFile || !fielPwd.trim())) {
      setError('Sube .cer, .key y la contraseña de tu e.Firma')
      return
    }
    setLoading(true)
    setError(null)
    try {
      let payload: Record<string, string>
      if (authMethod === 'fiel') {
        const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve((reader.result as string).split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        const [cerBase64, keyBase64] = await Promise.all([toBase64(cerFile!), toBase64(keyFile!)])
        payload = { method: 'fiel', cerBase64, keyBase64, keyPassword: fielPwd }
      } else {
        payload = { method: 'ciec', rfc: rfc.toUpperCase().trim(), ciec }
      }
      const res = await fetch('/api/sat/constancia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al conectar con el SAT')
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al conectar con el SAT')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-[18px]">
      <div className="col-span-12 lg:col-span-7">
        {/* Hero azul */}
        <div className="rounded-[36px] p-7 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#DDEBFF 0%,#F4F7FB 100%)', border: '1px dashed rgba(94,168,255,0.55)' }}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(140deg,#5EA8FF,#1C4C96)', boxShadow: '0 10px 30px -8px rgba(94,168,255,0.55)' }}>
              <AlertCircle color="#fff" size={32} />
            </div>
            <div>
              <Eyebrow style={{ color: '#1C4C96' }}>Estatus SAT</Eyebrow>
              <div className="text-[40px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Pendiente de conectar</div>
            </div>
          </div>
          <div className="text-[14px] mt-4 leading-relaxed max-w-[520px]" style={{ color: 'var(--ink-500)' }}>
            Para que podamos descargar tu Constancia de Situación Fiscal y monitorear listas negras automáticamente, conecta tu RFC con uno de estos métodos:
          </div>
        </div>

        {/* Form card */}
        <Card style={{ marginTop: 18 }}>
          <div className="p-6 lg:p-7">
            <div className="mb-5">
              <h2 className="text-[22px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--foreground)' }}>Acceso al SAT</h2>
              <p className="text-[14px] mt-1" style={{ color: 'var(--muted-foreground)' }}>Elige cómo quieres conectar tu cuenta del SAT</p>
            </div>

            {error && (
              <div className="rounded-xl p-3 mb-4 text-[13px] font-semibold" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Method selector */}
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: 'ciec' as const, title: 'Con CIEC', desc: 'Contraseña del portal del SAT', icon: <Lock size={22} /> },
                  { id: 'fiel' as const, title: 'Con e.Firma', desc: 'Certificado .cer y llave .key', icon: <FileDown size={22} /> },
                ]).map(m => {
                  const active = authMethod === m.id
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => { setAuthMethod(m.id); setError(null) }}
                      className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all"
                      style={{
                        background: active ? 'var(--ink-900)' : 'var(--muted)',
                        border: active ? '2px solid var(--ink-700)' : '2px solid transparent',
                        color: active ? '#fff' : 'var(--foreground)',
                        boxShadow: active ? '0 4px 20px rgba(21,17,63,0.20)' : 'none',
                      }}
                    >
                      <span style={{ color: active ? 'var(--brand-400)' : 'var(--muted-foreground)' }}>{m.icon}</span>
                      <div>
                        <p className="text-[14px] font-extrabold leading-tight">{m.title}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--muted-foreground)' }}>{m.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* RFC (always shown) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>RFC</label>
                <input
                  type="text"
                  value={rfc}
                  onChange={e => setRfc(e.target.value.toUpperCase())}
                  placeholder="XAXX010101000"
                  maxLength={13}
                  required
                  className="w-full px-4 py-3 rounded-xl text-[14px] font-semibold uppercase outline-none transition-all"
                  style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                />
              </div>

              {/* CIEC password (if method=ciec) */}
              {authMethod === 'ciec' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>Contraseña CIEC</label>
                  <div className="relative">
                    <input
                      type={showCiec ? 'text' : 'password'}
                      value={ciec}
                      onChange={e => setCiec(e.target.value)}
                      placeholder="Tu contraseña del SAT"
                      required
                      className="w-full px-4 py-3 pr-12 rounded-xl text-[14px] font-semibold outline-none"
                      style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                    />
                    <button type="button" onClick={() => setShowCiec(!showCiec)} aria-label={showCiec ? 'Ocultar' : 'Mostrar'} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                      <Eye size={18} />
                    </button>
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Tu CIEC se transmite cifrada y nunca se almacena en texto plano</p>
                </div>
              )}

              {/* FIEL files (if method=fiel) */}
              {authMethod === 'fiel' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>Certificado (.cer)</label>
                    <input type="file" accept=".cer" onChange={e => setCerFile(e.target.files?.[0] ?? null)} className="text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:cursor-pointer" style={{ color: cerFile ? 'var(--foreground)' : 'var(--muted-foreground)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>Clave privada (.key)</label>
                    <input type="file" accept=".key" onChange={e => setKeyFile(e.target.files?.[0] ?? null)} className="text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:cursor-pointer" style={{ color: keyFile ? 'var(--foreground)' : 'var(--muted-foreground)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-bold" style={{ color: 'var(--foreground)' }}>Contraseña de clave privada</label>
                    <div className="relative">
                      <input type={showFielPwd ? 'text' : 'password'} value={fielPwd} onChange={e => setFielPwd(e.target.value)} placeholder="Contraseña de tu e.Firma" required className="w-full px-4 py-3 pr-12 rounded-xl text-[14px] font-semibold outline-none" style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }} />
                      <button type="button" onClick={() => setShowFielPwd(!showFielPwd)} aria-label={showFielPwd ? 'Ocultar' : 'Mostrar'} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                        <Eye size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Security note */}
              <div className="rounded-xl p-3 flex items-start gap-2.5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
                <Lock size={16} style={{ color: 'var(--brand-700)', marginTop: 2, flexShrink: 0 }} />
                <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--brand-700)' }}>
                  Tus credenciales están protegidas con cifrado AES-256. Solo se usan para consultar el SAT en tu nombre.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold text-[14px] transition-all active:scale-[0.98] disabled:opacity-60 mt-2"
                style={{ background: 'var(--ink-900)', color: '#fff' }}
              >
                {loading ? 'Conectando…' : 'Continuar'}
              </button>
            </form>
          </div>
        </Card>

        {/* Estado de descarga */}
        <div className="mt-5">
          <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Progreso de tu CSF</Eyebrow>
          <Card><div className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14px]">{loading ? 'Conectando con el SAT…' : 'Sin descargar'}</div>
                <div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{loading ? 'Estamos descargando tu Constancia' : 'Conecta tu SAT para iniciar la descarga automática'}</div>
              </div>
              <Badge kind="sky">{loading ? 'En proceso' : 'Pendiente'}</Badge>
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: loading ? '60%' : '0%', background: 'linear-gradient(90deg,var(--brand-500),var(--brand-600))' }} />
            </div>
          </div></Card>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-5">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Por qué lo necesitamos</Eyebrow>
        <Card><div>
          {[
            { t: 'Descarga automática de CFDI', s: 'Recibidos y emitidos a tu bóveda', i: <FileDown size={20} /> },
            { t: 'Detección de tu régimen', s: 'Para presentarte planes y deducciones', i: <Stethoscope size={20} /> },
            { t: 'Monitoreo de listas negras', s: '6 listas oficiales SAT 24/7', i: <ShieldCheck size={20} /> },
            { t: 'Score fiscal en tiempo real', s: 'Tu estado de cumplimiento al instante', i: <BarChart3 size={20} /> },
          ].map((it, i, arr) => (
            <div key={it.t}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>{it.i}</div>
                <div className="flex-1 min-w-0"><div className="font-bold text-[14px]">{it.t}</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{it.s}</div></div>
              </div>
              {i < arr.length - 1 && <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />}
            </div>
          ))}
        </div></Card>
        <div className="rounded-2xl mt-3.5 p-4" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
          <div className="text-[12px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
            <strong>¿No tienes CIEC ni e.Firma?</strong> Te ayudamos a tramitarla en el SAT desde la sección de <em>Trámites</em>.
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ DIAGNÓSTICO ============
function DiagnosticoScreen() {
  return (
    <div className="grid grid-cols-12 gap-[18px]">
      <div className="col-span-12">
        <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(160deg,#FFFAF4 0%,#FFF1E6 100%)', borderColor: 'var(--coral-soft)', border: '1px solid var(--coral-soft)' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <Pill kind="coral"><AlertCircle size={14} /> Requiere atención</Pill>
              <div className="text-[30px] font-extrabold tracking-tight mt-3" style={DISPLAY}>Tu situación fiscal es <span style={{ color: '#9E3A15' }}>regular</span></div>
              <div className="text-[14px] mt-2 max-w-[540px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>Analizamos 9 facturas y 3 declaraciones. Oportunidad de ahorro: <strong>$8,760 MXN</strong>.</div>
            </div>
            <Btn kind="brand"><Zap size={18} /> Regularizar todo</Btn>
          </div>
        </div>
      </div>
      <div className="col-span-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-[18px]">
          <Card><div className="p-5"><Eyebrow>Ingresos 2026</Eyebrow><div className="text-[30px] font-extrabold tracking-tight mt-2" style={DISPLAY}>$336K</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Reportados al SAT</div></div></Card>
          <Card><div className="p-5"><Eyebrow>Gastos año</Eyebrow><div className="text-[30px] font-extrabold tracking-tight mt-2" style={DISPLAY}>$112K</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>33% de ingresos</div></div></Card>
          <Card><div className="p-5"><Eyebrow>Facturas emitidas</Eyebrow><div className="text-[30px] font-extrabold tracking-tight mt-2" style={DISPLAY}>24</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>2 pendientes de pago</div></div></Card>
          <Card><div className="p-5"><Eyebrow>Declaraciones</Eyebrow><div className="text-[30px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: 'var(--coral)' }}>5</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>pendientes</div></div></Card>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-7">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Adeudos fiscales · $4,850 MXN total</Eyebrow>
        <Card><div className="p-5 flex flex-col gap-2">
          {['Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026', 'Marzo 2026'].map((m, i) => (
            <div key={m}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}><Calendar size={20} /></div>
                <div className="flex-1 min-w-0"><div className="text-[13px] font-bold">{m}</div><div className="text-[11px]" style={{ ...MONO, color: 'var(--ink-400)' }}>ISR · IVA</div></div>
                <div className="text-[14px] font-extrabold" style={MONO}>$970</div>
                <Badge kind="amber">Pendiente</Badge>
              </div>
              {i < 4 && <Divider />}
            </div>
          ))}
        </div></Card>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Oportunidades de ahorro</Eyebrow>
        <div className="flex flex-col gap-2.5">
          {[
            { t: 'Deducciones personales', a: '+$3,100', d: 'Gastos médicos, colegiaturas y donativos.' },
            { t: 'Específicas de actividad', a: '+$4,100', d: 'Combustible, mantenimiento, teléfono.' },
            { t: 'Revisión de retenciones', a: '+$1,560', d: 'Verifica retención de plataformas.' },
          ].map(o => (
            <Card key={o.t}><div className="p-5">
              <div className="flex items-center justify-between"><div className="font-bold text-[14px]">{o.t}</div><Badge kind="brand">{o.a}</Badge></div>
              <div className="text-[12px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-400)' }}>{o.d}</div>
            </div></Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============ DECLARACIONES ============
function DeclaracionesScreen() {
  return (
    <>
      <Tabs items={['Pendientes', 'En proceso', 'Presentadas']} active={0} />
      <div className="grid grid-cols-12 gap-[18px] mt-[18px]">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)', boxShadow: 'var(--sh-brand)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <Eyebrow style={{ color: 'rgba(255,255,255,0.82)' }}>Próxima declaración</Eyebrow>
                <div className="text-[40px] font-extrabold tracking-tight mt-1.5" style={DISPLAY}>Abril 2026</div>
                <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>Mensual · ISR + IVA</div>
              </div>
              <div className="text-right">
                <Eyebrow style={{ color: 'rgba(255,255,255,0.82)' }}>Vence en</Eyebrow>
                <div className="text-[40px] font-extrabold tracking-tight" style={DISPLAY}>1 día</div>
              </div>
            </div>
            <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.22)' }}><div className="h-full rounded-full" style={{ width: '78%', background: '#fff' }} /></div>
            <div className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.82)' }}>Tu contador tiene 78% lista · 9 de 12 facturas revisadas</div>
            <Btn block style={{ background: '#fff', color: 'var(--ink-900)', marginTop: 16, boxShadow: 'none' }}>Ver detalle y pagar</Btn>
          </div>
          <div className="mt-5">
            <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Atrasadas</Eyebrow>
            <div className="flex flex-col gap-2.5">
              {['Marzo 2026', 'Febrero 2026', 'Enero 2026', 'Diciembre 2025'].map(m => (
                <ListItem key={m} icon={<FileText size={20} />} iconKind="amber" title={m} sub={<span style={MONO}>ISR $420 · IVA $550</span>} right={<><span className="text-[14px] font-extrabold mr-3" style={MONO}>$970</span><ChevronRight size={16} style={{ color: 'var(--ink-300)' }} /></>} />
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <Card><div className="p-5">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--violet-soft)', color: '#403A8D' }}><CalendarCheck size={20} /></div><div className="flex-1"><div className="font-bold text-[14px]">Declaración anual 2025</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Disponible hoy · vence 30 abr</div></div></div>
            <Btn kind="primary" block style={{ marginTop: 14 }}>Empezar</Btn>
          </div></Card>
          <div className="rounded-3xl mt-3.5 p-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}><span className="text-[16px] font-bold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>¿Mes atrasado?</span> Lo presentamos con tu plan Platinum sin costo extra. La complementaria tiene cargo.</div>
          </div>
        </div>
      </div>
    </>
  )
}
function Tabs({ items, active }: { items: string[]; active: number }) {
  return (
    <div className="inline-flex gap-1.5 p-1.5 rounded-full" style={{ background: 'rgba(21,17,63,0.05)' }}>
      {items.map((t, i) => (
        <span key={t} className="px-4 py-2 rounded-full text-[13px] font-bold transition" style={i === active ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' } : { color: 'var(--ink-500)' }}>{t}</span>
      ))}
    </div>
  )
}

// ============ FACTURAR ============
function FacturarScreen() {
  return (
    <>
      <div className="flex items-center justify-between mb-[18px] flex-wrap gap-3">
        <Tabs items={['Emitidas', 'Recibidas']} active={0} />
        <Btn kind="primary"><Plus size={16} /> Nueva factura</Btn>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mb-[18px]">
        <Card><div className="p-5"><Eyebrow>Total del mes</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={DISPLAY}>$128K</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>5 facturas</div></div></Card>
        <div className="rounded-3xl p-5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}><Eyebrow style={{ color: 'var(--brand-700)' }}>Cobrado</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: 'var(--brand-700)' }}>$68K</div><div className="text-[12px]" style={{ color: 'var(--brand-700)' }}>3 facturas</div></div>
        <div className="rounded-3xl p-5" style={{ background: 'var(--amber-soft)', border: '1px solid rgba(245,176,55,0.35)' }}><Eyebrow style={{ color: '#7B5312' }}>Pendiente</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: '#7B5312' }}>$60K</div><div className="text-[12px]" style={{ color: '#7B5312' }}>2 facturas</div></div>
      </div>
      <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Abril 2026</Eyebrow>
      <div className="flex flex-col gap-2.5">
        {[
          { kind: 'brand' as const, icon: <FileCheck size={20} />, t: 'Empresa ABC S.A.', s: 'FAC-001 · 15 abr · Servicios profesionales', a: '$35,000', b: <Badge kind="brand">Pagada</Badge> },
          { kind: 'sky' as const, icon: <FileClock size={20} />, t: 'Juan Pérez López', s: 'FAC-002 · 12 abr', a: '$15,000', b: <Badge kind="outline">Enviada</Badge> },
          { kind: 'brand' as const, icon: <FileCheck size={20} />, t: 'Tech Solutions MX', s: 'FAC-003 · 10 abr · Honorarios', a: '$25,000', b: <Badge kind="brand">Pagada</Badge> },
          { kind: 'amber' as const, icon: <FileText size={20} />, t: 'Clínica del Norte', s: 'FAC-004 · 05 abr', a: '$45,000', b: <Badge kind="amber">Pendiente</Badge> },
          { kind: 'brand' as const, icon: <FileCheck size={20} />, t: 'María González', s: 'FAC-005 · 01 abr', a: '$8,000', b: <Badge kind="brand">Pagada</Badge> },
        ].map(r => (
          <ListItem key={r.t} icon={r.icon} iconKind={r.kind} title={r.t} sub={<span style={MONO}>{r.s}</span>} right={<><span className="text-[14px] font-extrabold mr-3" style={MONO}>{r.a}</span>{r.b}</>} />
        ))}
      </div>
    </>
  )
}

// ============ BÓVEDA ============
function BovedaScreen() {
  return (
    <>
      <div className="rounded-[36px] p-6 text-white mb-5" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(14,209,138,0.15)', color: 'var(--brand-300)' }}><FolderLock size={20} /></div>
          <div className="flex-1 min-w-0"><Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Sincronizado hace 2 min</Eyebrow><div className="text-[16px] font-bold">Descarga automática activa · e.firma conectada</div></div>
          <Pill style={{ background: 'rgba(14,209,138,0.15)', color: 'var(--brand-300)', border: '1px solid rgba(14,209,138,0.3)' }}><span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} /> En vivo</Pill>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px] mb-[18px]">
        <Card><div className="p-5"><Eyebrow>Emitidas</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={DISPLAY}>$128K</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>5 facturas</div></div></Card>
        <Card><div className="p-5"><Eyebrow>Recibidas</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={DISPLAY}>$10K</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>5 facturas</div></div></Card>
        <div className="rounded-3xl p-5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}><Eyebrow style={{ color: 'var(--brand-700)' }}>Deducible</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: 'var(--brand-700)' }}>$9.9K</div><div className="text-[12px]" style={{ color: 'var(--brand-700)' }}>95% ✓</div></div>
      </div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
        <Tabs items={['Recibidas', 'Emitidas', 'Canceladas']} active={0} />
        <Btn kind="ghost"><Download size={16} /> Descargar XML + PDF</Btn>
      </div>
      <div className="flex flex-col gap-2.5">
        {[
          { t: 'Farmacia del Ahorro', s: 'FDA010101XXX · 14 abr · Medicamentos', a: '$2,500' },
          { t: 'Gasolinera Express', s: 'GEX150101XXX · 12 abr · Combustible', a: '$1,800' },
          { t: 'Office Depot', s: 'ODE920101XXX · 10 abr · Material oficina', a: '$3,200' },
          { t: 'Telmex', s: 'TMX931208XXX · 08 abr · Servicio telefónico', a: '$899' },
          { t: 'CFE', s: 'CFE370814XXX · 05 abr · Energía eléctrica', a: '$1,500' },
        ].map(r => (
          <ListItem key={r.t} icon={<FileDown size={20} />} iconKind="brand" title={r.t} sub={<span style={MONO}>{r.s}</span>} right={<><span className="text-[14px] font-extrabold mr-3" style={MONO}>{r.a}</span><Badge kind="brand">Deducible</Badge></>} />
        ))}
        <ListItem icon={<FileWarning size={20} />} iconKind="amber" title="Restaurante La Parroquia" sub={<span style={MONO}>RLP010101XXX · 03 abr · Alimentos</span>} right={<><span className="text-[14px] font-extrabold mr-3" style={MONO}>$450</span><Badge kind="amber">Revisar</Badge></>} />
      </div>
    </>
  )
}

// ============ ANÁLISIS IA ============
function AnalisisScreen() {
  return (
    <>
      <div className="grid grid-cols-12 gap-[18px]">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-3xl overflow-hidden h-full">
            <div className="p-7 h-full" style={{ background: 'linear-gradient(135deg,#FFF1E6 0%,#FCEEE5 50%,#EEFEF6 100%)' }}>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="w-16 h-16 rounded-full p-1 flex items-center justify-center" style={{ background: 'conic-gradient(from 0deg, var(--coral), #FFD4B8, var(--brand-400), var(--brand-500), var(--coral))' }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-white" style={{ background: 'var(--ink-900)' }}><Sparkles size={24} /></div>
                </div>
                <div className="flex-1"><Eyebrow style={{ color: '#9E3A15' }}>Tu diagnóstico IA</Eyebrow><div className="text-[40px] font-extrabold tracking-tight mt-1 leading-tight" style={DISPLAY}>Podrías ahorrar<br /><span style={{ color: 'var(--brand-700)' }}>$8,760 MXN</span></div></div>
              </div>
              <div className="text-[14px] mt-4 leading-relaxed max-w-[540px]" style={{ color: 'var(--ink-500)' }}>Revisé 9 facturas y 3 declaraciones. Detecté <strong>4 puntos críticos</strong> y <strong>3 oportunidades de ahorro</strong>. Ordenados por impacto.</div>
              <Btn kind="coral" style={{ marginTop: 18 }}><Sparkles size={18} /> Hablar con tu IA fiscal</Btn>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <div className="grid grid-cols-2 gap-[18px]">
            <Card><div className="p-5 text-center"><div className="text-[30px] font-extrabold tracking-tight" style={DISPLAY}>$99K</div><Eyebrow>Ingresos</Eyebrow></div></Card>
            <Card><div className="p-5 text-center"><div className="text-[30px] font-extrabold tracking-tight" style={DISPLAY}>$26K</div><Eyebrow>Deducible</Eyebrow></div></Card>
            <div className="rounded-3xl p-5 text-center" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}><div className="text-[30px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--brand-700)' }}>$8.7K</div><Eyebrow style={{ color: 'var(--brand-700)' }}>Ahorro</Eyebrow></div>
            <Card><div className="p-5 text-center"><div className="text-[30px] font-extrabold tracking-tight" style={DISPLAY}>2/3</div><Eyebrow>Declaraciones</Eyebrow></div></Card>
          </div>
        </div>
      </div>

      <div className="mt-7">
        <div className="flex items-center justify-between mb-3"><Eyebrow style={{ color: '#B01F1F' }}>Crítico · 2 puntos</Eyebrow></div>
        <div className="rounded-3xl p-6" style={{ background: '#FFF7F7', border: '1px solid var(--danger-soft)' }}>
          <div className="flex items-center gap-2 flex-wrap"><Badge kind="danger">Pérdida $10,700</Badge><Badge kind="outline">Deducciones</Badge></div>
          <div className="font-bold text-[16px] mt-3">Pagos en efectivo no deducibles</div>
          <div className="text-[14px] mt-1.5 leading-relaxed max-w-[760px]" style={{ color: 'var(--ink-500)' }}>Tienes facturas por $10,700 pagadas en efectivo que exceden el límite de $2,000 MXN. Según Art. 27 fracc. III LISR, no son deducibles.</div>
          <div className="rounded-2xl p-3.5 mt-3.5" style={{ background: '#FFF9F0', border: '1px dashed var(--border-strong)' }}>
            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>Recomendación</div>
            <div className="text-[14px] mt-1 leading-relaxed">Para compras mayores a $2,000 usa tarjeta, transferencia o cheque. Conserva el comprobante.</div>
          </div>
          <div className="flex gap-2 mt-3.5"><Pill><span style={MONO}>F-2026-001</span></Pill><Pill><span style={MONO}>F-2026-006</span></Pill></div>
        </div>
      </div>

      <div className="mt-7">
        <div className="mb-3"><Eyebrow style={{ color: '#7B5312' }}>Atención · 2 puntos</Eyebrow></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
          <div className="rounded-3xl p-5" style={{ background: '#FFFBF1', border: '1px solid rgba(245,176,55,0.35)' }}><div className="font-bold text-[14px]">Uso de CFDI incorrecto</div><div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>$3,500 MXN en facturas con "Sin efectos fiscales" (S01).</div><div className="text-[13px] mt-2"><strong>Solicita:</strong> uso CFDI G03 (Gastos en general).</div></div>
          <div className="rounded-3xl p-5" style={{ background: '#FFFBF1', border: '1px solid rgba(245,176,55,0.35)' }}><div className="font-bold text-[14px]">Facturas sin complemento de pago</div><div className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>$15,000 MXN con forma "Por definir" (99).</div><div className="text-[13px] mt-2"><strong>Solicita:</strong> CFDI tipo P al realizar el pago.</div></div>
        </div>
      </div>

      <div className="mt-7">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Oportunidades</Eyebrow>
        <div className="rounded-3xl p-6" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><div className="font-bold text-[16px]" style={{ color: 'var(--brand-700)' }}>Deduce 100% de tu combustible</div><div className="text-[14px] mt-1.5 leading-relaxed max-w-[680px]" style={{ color: '#064E3B' }}>En plataformas tecnológicas puedes deducir el 100% si el vehículo se usa exclusivamente para la actividad.</div></div>
            <Badge kind="brand">+$4,100 MXN</Badge>
          </div>
        </div>
      </div>
    </>
  )
}

// ============ HUB+ SERVICIOS ============
function PagarScreen({ go }: { go: (s: Screen) => void }) {
  const services = [
    { c: 'CFE', n: 'Luz', m: 'Ref. 20491…', g: 'linear-gradient(135deg,#FFB800,#FF7A00)' },
    { c: 'Tx', n: 'Telmex', m: '$899/mes', g: 'linear-gradient(135deg,#0057B7,#003A7A)' },
    { c: 'Ag', n: 'Agua', m: 'SACMEX', g: 'linear-gradient(135deg,#00A3E0,#007BAA)' },
    { c: 'Iz', n: 'Izzi', m: 'Internet', g: 'linear-gradient(135deg,#FF4081,#C2185B)' },
    { c: 'Gs', n: 'Gas', m: 'Engie', g: 'linear-gradient(135deg,#6B35FF,#4316B5)' },
    { c: 'Pr', n: 'Predial', m: '2026', g: 'linear-gradient(135deg,#28C76F,#0B7A3E)' },
    { c: 'Tn', n: 'Tenencia', m: 'Placas', g: 'linear-gradient(135deg,#F5B037,#C78914)' },
    { c: 'SAT', n: 'Multas SAT', m: 'Líneas captura', g: 'linear-gradient(135deg,#15113F,#1E1952)' },
  ]
  return (
    <>
      <div className="mb-[18px]"><Tabs items={['Servicios', 'Seguros', 'Créditos']} active={0} /></div>
      <div className="grid grid-cols-12 gap-[18px]">
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-[36px] p-6 text-white" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div><Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Este mes gastaste</Eyebrow><div className="text-[56px] font-extrabold tracking-tight leading-none mt-1.5" style={DISPLAY}>$6,849</div><div className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.62)' }}>4 servicios · <span style={{ color: 'var(--brand-300)' }}>100% deducible</span></div></div>
              <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}><Zap size={40} color="var(--brand-300)" /></div>
            </div>
          </div>

          <div className="mt-5">
            <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Paga tus servicios</Eyebrow>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {services.map(s => (
                <button key={s.n} className="p-3.5 rounded-2xl flex flex-col gap-2.5 text-left transition hover:translate-y-[-2px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}>
                  <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-white font-extrabold text-[14px]" style={{ ...DISPLAY, background: s.g }}>{s.c}</div>
                  <div><div className="text-[13px] font-bold">{s.n}</div><div className="text-[11px]" style={{ color: 'var(--ink-400)' }}>{s.m}</div></div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Recargas y más</Eyebrow>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[18px]">
              <Tile><TIcon kind="ink"><Smartphone size={20} /></TIcon><div className="font-bold text-[15px]">Recarga celular</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Todas las compañías</div></Tile>
              <Tile><TIcon kind="violet"><Tv size={20} /></TIcon><div className="font-bold text-[15px]">Streaming</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Netflix, Spotify, HBO</div></Tile>
              <Tile><TIcon kind="sky"><Gift size={20} /></TIcon><div className="font-bold text-[15px]">Tarjetas regalo</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Amazon, App Store</div></Tile>
              <Tile><TIcon kind="coral"><Plus size={20} /></TIcon><div className="font-bold text-[15px]">Agregar servicio</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Busca o escanea</div></Tile>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Pagos recientes</Eyebrow>
          <div className="flex flex-col gap-2.5">
            <ListItem icon={<span className="font-extrabold text-[11px] text-white">CFE</span>} title="Luz · Bimestre 2" sub="13 abr · Deducible" right={<span className="text-[14px] font-extrabold" style={MONO}>$1,500</span>} />
            <ListItem icon={<span className="font-extrabold text-[11px] text-white">Tx</span>} title="Telmex · Abril" sub="8 abr · Deducible" right={<span className="text-[14px] font-extrabold" style={MONO}>$899</span>} />
            <ListItem icon={<Fuel size={20} />} iconKind="brand" title="Gasolinera Express" sub="12 abr · Deducible" right={<span className="text-[14px] font-extrabold" style={MONO}>$1,800</span>} />
          </div>
          <div className="rounded-3xl mt-[18px] p-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}><span className="text-[16px] font-bold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>100% automático.</span> Al pagar, tu CFDI llega a la bóveda en 2 min y se clasifica como deducible.</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============ SEGUROS ============
function SegurosScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <>
      <div className="mb-[18px]"><Tabs items={['Servicios', 'Seguros', 'Créditos']} active={1} /></div>
      <div className="rounded-3xl overflow-hidden mb-5">
        <div className="p-8" style={{ background: 'linear-gradient(135deg,#DDEBFF 0%,#F4F7FB 100%)' }}>
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <Pill kind="sky"><Shield size={14} /> Recomendado para ti</Pill>
              <div className="text-[40px] font-extrabold tracking-tight leading-tight mt-3.5" style={DISPLAY}>Tu seguro médico es <span style={{ color: 'var(--brand-700)' }}>deducible</span></div>
              <div className="text-[14px] mt-2.5 leading-relaxed max-w-[500px]" style={{ color: 'var(--ink-500)' }}>Deducible hasta el 15% de tus ingresos. Con tu perfil ahorrarías ~<strong>$8,300 MXN</strong> al año en ISR.</div>
              <Btn kind="primary" style={{ marginTop: 18 }}>Cotizar en 60 seg</Btn>
            </div>
            <div className="w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.6)' }}><HeartPulse size={56} color="#1C4C96" /></div>
          </div>
        </div>
      </div>

      <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Contrata desde la app</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        <InsuranceCard bg="linear-gradient(135deg,#FFE3D4,#FFC7AC)" icon={<HeartPulse size={40} color="#9E3A15" />} title="Gastos médicos mayores" sub="Desde $520/mes · AXA, GNP, MetLife" badge={<Badge kind="coral">100% ded.</Badge>} price="$520" />
        <InsuranceCard bg="linear-gradient(135deg,#D6FAE8,#ADF5D5)" icon={<Car size={40} color="var(--brand-900)" />} title="Seguro de auto" sub="Amplia · Qualitas · Chubb" badge={<Badge kind="brand">Ahorro 18%</Badge>} price="$780" />
        <InsuranceCard bg="linear-gradient(135deg,#DDEBFF,#BBD8FF)" icon={<Home size={40} color="#1C4C96" />} title="Seguro de hogar" sub="Robo, sismo, incendio" badge={<Badge kind="sky">Nuevo</Badge>} price="$210" />
        <InsuranceCard bg="linear-gradient(135deg,#E6E1FF,#CFC7FF)" icon={<ShieldCheck size={40} color="#403A8D" />} title="Seguro de vida" sub="Protege a tus beneficiarios" badge={<Badge kind="violet">100% ded.</Badge>} price="$180" />
        <InsuranceCard bg="linear-gradient(135deg,#FFF1D6,#FFE1A3)" icon={<Smartphone size={40} color="#7B5312" />} title="Celular y dispositivos" sub="Robo, daño, líquidos" badge={<Badge kind="amber">Popular</Badge>} price="$79" />
        <div className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
          <Eyebrow>Mis pólizas activas</Eyebrow>
          <div><div className="font-bold text-[14px]">GMM · MetLife</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Próximo cargo · 28 abr</div></div>
          <div className="text-[18px] font-extrabold" style={MONO}>$520</div>
          <div className="flex gap-2">
            <Btn size="sm" kind="ghost" block><FileDown size={14} /> Póliza</Btn>
            <Btn size="sm" kind="ghost" block><MessageCircle size={14} /> Reportar</Btn>
          </div>
        </div>
      </div>
    </>
  )
}
function InsuranceCard({ bg, icon, title, sub, badge, price }: { bg: string; icon: ReactNode; title: string; sub: string; badge: ReactNode; price: string }) {
  return (
    <div className="rounded-3xl overflow-hidden cursor-pointer" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-2)' }}>
      <div className="p-6 flex justify-center" style={{ background: bg }}>{icon}</div>
      <div className="p-[18px]">
        <div className="flex items-center justify-between gap-2 flex-wrap"><div className="font-bold text-[15px]">{title}</div>{badge}</div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--ink-400)' }}>{sub}</div>
        <div className="text-[15px] font-extrabold mt-2" style={MONO}>{price} <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-400)' }}>/mes</span></div>
      </div>
    </div>
  )
}

// ============ CRÉDITO ============
function CreditosScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <>
      <div className="mb-[18px]"><Tabs items={['Servicios', 'Seguros', 'Créditos']} active={2} /></div>
      <div className="grid grid-cols-12 gap-[18px]">
        <div className="col-span-12 lg:col-span-7">
          <div className="rounded-[36px] p-7 text-white relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <Pill style={{ background: 'rgba(255,136,98,0.2)', color: '#FFD4B8', border: '1px solid rgba(255,136,98,0.3)' }}><Sparkles size={14} /> Preaprobado</Pill>
              <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.62)' }}>Score fiscal · 82/100</span>
            </div>
            <div className="text-[72px] font-extrabold tracking-tight leading-none mt-5" style={DISPLAY}>$150,000</div>
            <div className="text-[14px] mt-1.5" style={{ color: 'rgba(255,255,255,0.82)' }}>Tasa desde <strong className="text-white">14.9% anual</strong> · sin comisión por apertura</div>
            <div className="relative h-12 rounded-full mt-7 p-1.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="absolute left-1.5 top-1.5 bottom-1.5 rounded-full" style={{ width: '60%', background: 'linear-gradient(90deg,var(--brand-400),var(--brand-600))' }} />
              <div className="absolute top-0.5 bottom-0.5 w-10 bg-white rounded-full flex items-center justify-center" style={{ left: 'calc(60% - 6px)', boxShadow: 'var(--sh-2)', color: 'var(--ink-700)' }}><MoveHorizontal size={16} /></div>
            </div>
            <div className="flex items-center justify-between mt-2.5"><span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.62)' }}>Solicitas</span><span className="text-[16px] font-extrabold" style={MONO}>$90,000</span><span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.62)' }}>a 24 meses</span></div>
            <Btn size="lg" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none', marginTop: 18 }}><Check size={18} /> Solicitar ahora</Btn>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5">
          <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Por qué estás preaprobada</Eyebrow>
          <Card><div className="p-5 flex flex-col gap-3">
            {[
              { icon: <TrendingUp size={20} />, t: 'Ingresos consistentes', s: '$336K anuales declarados al SAT' },
              { icon: <ShieldCheck size={20} />, t: 'Cumplimiento positivo', s: 'Sin adeudos graves' },
              { icon: <UserCog size={20} />, t: 'Historial Contabilízate', s: '2 años como usuaria activa' },
            ].map((it, i) => (
              <div key={it.t}>
                <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>{it.icon}</div><div className="flex-1 min-w-0"><div className="font-bold text-[14px]">{it.t}</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{it.s}</div></div><Check size={18} color="var(--brand-500)" /></div>
                {i < 2 && <Divider />}
              </div>
            ))}
          </div></Card>
          <div className="rounded-3xl mt-3.5 p-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
            <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}><span className="text-[16px] font-bold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Consulta sin costo.</span> No afecta tu historial crediticio.</div>
          </div>
        </div>
      </div>
      <div className="mt-7">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Más productos</Eyebrow>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
          <Tile><TIcon kind="violet"><Car size={20} /></TIcon><div><div className="font-bold text-[15px]">Crédito automotriz</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Desde 11.5% · enganche 0%</div></div></Tile>
          <Tile><TIcon kind="sky"><Building2 size={20} /></TIcon><div><div className="font-bold text-[15px]">Crédito hipotecario</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Intereses deducibles · 9.8%</div></div></Tile>
          <Tile><TIcon kind="coral"><Factory size={20} /></TIcon><div><div className="font-bold text-[15px]">Capital para tu actividad</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Equipo, flota, inventario</div></div></Tile>
        </div>
      </div>
    </>
  )
}

// ============ APRENDE ============
function AprendeScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <>
      <div className="rounded-3xl overflow-hidden mb-5">
        <div className="p-8" style={{ background: 'linear-gradient(140deg,#F4F2F9 0%,#E8E5F1 100%)' }}>
          <Pill kind="ink">Personalizado para ti</Pill>
          <div className="text-[40px] font-extrabold tracking-tight leading-tight mt-3.5 max-w-[620px]" style={DISPLAY}>3 cosas que debes saber antes del 17</div>
          <div className="text-[14px] mt-2.5 leading-relaxed max-w-[520px]" style={{ color: 'var(--ink-500)' }}>Ajustamos esta semana según tu régimen (Plataformas Tecnológicas) y tu situación fiscal actual.</div>
          <Btn kind="primary" style={{ marginTop: 18 }} onClick={() => go('tip-detail')}>Empezar lección · 4 min</Btn>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-[18px]">
        <Pill kind="ink">Todos</Pill><Pill>Fiscales</Pill><Pill>Financieros</Pill><Pill>Plataformas</Pill><Pill>Deducciones</Pill><Pill>Ahorro</Pill><Pill>Inversión</Pill>
      </div>

      <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Para tu situación</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
        <Tile onClick={() => go('tip-detail')} style={{ background: 'linear-gradient(160deg,#FFF8EE,#FFF)' }}><TIcon kind="amber"><Receipt size={20} /></TIcon><div><Badge kind="amber">Fiscal</Badge><div className="font-bold text-[15px] mt-1.5">Plataformas retienen ISR e IVA</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Uber, Rappi, Didi → aún así declaras</div></div></Tile>
        <Tile onClick={() => go('tip-detail')} style={{ background: 'linear-gradient(160deg,#EEFEF6,#FFF)' }}><TIcon kind="brand"><Fuel size={20} /></TIcon><div><Badge kind="brand">Fiscal</Badge><div className="font-bold text-[15px] mt-1.5">Deduce gasolina y mantenimiento</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Si usas vehículo para trabajar</div></div></Tile>
        <Tile onClick={() => go('tip-detail')} style={{ background: 'linear-gradient(160deg,#DDEBFF,#FFF)' }}><TIcon kind="sky"><PiggyBank size={20} /></TIcon><div><Badge kind="sky">Financiero</Badge><div className="font-bold text-[15px] mt-1.5">Separa el 14% para impuestos</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Nu o Hey al 12% anual</div></div></Tile>
        <Tile onClick={() => go('tip-detail')} style={{ background: 'linear-gradient(160deg,#E6E1FF,#FFF)' }}><TIcon kind="violet"><BarChart3 size={20} /></TIcon><div><Badge kind="violet">Financiero</Badge><div className="font-bold text-[15px] mt-1.5">CETES rinden 7.58% anual</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Tan seguro como tu bolsillo</div></div></Tile>
      </div>

      <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Esenciales del mes</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] mb-5">
        <ListItem icon={<Receipt size={20} />} iconKind="brand" title="Solicita factura de todo gasto deducible" sub="Honorarios médicos, colegiaturas, donativos" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tip-detail')} />
        <ListItem icon={<CalendarClock size={20} />} iconKind="coral" title="Presenta antes del día 17" sub="Evita recargos y multas SAT" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tip-detail')} />
        <ListItem icon={<CreditCard size={20} />} iconKind="amber" title="Paga con tarjeta gastos >$2,000" sub="Mínimo para que sean deducibles" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tip-detail')} />
        <ListItem icon={<Target size={20} />} iconKind="sky" title="Aplica la regla 50/30/20" sub="Necesidades · deseos · ahorro" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tip-detail')} />
        <ListItem icon={<Landmark size={20} />} iconKind="violet" title="Aporta a tu Afore y paga menos ISR" sub="Deduce hasta 10% anual" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tip-detail')} />
        <ListItem icon={<Sparkles size={20} />} iconKind="coral" title="Pregúntale a tu IA fiscal" sub="Responde en segundos" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
      </div>

      <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Recursos oficiales</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        <Card><div className="p-5 flex items-center gap-3"><TrendingUp size={20} color="var(--brand-600)" /><div><div className="font-bold text-[14px]">CETES Directo</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Inversión segura</div></div></div></Card>
        <Card><div className="p-5 flex items-center gap-3"><Shield size={20} color="#1C4C96" /><div><div className="font-bold text-[14px]">CONDUSEF</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Educación financiera</div></div></div></Card>
        <Card><div className="p-5 flex items-center gap-3"><Building size={20} color="var(--ink-700)" /><div><div className="font-bold text-[14px]">SAT</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Obligaciones fiscales</div></div></div></Card>
      </div>
    </>
  )
}

// ============ TIP DETAIL ============
function TipDetailScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <>
      <Btn kind="ghost" size="sm" onClick={() => go('aprende')} style={{ marginBottom: 18 }}><ChevronLeft size={16} /> Volver</Btn>
      <div className="grid grid-cols-12 gap-[18px]">
        <div className="col-span-12 lg:col-span-8">
          <div className="flex gap-2 items-center"><Badge kind="brand">Fiscal</Badge><Badge kind="outline">4 min de lectura</Badge></div>
          <div className="text-[56px] font-extrabold tracking-tight leading-none mt-4" style={DISPLAY}>Deduce gasolina, mantenimiento y seguro</div>
          <div className="text-[16px] mt-3 leading-relaxed max-w-[640px]" style={{ color: 'var(--ink-500)' }}>Si usas tu vehículo para trabajar en plataformas tecnológicas, estos gastos son 100% deducibles.</div>

          <div className="flex flex-col gap-[18px] mt-7">
            <div>
              <Eyebrow style={{ marginBottom: 10, display: 'block' }}>1 · Qué incluye</Eyebrow>
              <Card><div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {['Gasolina y combustibles', 'Refacciones y mantenimiento', 'Seguro de auto', 'Verificación y tenencia'].map(x => (
                    <div key={x} className="flex items-center gap-2"><CheckCircle2 size={18} color="var(--brand-500)" /><span className="text-[14px]">{x}</span></div>
                  ))}
                </div>
              </div></Card>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 10, display: 'block' }}>2 · Qué necesitas</Eyebrow>
              <Card><div className="p-5"><div className="text-[14px] leading-relaxed">Factura CFDI a tu nombre con uso <span className="font-extrabold px-1.5 py-0.5 rounded-md" style={{ ...MONO, background: 'var(--brand-50)' }}>G03</span> y forma de pago distinta a efectivo si supera $2,000 MXN.</div></div></Card>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 10, display: 'block' }}>3 · Error común</Eyebrow>
              <div className="rounded-3xl p-5" style={{ background: 'var(--coral-soft)', border: '1px solid rgba(255,136,98,0.35)' }}><div className="text-[14px] leading-relaxed" style={{ color: '#6B2512' }}>Pagar la gasolina con vale en efectivo. <strong>No es deducible</strong>: usa tarjeta o monedero electrónico.</div></div>
            </div>
            <div>
              <Eyebrow style={{ marginBottom: 10, display: 'block' }}>4 · Cómo aplica en tu app</Eyebrow>
              <Card><div className="p-5"><div className="text-[14px] leading-relaxed">Paga gasolina directo desde <strong>Hub+ → Servicios</strong>. Tu factura entra automática a la bóveda y se clasifica como deducible.</div><Btn size="sm" kind="ghost" onClick={() => go('pagar')} style={{ marginTop: 12 }}>Ir a Hub+</Btn></div></Card>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Btn kind="ghost" block><CheckCircle2 size={18} /> Útil</Btn>
            <Btn kind="coral" block><Sparkles size={18} /> Preguntar IA</Btn>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="rounded-3xl p-6 text-white sticky top-6" style={{ background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', boxShadow: 'var(--sh-brand)' }}>
            <Eyebrow style={{ color: 'rgba(255,255,255,0.82)' }}>Impacto para ti</Eyebrow>
            <div className="text-[56px] font-extrabold tracking-tight leading-none mt-1.5" style={DISPLAY}>$4,100</div>
            <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.82)' }}>MXN en ahorro estimado anual</div>
            <Divider dark />
            <div className="text-[13px] mt-4 leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>Calculado con tus ingresos actuales y la tasa de ISR aplicable a tu régimen.</div>
          </div>
        </div>
      </div>
    </>
  )
}

// ============ YO ============
function YoScreen({ fullName, email, rfc, initials, go, onLogout, signingOut }: { fullName: string; email: string; rfc: string | null; initials: string; go: (s: Screen) => void; onLogout: () => void; signingOut: boolean }) {
  return (
    <>
      <div className="grid grid-cols-12 gap-[18px]">
        <div className="col-span-12 lg:col-span-5">
          <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(135deg,#fff 0%,#F7F8FB 100%)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3">
              <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white text-[32px] font-extrabold" style={{ ...DISPLAY, background: 'linear-gradient(135deg,#10DA92,#00B073)' }}>{initials}</div>
              <div className="flex-1 min-w-0"><div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>{fullName}</div><div className="text-[12px]" style={{ ...MONO, color: 'var(--ink-400)' }}>{rfc || email}</div></div>
            </div>
            <Divider />
            <div className="flex items-center justify-between mt-5">
              <div><Eyebrow>Mi plan</Eyebrow><div className="text-[15px] font-bold mt-0.5">Platinum · Mensual</div></div>
              <Btn size="sm" kind="primary" onClick={() => go('plan')}>Gestionar</Btn>
            </div>
          </div>
          <Card><div className="p-5 mt-[18px]" style={{ marginTop: 18 }}>
            <div className="flex items-center justify-between flex-wrap gap-2"><div className="font-bold text-[14px]">Tu uso este mes</div><span className="text-[12px] font-semibold" style={{ color: 'var(--ink-400)' }}>2 de 5 declaraciones</span></div>
            <div className="mt-2.5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}><div className="h-full rounded-full" style={{ width: '40%', background: 'linear-gradient(90deg,var(--brand-500),var(--brand-600))' }} /></div>
            <div className="flex items-end justify-between mt-4">
              <div><div className="text-[18px] font-extrabold" style={MONO}>24</div><div className="text-[11px] font-semibold" style={{ color: 'var(--ink-400)' }}>CFDI / 300</div></div>
              <div><div className="text-[18px] font-extrabold" style={MONO}>2</div><div className="text-[11px] font-semibold" style={{ color: 'var(--ink-400)' }}>Chats IA / ∞</div></div>
              <div><div className="text-[18px] font-extrabold" style={MONO}>0</div><div className="text-[11px] font-semibold" style={{ color: 'var(--ink-400)' }}>Citas / 3</div></div>
            </div>
          </div></Card>
        </div>
        <div className="col-span-12 lg:col-span-7">
          <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Gestión</Eyebrow>
          <div className="flex flex-col gap-2.5">
            <ListItem icon={<Gem size={20} />} iconKind="brand" title="Mi plan" sub="Platinum · próximo pago 28 abr" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('plan')} />
            <ListItem icon={<FilePlus2 size={20} />} iconKind="coral" title="Trámites adicionales" sub="Cambio domicilio · CSD · citas SAT" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} onClick={() => go('tramites')} />
            <ListItem icon={<UserCog size={20} />} iconKind="sky" title="Datos fiscales" sub="RFC · régimen · domicilio" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
            <ListItem icon={<UserRound size={20} />} iconKind="violet" title="Tu contador asignado" sub="Karla M. · atiende hoy" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
            <ListItem icon={<Receipt size={20} />} iconKind="amber" title="Mis pagos a Contabilízate" sub="6 meses · $2,821.50" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
          </div>
          <Eyebrow style={{ margin: '22px 0 10px', display: 'block' }}>Preferencias</Eyebrow>
          <div className="flex flex-col gap-2.5">
            <ListItem icon={<Bell size={20} />} title="Notificaciones" sub="Recordatorios · alertas SAT" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
            <ListItem icon={<Lock size={20} />} title="Seguridad" sub="Face ID · contraseña · 2FA" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
            <ListItem icon={<LifeBuoy size={20} />} title="Centro de ayuda" sub="FAQ · chat humano" right={<ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />} />
            <ListItem icon={<LogOut size={20} />} iconKind="danger" title={<span style={{ color: '#B01F1F' }}>{signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>} onClick={signingOut ? undefined : onLogout} />
          </div>
        </div>
      </div>
      <div className="text-center text-[11px] font-semibold mt-7 leading-relaxed" style={{ color: 'var(--ink-400)' }}>Contabilízate 2030 · v7.4.2 · Hecho con cariño en México</div>
    </>
  )
}

// ============ PLAN ============
function PlanScreen() {
  return (
    <div className="grid grid-cols-12 gap-[18px]">
      <div className="col-span-12 lg:col-span-7">
        <div className="rounded-[36px] p-7 text-white relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
          <Badge kind="coral">Tu plan actual</Badge>
          <div className="text-[56px] font-extrabold tracking-tight leading-none mt-3.5" style={DISPLAY}>Platinum</div>
          <div className="text-[14px] mt-1" style={{ color: 'rgba(255,255,255,0.82)' }}>Facturación mensual · renueva 28 abr 2026</div>
          <Divider dark />
          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <div><Eyebrow style={{ color: 'rgba(255,255,255,0.62)' }}>Siguiente cargo</Eyebrow><div className="text-[40px] font-extrabold tracking-tight" style={DISPLAY}>$470<span className="text-[18px]" style={{ color: 'rgba(255,255,255,0.62)' }}>.25</span></div><div className="text-[12px]" style={{ color: 'rgba(255,255,255,0.62)' }}>MXN · IVA incluido</div></div>
            <Btn size="sm" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}><CreditCard size={16} /> Cambiar método</Btn>
          </div>
        </div>
        <div className="mt-5">
          <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Qué incluye tu plan</Eyebrow>
          <Card><div>
            {[
              { i: <Sparkles size={20} />, t: '6 declaraciones con IA/sem', s: '2 usadas' },
              { i: <FileText size={20} />, t: '300 CFDI/semestre', s: '24 emitidos' },
              { i: <MessageCircle size={20} />, t: 'Chat con contador ilimitado', s: 'Responde en <2 h' },
              { i: <Shield size={20} />, t: 'Monitoreo listas negras 24/7', s: '69-B, 69-B Bis y más' },
              { i: <Stethoscope size={20} />, t: 'Análisis fiscal con IA', s: 'Ahorro detectado continuo' },
            ].map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>{it.i}</div><div className="flex-1 min-w-0"><div className="font-bold text-[14px]">{it.t}</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{it.s}</div></div></div>
                {i < arr.length - 1 && <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />}
              </div>
            ))}
          </div></Card>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-5">
        <Eyebrow style={{ marginBottom: 10, display: 'block' }}>Ahorra con 6 meses</Eyebrow>
        <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(160deg,var(--coral-soft),#fff)', border: '1px solid rgba(255,136,98,0.35)' }}>
          <Badge kind="coral">Ahorras 47%</Badge>
          <div className="text-[30px] font-extrabold tracking-tight mt-3" style={DISPLAY}>Plan semestral</div>
          <div className="text-[14px] mt-1" style={{ color: 'var(--ink-500)' }}>$2,821.50 por 6 meses</div>
          <Divider />
          <div className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between"><span className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Mensual actual</span><span className="font-bold" style={MONO}>$470.25 × 6 = $2,821.50</span></div>
            <div className="flex justify-between"><span className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Semestral</span><span className="font-bold" style={{ ...MONO, color: '#9E3A15' }}>$2,821.50 único</span></div>
          </div>
          <Btn kind="coral" block style={{ marginTop: 18 }}>Cambiar a semestral</Btn>
        </div>
        <Btn kind="ghost" block style={{ marginTop: 14 }}>Cancelar suscripción</Btn>
      </div>
    </div>
  )
}

// ============ TRÁMITES ============
function TramitesScreen() {
  return (
    <>
      <div className="text-[14px] mb-5 max-w-[720px]" style={{ color: 'var(--ink-500)' }}>Servicios puntuales que puedes contratar sin plan. Los que forman parte de Platinum ya están incluidos sin costo extra.</div>
      <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Trámites ante SAT</Eyebrow>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[18px] mb-5">
        {[
          { i: <MapPin size={20} />, t: 'Cambio de domicilio', s: 'Actualización' },
          { i: <Calendar size={20} />, t: 'Cita en el SAT', s: 'Agendamiento' },
          { i: <Key size={20} />, t: 'Sellos CSD', s: 'Para facturación' },
          { i: <RefreshCcw size={20} />, t: 'Actualizar obligaciones', s: 'Régimen fiscal' },
        ].map((x, i) => (
          <Tile key={i}>
            <TIcon kind="brand">{x.i}</TIcon>
            <div><div className="font-bold text-[15px]">{x.t}</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{x.s}</div></div>
            <div className="flex items-center justify-between mt-auto"><Badge kind="brand">Incluido</Badge><span className="text-[11px] font-semibold line-through" style={{ color: 'var(--ink-400)' }}>${[300, 200, 300, 300][i]}</span></div>
          </Tile>
        ))}
      </div>

      <Eyebrow style={{ marginBottom: 12, display: 'block' }}>Declaraciones extra</Eyebrow>
      <div className="flex flex-col gap-2.5">
        <ListItem icon={<FileText size={20} />} iconKind="coral" title="Declaración complementaria mensual" sub="Corrección o actualización" right={<><span className="text-[16px] font-extrabold mr-3" style={MONO}>$218.90</span><Btn size="sm" kind="ghost">Contratar</Btn></>} />
        <div className="rounded-2xl flex items-center gap-3.5 px-4 py-3.5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}><FileText size={20} /></div>
          <div className="flex-1 min-w-0"><div className="font-bold text-[14px]">Declaración anual</div><div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Presentación del ejercicio fiscal</div></div>
          <span className="text-[16px] font-extrabold" style={MONO}>$934.00</span>
          <Btn size="sm" kind="brand">Contratar</Btn>
        </div>
        <ListItem icon={<FileText size={20} />} iconKind="amber" title="Anual complementaria" sub="Corrección de la declaración anual" right={<><span className="text-[16px] font-extrabold mr-3" style={MONO}>$1,276.00</span><Btn size="sm" kind="ghost">Contratar</Btn></>} />
      </div>

      <div className="rounded-3xl p-5 mt-5" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
        <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>Todos los precios incluyen IVA. La declaración anual no se incluye en el plan mensual y se cobra por separado.</div>
      </div>
    </>
  )
}
