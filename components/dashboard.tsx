'use client'

import { useState, useTransition, type ComponentType, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle, ArrowRight, BadgeCheck, Bell, Calendar, Check, CheckCircle2,
  ChevronLeft, ChevronRight, Eye, FileDown, FilePlus, FilePlus2, FileText, FolderLock,
  Gem, HelpCircle, Home, Key, Lightbulb, Lock, LogOut, MapPin, Menu, MessageCircle,
  PiggyBank, PlayCircle, Receipt, RefreshCcw, Settings, Sparkles, Stethoscope,
  Target, TrendingUp, UserRound, Zap,
} from 'lucide-react'
import { signOut } from '@/features/auth/actions'

interface Props {
  fullName: string
  email: string
  rfc: string | null
}

type Screen =
  | 'home' | 'declaraciones' | 'facturas' | 'documentos' | 'diagnostico'
  | 'aprende' | 'tip-detail' | 'tramites' | 'plan' | 'ayuda' | 'cuenta' | 'estatus-sat'

const TITLES: Record<Screen, [string, string]> = {
  home: ['Hola 👋', 'Aquí tienes lo importante de hoy'],
  declaraciones: ['Mis declaraciones', 'Tus impuestos mes con mes, sin complicarte'],
  facturas: ['Mis facturas', 'Las facturas que emites a tus clientes'],
  documentos: ['Mis documentos', 'Todo lo que el SAT tiene de ti, en un solo lugar'],
  diagnostico: ['Diagnóstico fiscal', 'Cómo estás y qué puedes mejorar'],
  aprende: ['Aprende', 'Lecciones cortas para entender tus impuestos'],
  'tip-detail': ['Lección', 'Aprende algo útil en pocos minutos'],
  tramites: ['Trámites adicionales', 'Servicios extra que puedes contratar cuando los necesites'],
  plan: ['Mi plan', 'Tu suscripción y opciones de pago'],
  ayuda: ['Ayuda y tutoriales', 'Aprende a tu ritmo, paso a paso'],
  cuenta: ['Mi cuenta', 'Tus datos y preferencias'],
  'estatus-sat': ['Conectar con el SAT', 'Necesitamos esto una sola vez'],
}

interface NavDef { id: Screen; label: string; Icon: ComponentType<{ size?: number }>; hint: string }
const NAV: NavDef[] = [
  { id: 'home', label: 'Inicio', Icon: Home, hint: 'Tu resumen del día' },
  { id: 'declaraciones', label: 'Declaraciones', Icon: FileText, hint: 'Tus impuestos del mes' },
  { id: 'facturas', label: 'Facturas', Icon: FilePlus, hint: 'Emite y revisa facturas' },
  { id: 'documentos', label: 'Documentos', Icon: FolderLock, hint: 'CFDI y constancias del SAT' },
  { id: 'diagnostico', label: 'Diagnóstico', Icon: Stethoscope, hint: 'Tu situación fiscal' },
  { id: 'aprende', label: 'Aprende', Icon: Sparkles, hint: 'Lecciones cortas' },
  { id: 'tramites', label: 'Trámites', Icon: FilePlus2, hint: 'Servicios extra' },
  { id: 'plan', label: 'Mi plan', Icon: Gem, hint: 'Tu suscripción' },
  { id: 'ayuda', label: 'Ayuda', Icon: HelpCircle, hint: 'Tutoriales y dudas' },
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
    <div className="grid min-h-screen lg:grid-cols-[260px_1fr]" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-[70] lg:hidden" style={{ background: 'rgba(21,17,63,0.55)' }} />
      )}

      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[260px] z-[80] flex flex-col px-4 py-5 gap-1 transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ background: 'var(--card)', borderRight: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2.5 px-2 pb-5 mb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-500)' }}>
            <span className="text-base font-black text-white" style={DISPLAY}>C</span>
          </div>
          <span className="text-[18px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>contabilízate</span>
        </div>

        <nav className="flex flex-col gap-1.5 py-1">
          {NAV.map(n => <NavItem key={n.id} {...n} active={screen === n.id} onClick={() => go(n.id)} />)}
        </nav>

        <div
          className="mt-auto p-3.5 rounded-2xl flex items-center gap-2.5"
          style={{ background: 'linear-gradient(160deg,#FFF,#F9FAFB)', border: '1px solid var(--border)' }}
        >
          <button onClick={() => go('cuenta')} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
            <div className="w-9 h-9 rounded-full text-white font-extrabold flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#10DA92,#00B073)', ...DISPLAY }}>{initials}</div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-[13px] truncate">{firstName}</div>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>Mi cuenta</div>
            </div>
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
      <main className="min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 max-w-[1280px]">
        <div className="flex items-center justify-between gap-4 mb-7">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <Menu size={18} />
            </button>
            <div>
              <div className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                {screen === 'home' ? `Hola, ${firstName} 👋` : TITLES[screen][0]}
              </div>
              <div className="text-[14px] font-semibold mt-1" style={{ color: 'var(--ink-500)' }}>
                {TITLES[screen][1]}
              </div>
            </div>
          </div>
        </div>

        {screen === 'home' && <HomeScreen go={go} rfc={rfc} firstName={firstName} />}
        {screen === 'declaraciones' && <DeclaracionesScreen rfc={rfc} go={go} />}
        {screen === 'facturas' && <FacturasScreen rfc={rfc} go={go} />}
        {screen === 'documentos' && <DocumentosScreen rfc={rfc} go={go} />}
        {screen === 'diagnostico' && <DiagnosticoScreen rfc={rfc} go={go} />}
        {screen === 'aprende' && <AprendeScreen go={go} />}
        {screen === 'tip-detail' && <TipDetailScreen go={go} />}
        {screen === 'tramites' && <TramitesScreen />}
        {screen === 'plan' && <PlanScreen />}
        {screen === 'ayuda' && <AyudaScreen />}
        {screen === 'cuenta' && <CuentaScreen fullName={fullName} email={email} rfc={rfc} initials={initials} onLogout={handleLogout} signingOut={signingOut} />}
        {screen === 'estatus-sat' && <SatConnectScreen />}
      </main>
    </div>
  )
}

// ============ Sidebar pieces ============
function NavItem({ label, Icon, active, onClick, hint }: { label: string; Icon: ComponentType<{ size?: number }>; active: boolean; onClick: () => void; hint: string; id?: Screen }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-3 rounded-2xl text-left transition w-full"
      style={
        active
          ? { background: 'var(--ink-900)', color: '#fff', boxShadow: 'var(--sh-ink)' }
          : { background: 'transparent', color: 'var(--ink-700)' }
      }
    >
      <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: active ? 'rgba(14,209,138,0.15)' : 'var(--ink-50)', color: active ? 'var(--brand-300)' : 'var(--ink-700)' }}>
        <Icon size={18} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-bold leading-tight">{label}</span>
        <span className="block text-[11.5px] font-semibold mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--ink-400)' }}>{hint}</span>
      </span>
    </button>
  )
}

// ============ Reusable bits ============
function Card({ children, style, className = '' }: { children: ReactNode; style?: React.CSSProperties; className?: string }) {
  return <div className={`rounded-3xl overflow-hidden ${className}`} style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)', ...style }}>{children}</div>
}
function Btn({ children, kind = 'primary', size = 'md', onClick, block, type, disabled, style }: { children: ReactNode; kind?: 'primary' | 'brand' | 'ghost'; size?: 'sm' | 'md' | 'lg'; onClick?: () => void; block?: boolean; type?: 'button' | 'submit'; disabled?: boolean; style?: React.CSSProperties }) {
  const padding = size === 'sm' ? 'px-4 py-2.5 text-[13px] min-h-[38px]' : size === 'lg' ? 'px-7 py-4 text-[16px] min-h-[56px]' : 'px-5 py-3.5 text-[15px] min-h-[48px]'
  const stylesByKind: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--ink-900)', color: '#fff', boxShadow: 'var(--sh-ink)' },
    brand: { background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
    ghost: { background: 'var(--card)', color: 'var(--ink-900)', border: '1px solid var(--border-strong)' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60 ${padding} ${block ? 'w-full' : ''}`}
      style={{ ...stylesByKind[kind], ...style }}
    >{children}</button>
  )
}
function HelpBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#F4F8FF', border: '1px solid #DDEBFF' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#DDEBFF', color: '#1C4C96' }}>
        <Lightbulb size={16} />
      </div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: '#1C4C96' }}>{children}</div>
    </div>
  )
}
function VideoSlot({ title, duration }: { title: string; duration: string }) {
  return (
    <button className="rounded-2xl p-4 flex items-center gap-3 w-full text-left transition hover:translate-y-[-1px]" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}>
      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}>
        <PlayCircle size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14px] leading-tight">{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>Video · {duration}</div>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--ink-300)' }} />
    </button>
  )
}
function StatusDot({ ok }: { ok: boolean }) {
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: ok ? 'var(--brand-500)' : '#F5B037', boxShadow: ok ? '0 0 0 3px var(--brand-100)' : '0 0 0 3px var(--amber-soft)' }} />
}
function Tabs({ items, active, onChange }: { items: string[]; active: number; onChange?: (i: number) => void }) {
  return (
    <div className="inline-flex gap-1.5 p-1.5 rounded-full" style={{ background: 'rgba(21,17,63,0.05)' }}>
      {items.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange?.(i)}
          className="px-4 py-2 rounded-full text-[13px] font-bold transition"
          style={i === active ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' } : { background: 'transparent', color: 'var(--ink-500)' }}
        >{t}</button>
      ))}
    </div>
  )
}
function Pill({ children, kind = 'default' }: { children: ReactNode; kind?: 'default' | 'brand' | 'coral' | 'amber' | 'ink' }) {
  const map: Record<string, React.CSSProperties> = {
    default: { background: 'var(--card)', color: 'var(--ink-700)', border: '1px solid var(--border-strong)' },
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15', border: '1px solid rgba(255,136,98,0.35)' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312', border: '1px solid rgba(245,176,55,0.35)' },
    ink: { background: 'var(--ink-900)', color: '#fff', border: '1px solid transparent' },
  }
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold" style={map[kind]}>{children}</span>
}
function Badge({ children, kind = 'default' }: { children: ReactNode; kind?: 'default' | 'brand' | 'amber' | 'coral' }) {
  const map: Record<string, React.CSSProperties> = {
    default: { background: 'var(--ink-50)', color: 'var(--ink-700)' },
    brand: { background: 'var(--brand-100)', color: 'var(--brand-900)' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold" style={map[kind]}>{children}</span>
}

// ============ HOME ============
function HomeScreen({ go, rfc }: { go: (s: Screen) => void; rfc: string | null; firstName: string }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)

  if (!hasCsf) {
    return (
      <div className="flex flex-col gap-5 max-w-[760px]">
        <div className="rounded-3xl p-7 lg:p-8" style={{ background: 'linear-gradient(135deg,#DDEBFF 0%,#F4F7FB 100%)', border: '1px solid #BFDBFF' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#1C4C96' }}>
            <AlertCircle color="#fff" size={28} />
          </div>
          <div className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4" style={DISPLAY}>
            Falta un paso para empezar
          </div>
          <div className="text-[15px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Para poder ayudarte con tus impuestos, necesitamos conectarnos al SAT con tu permiso. Solo lo haces <strong>una vez</strong> y nosotros nos encargamos del resto.
          </div>
          <div className="mt-6">
            <Btn kind="brand" size="lg" onClick={() => go('estatus-sat')}>
              <Zap size={18} /> Conectar con el SAT
            </Btn>
          </div>
        </div>

        <HelpBox>
          <strong>¿Por qué necesitamos esto?</strong> Para descargar automáticamente tus facturas y constancia del SAT. No hacemos nada sin avisarte primero.
        </HelpBox>

        <div>
          <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>¿Tienes dudas? Mira este video corto</div>
          <VideoSlot title="Cómo conectar tu cuenta al SAT" duration="2 min" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Acción de hoy — la más importante */}
      <div className="rounded-3xl p-7 lg:p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'rgba(14,209,138,0.18)', color: 'var(--brand-300)', border: '1px solid rgba(14,209,138,0.3)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--brand-500)' }} /> Lo que importa hoy
        </div>
        <div className="text-[28px] lg:text-[36px] font-extrabold tracking-tight leading-tight mt-4 max-w-[640px]" style={DISPLAY}>
          Tu declaración de marzo vence en <span style={{ color: 'var(--brand-300)' }}>1 día</span>
        </div>
        <div className="text-[15px] mt-3 leading-relaxed max-w-[560px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
          No te preocupes: tu contador ya la está preparando. Solo necesitas revisarla y autorizar el pago cuando esté lista.
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Btn size="lg" onClick={() => go('declaraciones')} style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
            Ver mi declaración <ArrowRight size={18} />
          </Btn>
          <Btn size="lg" kind="ghost" onClick={() => go('ayuda')} style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)' }}>
            <HelpCircle size={18} /> No entiendo qué hacer
          </Btn>
        </div>
      </div>

      {/* Estado simple de 3 cosas */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>¿Cómo vas con el SAT?</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Aquí te explicamos en palabras simples cómo estás ante Hacienda.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusCard
            ok
            title="Estás al corriente"
            desc="No apareces en listas negras del SAT y tu RFC está activo."
            cta="Ver detalle"
            onClick={() => go('documentos')}
          />
          <StatusCard
            ok={false}
            title="1 declaración pendiente"
            desc="La declaración de marzo está casi lista. Tu contador la revisa."
            cta="Ver declaración"
            onClick={() => go('declaraciones')}
          />
          <StatusCard
            ok
            title="Tus documentos al día"
            desc="Tu Constancia de Situación Fiscal está vigente y lista para usar."
            cta="Ver documentos"
            onClick={() => go('documentos')}
          />
        </div>
      </div>

      {/* Tutorial / aprender */}
      <div className="rounded-3xl p-6 lg:p-7" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FFFAF4 100%)', border: '1px solid #FFE5B4' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFE5B4', color: '#7B5312' }}>
            <Sparkles size={22} />
          </div>
          <div className="flex-1 min-w-0 max-w-[560px]">
            <div className="text-[20px] font-extrabold tracking-tight" style={DISPLAY}>¿Es tu primera vez aquí?</div>
            <div className="text-[14px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
              Te dejamos un video corto donde te explicamos qué es cada cosa y cómo usar tu panel sin perderte.
            </div>
            <div className="mt-4">
              <Btn kind="primary" onClick={() => go('ayuda')}><PlayCircle size={18} /> Ver tutorial de bienvenida</Btn>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario simple */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Próximas fechas</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Estas son las fechas importantes para que no se te pase nada.</div>
        <Card>
          <div className="p-2">
            <DateRow day="17" mo="Abr" title="Declaración mensual de marzo" sub="Mañana · tu contador la prepara" urgent />
            <Divider />
            <DateRow day="30" mo="Abr" title="Declaración anual 2025" sub="En 14 días · ya estamos trabajando en ella" />
            <Divider />
            <DateRow day="17" mo="May" title="Declaración mensual de abril" sub="En 25 días · todavía hay tiempo" muted />
          </div>
        </Card>
      </div>
    </div>
  )
}

function StatusCard({ ok, title, desc, cta, onClick }: { ok: boolean; title: string; desc: string; cta: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-3xl p-5 text-left transition hover:translate-y-[-2px] flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: ok ? 'var(--brand-50)' : 'var(--amber-soft)', color: ok ? 'var(--brand-700)' : '#7B5312' }}>
          {ok ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        </div>
        <StatusDot ok={ok} />
      </div>
      <div>
        <div className="font-bold text-[15.5px] leading-tight" style={{ color: 'var(--ink-900)' }}>{title}</div>
        <div className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>{desc}</div>
      </div>
      <div className="text-[13px] font-bold flex items-center gap-1 mt-1" style={{ color: 'var(--brand-700)' }}>
        {cta} <ChevronRight size={14} />
      </div>
    </button>
  )
}

function DateRow({ day, mo, title, sub, urgent, muted }: { day: string; mo: string; title: string; sub: string; urgent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="w-14 text-center flex-shrink-0 rounded-xl py-2" style={{ background: urgent ? 'var(--coral-soft)' : 'var(--ink-50)' }}>
        <div className="text-[24px] font-extrabold leading-none" style={{ ...DISPLAY, color: urgent ? '#9E3A15' : muted ? 'var(--ink-400)' : 'var(--ink-900)' }}>{day}</div>
        <div className="text-[10px] tracking-widest uppercase font-extrabold mt-1" style={{ color: urgent ? '#9E3A15' : 'var(--ink-400)' }}>{mo}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-[14.5px] ${muted ? 'opacity-70' : ''}`}>{title}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{sub}</div>
      </div>
    </div>
  )
}
function Divider() {
  return <div className="mx-4" style={{ height: 1, background: 'var(--border)' }} />
}

// ============ DECLARACIONES ============
function DeclaracionesScreen({ rfc, go }: { rfc: string | null; go: (s: Screen) => void }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />

  return (
    <div className="flex flex-col gap-5 max-w-[920px]">
      <HelpBox>
        <strong>¿Qué es una declaración?</strong> Es el reporte mensual que entregas al SAT con lo que ganaste y lo que vas a pagar de impuestos. Tu contador la prepara y tú solo la autorizas.
      </HelpBox>

      <Tabs items={['Pendientes', 'En proceso', 'Presentadas']} active={0} />

      {/* La que importa ahora */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>📌 La que toca este mes</div>
        <div className="rounded-3xl p-6 lg:p-7 text-white" style={{ background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)', boxShadow: 'var(--sh-brand)' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>Declaración de marzo 2026</div>
              <div className="text-[32px] font-extrabold tracking-tight mt-2" style={DISPLAY}>Vence mañana</div>
              <div className="text-[14px] mt-2 max-w-[420px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Tu contador ya revisó 9 de 12 facturas. Cuando termine, recibirás un aviso para que la autorices.
              </div>
            </div>
          </div>
          <div className="mt-5 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
            <div className="h-full rounded-full" style={{ width: '78%', background: '#fff' }} />
          </div>
          <div className="text-[12.5px] mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>78% lista</div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <Btn size="lg" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>Ver detalle</Btn>
            <Btn size="lg" kind="ghost" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
              <MessageCircle size={18} /> Hablar con mi contador
            </Btn>
          </div>
        </div>
      </div>

      {/* Pendientes anteriores */}
      <div>
        <div className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink-700)' }}>Meses pendientes de antes</div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>Estas declaraciones aún no se han presentado. Te ayudamos a regularizarte sin estrés.</div>
        <Card>
          <div>
            {['Diciembre 2025', 'Enero 2026', 'Febrero 2026'].map((m, i, arr) => (
              <div key={m}>
                <div className="flex items-center gap-3 px-4 py-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{m}</div>
                    <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Pendiente · te ayudamos a presentarla</div>
                  </div>
                  <Btn size="sm" kind="ghost">Resolver</Btn>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Tutorial */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>¿Necesitas entender mejor?</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="¿Qué es una declaración mensual?" duration="3 min" />
          <VideoSlot title="¿Qué pasa si no presento a tiempo?" duration="2 min" />
        </div>
      </div>
    </div>
  )
}

// ============ FACTURAS ============
function FacturasScreen({ rfc, go }: { rfc: string | null; go: (s: Screen) => void }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="emitir facturas" />

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        <strong>¿Qué es una factura?</strong> Es un comprobante (CFDI) que le das a tus clientes cuando te pagan. El SAT la usa para saber cuánto ganaste.
      </HelpBox>

      <Tabs items={['Emitidas', 'Recibidas']} active={0} />

      {/* Acción principal */}
      <div className="rounded-3xl p-6 lg:p-7" style={{ background: 'linear-gradient(135deg,#EEFEF6 0%,#F9FAFB 100%)', border: '1px solid var(--brand-200)' }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>¿Le diste un servicio a alguien?</div>
            <div className="text-[14px] mt-2 max-w-[460px]" style={{ color: 'var(--ink-700)' }}>
              Crea tu factura en un par de clics. Te guiamos paso a paso.
            </div>
          </div>
          <Btn kind="brand" size="lg"><FilePlus size={20} /> Crear nueva factura</Btn>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryStat label="Este mes" value="5 facturas" hint="Todas las que has emitido" />
        <SummaryStat label="Ya te pagaron" value="3" hint="$68,000 cobrados" tone="ok" />
        <SummaryStat label="Te deben" value="2" hint="$60,000 pendientes" tone="warn" />
      </div>

      {/* Lista */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>Tus facturas de abril</div>
        <Card>
          <div>
            {[
              { t: 'Empresa ABC S.A.', s: '15 abr · Servicios profesionales', a: '$35,000', paid: true },
              { t: 'Juan Pérez López', s: '12 abr · Honorarios', a: '$15,000', paid: false },
              { t: 'Tech Solutions MX', s: '10 abr · Consultoría', a: '$25,000', paid: true },
              { t: 'Clínica del Norte', s: '5 abr · Asesoría', a: '$45,000', paid: false },
              { t: 'María González', s: '1 abr · Servicios', a: '$8,000', paid: true },
            ].map((r, i, arr) => (
              <div key={r.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: r.paid ? 'var(--brand-50)' : 'var(--amber-soft)', color: r.paid ? 'var(--brand-700)' : '#7B5312' }}>
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px] truncate">{r.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{r.s}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14.5px] font-extrabold" style={MONO}>{r.a}</div>
                    <div className="text-[11.5px] font-bold mt-0.5" style={{ color: r.paid ? 'var(--brand-700)' : '#7B5312' }}>
                      {r.paid ? '✓ Pagada' : 'Pendiente'}
                    </div>
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <VideoSlot title="Cómo crear tu primera factura" duration="4 min" />
    </div>
  )
}

function SummaryStat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone?: 'ok' | 'warn' }) {
  const bg = tone === 'ok' ? 'var(--brand-50)' : tone === 'warn' ? 'var(--amber-soft)' : 'var(--card)'
  const border = tone === 'ok' ? 'var(--brand-200)' : tone === 'warn' ? 'rgba(245,176,55,0.35)' : 'var(--border)'
  const labelColor = tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? '#7B5312' : 'var(--ink-500)'
  return (
    <div className="rounded-3xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: labelColor }}>{label}</div>
      <div className="text-[26px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? '#7B5312' : 'var(--ink-900)' }}>{value}</div>
      <div className="text-[12.5px] mt-1" style={{ color: labelColor }}>{hint}</div>
    </div>
  )
}

// ============ DOCUMENTOS ============
function DocumentosScreen({ rfc, go }: { rfc: string | null; go: (s: Screen) => void }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="ver tus documentos" />

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        Aquí guardamos tu <strong>Constancia de Situación Fiscal</strong> y todas las facturas que el SAT registra a tu nombre. Las descargamos automáticamente por ti.
      </HelpBox>

      {/* CSF */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>📄 Tu Constancia de Situación Fiscal</div>
        <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(135deg,#EEFEF6 0%,#F9FAFB 65%)', border: '1px solid var(--brand-200)' }}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(140deg,#10DA92,#00A068)' }}>
              <BadgeCheck size={28} color="#fff" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>Vigente · al día</div>
              <div className="text-[20px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Está lista cuando la necesites</div>
              <div className="text-[13px] mt-1" style={{ ...MONO, color: 'var(--ink-500)' }}>RFC: {rfc}</div>
            </div>
          </div>
          <div className="flex gap-3 mt-5 flex-wrap">
            <Btn kind="primary"><Eye size={16} /> Ver documento</Btn>
            <Btn kind="ghost"><FileDown size={16} /> Descargar PDF</Btn>
          </div>
        </div>
      </div>

      {/* Estatus simple */}
      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>✅ Tu situación ante el SAT</div>
        <Card>
          <div>
            {[
              { t: 'Estás al corriente con tus obligaciones', s: 'No debes nada al SAT' },
              { t: 'No apareces en listas negras', s: 'Tu RFC tiene buen historial' },
              { t: 'Tu RFC está activo', s: 'Puedes facturar sin problema' },
            ].map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                    <Check size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{it.s}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Facturas recibidas */}
      <div>
        <div className="text-[16px] font-bold mb-1" style={{ color: 'var(--ink-700)' }}>🧾 Facturas que te enviaron</div>
        <div className="text-[13px] mb-3" style={{ color: 'var(--ink-500)' }}>Las facturas que tus proveedores te emitieron este mes. Las descargamos solas.</div>
        <Card>
          <div>
            {[
              { t: 'Farmacia del Ahorro', s: '14 abr · Medicamentos', a: '$2,500' },
              { t: 'Gasolinera Express', s: '12 abr · Combustible', a: '$1,800' },
              { t: 'Office Depot', s: '10 abr · Material de oficina', a: '$3,200' },
              { t: 'Telmex', s: '8 abr · Teléfono', a: '$899' },
              { t: 'CFE', s: '5 abr · Luz', a: '$1,500' },
            ].map((r, i, arr) => (
              <div key={r.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}>
                    <FileDown size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px] truncate">{r.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{r.s}</div>
                  </div>
                  <div className="text-[14.5px] font-extrabold" style={MONO}>{r.a}</div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function NeedsSatConnect({ go, feature }: { go: (s: Screen) => void; feature: string }) {
  return (
    <div className="flex flex-col gap-5 max-w-[640px]">
      <div className="rounded-3xl p-7" style={{ background: 'linear-gradient(135deg,#DDEBFF 0%,#F4F7FB 100%)', border: '1px solid #BFDBFF' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#1C4C96' }}>
          <Lock color="#fff" size={26} />
        </div>
        <div className="text-[26px] font-extrabold tracking-tight mt-4" style={DISPLAY}>
          Primero conectemos con el SAT
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          Para poder {feature}, necesitamos tu permiso para conectarnos al SAT. Es rápido y solo lo haces una vez.
        </div>
        <div className="mt-5">
          <Btn kind="brand" size="lg" onClick={() => go('estatus-sat')}><Zap size={18} /> Conectar ahora</Btn>
        </div>
      </div>
      <HelpBox>Tus datos se guardan cifrados. No los compartimos con nadie ni los vemos en texto plano.</HelpBox>
    </div>
  )
}

// ============ AYUDA ============
function AyudaScreen() {
  return (
    <div className="flex flex-col gap-6 max-w-[960px]">
      <HelpBox>
        Aquí encuentras videos cortos y respuestas a las dudas más comunes. Si algo no entiendes, escríbele a tu contador desde tu cuenta.
      </HelpBox>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>🎬 Videos para empezar</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Empieza por aquí si es tu primera vez en Contabilízate.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="Bienvenida: ¿qué hacemos por ti?" duration="2 min" />
          <VideoSlot title="Tour rápido por tu panel" duration="3 min" />
          <VideoSlot title="Cómo conectarte al SAT" duration="2 min" />
          <VideoSlot title="Cómo emitir tu primera factura" duration="4 min" />
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>❓ Preguntas frecuentes</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Las dudas más comunes, explicadas en palabras simples.</div>
        <Card>
          <div>
            {[
              { q: '¿Qué es el SAT?', a: 'Es la oficina del gobierno que se encarga de los impuestos en México. Todo el que trabaja debe declarar ahí.' },
              { q: '¿Qué es una declaración mensual?', a: 'Es el reporte que entregas cada mes al SAT con lo que ganaste y lo que pagas de impuestos.' },
              { q: '¿Qué es una factura (CFDI)?', a: 'Es un comprobante digital que demuestra que cobraste o pagaste por algo. El SAT las usa para saber tus ingresos y gastos.' },
              { q: '¿Para qué sirve mi Constancia de Situación Fiscal?', a: 'Es como tu identificación ante el SAT. Te la piden cuando te contratan o cuando facturas a una empresa.' },
              { q: '¿Y si no entiendo algo?', a: 'No te preocupes. Tu contador asignado responde tus dudas en menos de 2 horas desde la sección Mi cuenta.' },
            ].map((it, i, arr) => (
              <div key={it.q}>
                <div className="px-5 py-4">
                  <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>{it.q}</div>
                  <div className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>{it.a}</div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(160deg,#FFF8EE 0%,#FFFAF4 100%)', border: '1px solid #FFE5B4' }}>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: '#FFE5B4', color: '#7B5312' }}>
            <UserRound size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-extrabold tracking-tight" style={DISPLAY}>¿Sigues con dudas?</div>
            <div className="text-[14px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
              Tu contador asignado puede ayudarte por chat. Te responde rápido y en palabras claras.
            </div>
            <div className="mt-4">
              <Btn kind="primary"><MessageCircle size={18} /> Escribirle a mi contador</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============ CUENTA ============
function CuentaScreen({ fullName, email, rfc, initials, onLogout, signingOut }: { fullName: string; email: string; rfc: string | null; initials: string; onLogout: () => void; signingOut: boolean }) {
  return (
    <div className="flex flex-col gap-5 max-w-[760px]">
      <div className="rounded-3xl p-6" style={{ background: 'linear-gradient(135deg,#fff 0%,#F7F8FB 100%)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-[68px] h-[68px] rounded-full flex items-center justify-center text-white text-[28px] font-extrabold flex-shrink-0" style={{ ...DISPLAY, background: 'linear-gradient(135deg,#10DA92,#00B073)' }}>{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="text-[22px] font-extrabold tracking-tight" style={DISPLAY}>{fullName}</div>
            <div className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{email}</div>
            {rfc && <div className="text-[12.5px] mt-1" style={{ ...MONO, color: 'var(--ink-400)' }}>RFC: {rfc}</div>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>Tu contador</div>
        <Card>
          <button className="w-full px-5 py-4 flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-extrabold" style={{ ...DISPLAY, background: 'linear-gradient(135deg,#7B6FE0,#403A8D)' }}>K</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[15px]">Karla M.</div>
              <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Te responde por chat hoy mismo</div>
            </div>
            <Btn size="sm" kind="primary"><MessageCircle size={14} /> Escribir</Btn>
          </button>
        </Card>
      </div>

      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>Preferencias</div>
        <Card>
          <div>
            {[
              { Icon: Bell, t: 'Notificaciones', s: 'Avisos de fechas importantes' },
              { Icon: Lock, t: 'Seguridad', s: 'Contraseña y verificación' },
              { Icon: Settings, t: 'Datos personales', s: 'Nombre, correo, teléfono' },
            ].map((it, i, arr) => (
              <div key={it.t}>
                <button className="w-full px-4 py-3.5 flex items-center gap-3 text-left transition hover:bg-[var(--ink-50)]">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}>
                    <it.Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{it.s}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--ink-300)' }} />
                </button>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Btn block kind="ghost" onClick={signingOut ? undefined : onLogout} disabled={signingOut} style={{ color: '#B01F1F', borderColor: 'var(--danger-soft)' }}>
        <LogOut size={16} /> {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
      </Btn>

      <div className="text-center text-[11px] font-semibold mt-2" style={{ color: 'var(--ink-400)' }}>Contabilízate · Hecho con cariño en México</div>
    </div>
  )
}

// ============ DIAGNÓSTICO ============
function DiagnosticoScreen({ rfc, go }: { rfc: string | null; go: (s: Screen) => void }) {
  const hasCsf = Boolean(rfc && rfc.length >= 12)
  if (!hasCsf) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        <strong>¿Qué es un diagnóstico fiscal?</strong> Es un análisis de tu situación con el SAT. Te decimos qué está bien, qué hay que arreglar y dónde puedes ahorrar.
      </HelpBox>

      {/* Resumen general */}
      <div className="rounded-3xl p-7 lg:p-8" style={{ background: 'linear-gradient(160deg,#FFFAF4 0%,#FFF1E6 100%)', border: '1px solid var(--coral-soft)' }}>
        <Pill kind="coral"><AlertCircle size={14} /> Requiere atención</Pill>
        <div className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]" style={DISPLAY}>
          Tu situación fiscal está <span style={{ color: '#9E3A15' }}>regular</span>
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed max-w-[600px]" style={{ color: 'var(--ink-700)' }}>
          Revisamos tus últimas 9 facturas y 3 declaraciones. La buena noticia: podrías ahorrar <strong>$8,760 MXN</strong> con unos ajustes simples.
        </div>
        <div className="flex flex-wrap gap-3 mt-6">
          <Btn kind="brand" size="lg"><Zap size={18} /> Empezar a regularizar</Btn>
          <Btn kind="ghost" size="lg" onClick={() => go('ayuda')}><HelpCircle size={18} /> No entiendo qué significa</Btn>
        </div>
      </div>

      {/* Números simples */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Tu año en números</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Lo que el SAT sabe de ti hasta hoy.</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStat label="Ingresos" value="$336K" hint="Lo que has reportado este año" />
          <SummaryStat label="Gastos" value="$112K" hint="33% de tus ingresos" />
          <SummaryStat label="Facturas emitidas" value="24" hint="2 aún sin cobrar" />
          <SummaryStat label="Pendientes" value="5" hint="Declaraciones por presentar" tone="warn" />
        </div>
      </div>

      {/* Adeudos en lenguaje simple */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Lo que debes al SAT</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>$4,850 MXN en total. Te ayudamos a regularizarte mes por mes.</div>
        <Card>
          <div>
            {['Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026', 'Marzo 2026'].map((m, i, arr) => (
              <div key={m}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}><Calendar size={20} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{m}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Impuestos sin pagar</div>
                  </div>
                  <div className="text-[14.5px] font-extrabold" style={MONO}>$970</div>
                  <Badge kind="amber">Pendiente</Badge>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Oportunidades */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>💡 Dónde puedes ahorrar</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Cosas que probablemente no estás aprovechando.</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { t: 'Deducciones personales', a: '+$3,100', d: 'Gastos médicos, colegiaturas y donativos pueden bajar tus impuestos.' },
            { t: 'Gastos de tu actividad', a: '+$4,100', d: 'Gasolina, mantenimiento y teléfono que usas para trabajar.' },
            { t: 'Revisión de retenciones', a: '+$1,560', d: 'Verifica que las plataformas estén reteniendo lo correcto.' },
          ].map(o => (
            <div key={o.t} className="rounded-3xl p-5" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
              <div className="flex items-center justify-between mb-2"><div className="font-bold text-[14.5px]" style={{ color: 'var(--brand-900)' }}>{o.t}</div><Badge kind="brand">{o.a}</Badge></div>
              <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>{o.d}</div>
            </div>
          ))}
        </div>
      </div>

      <VideoSlot title="¿Cómo se calcula mi diagnóstico fiscal?" duration="3 min" />
    </div>
  )
}

// ============ APRENDE ============
const APRENDE_TIPS = [
  { id: 'gasolina', cat: 'Fiscal', kind: 'brand' as const, icon: Zap, t: 'Deduce gasolina y mantenimiento', d: 'Si usas tu auto para trabajar, estos gastos cuentan.' },
  { id: 'separa', cat: 'Financiero', kind: 'sky' as const, icon: PiggyBank, t: 'Separa el 14% para impuestos', d: 'Una cuenta aparte para no batallar al pagar.' },
  { id: 'plataformas', cat: 'Plataformas', kind: 'amber' as const, icon: Receipt, t: 'Plataformas retienen ISR e IVA', d: 'Uber, Rappi, Didi… aún así debes declarar.' },
  { id: 'cetes', cat: 'Inversión', kind: 'violet' as const, icon: TrendingUp, t: 'Los CETES rinden 7.58% al año', d: 'Una forma segura de hacer crecer tu dinero.' },
  { id: 'antes17', cat: 'Fiscal', kind: 'coral' as const, icon: Calendar, t: 'Presenta antes del día 17', d: 'Después hay recargos y multas. Vale la pena.' },
  { id: 'tarjeta', cat: 'Deducciones', kind: 'amber' as const, icon: Lightbulb, t: 'Paga con tarjeta gastos de más de $2,000', d: 'En efectivo el SAT no los acepta como deducibles.' },
  { id: 'regla', cat: 'Financiero', kind: 'sky' as const, icon: Target, t: 'La regla 50/30/20', d: 'Cómo dividir tu ingreso: necesidades, gustos, ahorro.' },
  { id: 'afore', cat: 'Ahorro', kind: 'violet' as const, icon: PiggyBank, t: 'Aporta a tu Afore y paga menos ISR', d: 'Hasta el 10% de lo que ganas al año.' },
]
const APRENDE_FILTERS = ['Todos', 'Fiscal', 'Financiero', 'Plataformas', 'Deducciones', 'Ahorro', 'Inversión']

function AprendeScreen({ go }: { go: (s: Screen) => void }) {
  const [filter, setFilter] = useState(0)
  const filterName = APRENDE_FILTERS[filter]
  const tips = filter === 0 ? APRENDE_TIPS : APRENDE_TIPS.filter(t => t.cat === filterName)

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      {/* Hero personalizado */}
      <div className="rounded-3xl p-7 lg:p-8" style={{ background: 'linear-gradient(140deg,#F4F2F9 0%,#E8E5F1 100%)', border: '1px solid var(--border)' }}>
        <Pill kind="ink">Hecho para ti</Pill>
        <div className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[640px]" style={DISPLAY}>
          3 cosas que conviene saber antes del 17
        </div>
        <div className="text-[14.5px] mt-3 leading-relaxed max-w-[560px]" style={{ color: 'var(--ink-700)' }}>
          Lecciones cortas, en lenguaje claro, pensadas para tu situación particular.
        </div>
        <div className="mt-5">
          <Btn kind="primary" size="lg" onClick={() => go('tip-detail')}><PlayCircle size={18} /> Empezar lección · 4 min</Btn>
        </div>
      </div>

      <HelpBox>
        Cada lección dura entre 2 y 5 minutos. Puedes leerlas, verlas en video, o preguntar dudas a tu contador al final.
      </HelpBox>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Tabs items={APRENDE_FILTERS} active={filter} onChange={setFilter} />
      </div>

      {/* Tarjetas */}
      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>Lecciones disponibles</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map(tip => (
            <button
              key={tip.id}
              onClick={() => go('tip-detail')}
              className="rounded-3xl p-5 text-left flex flex-col gap-3 transition hover:translate-y-[-2px]"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={iconBg(tip.kind)}>
                  <tip.icon size={20} />
                </div>
                <Badge kind={badgeKindFor(tip.kind)}>{tip.cat}</Badge>
              </div>
              <div>
                <div className="font-bold text-[15px] leading-tight">{tip.t}</div>
                <div className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>{tip.d}</div>
              </div>
              <div className="text-[12.5px] font-bold flex items-center gap-1 mt-auto" style={{ color: 'var(--brand-700)' }}>
                Ver lección <ChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>
        {tips.length === 0 && (
          <div className="rounded-2xl p-5 text-center text-[13.5px]" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
            No hay lecciones de esta categoría todavía. Pronto agregamos más.
          </div>
        )}
      </div>

      {/* Videos sugeridos */}
      <div>
        <div className="text-[15px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>🎬 También en video</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="¿Qué impuestos pago si trabajo por mi cuenta?" duration="4 min" />
          <VideoSlot title="Cómo separar tus finanzas personales del negocio" duration="3 min" />
        </div>
      </div>
    </div>
  )
}

function iconBg(kind: 'brand' | 'sky' | 'amber' | 'violet' | 'coral'): React.CSSProperties {
  const map: Record<string, React.CSSProperties> = {
    brand: { background: 'var(--brand-50)', color: 'var(--brand-700)' },
    sky: { background: '#DDEBFF', color: '#1C4C96' },
    amber: { background: 'var(--amber-soft)', color: '#7B5312' },
    violet: { background: '#E6E1FF', color: '#403A8D' },
    coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
  }
  return map[kind]
}
function badgeKindFor(kind: 'brand' | 'sky' | 'amber' | 'violet' | 'coral'): 'brand' | 'amber' | 'coral' | 'default' {
  if (kind === 'brand') return 'brand'
  if (kind === 'amber') return 'amber'
  if (kind === 'coral') return 'coral'
  return 'default'
}

// ============ TIP DETAIL ============
function TipDetailScreen({ go }: { go: (s: Screen) => void }) {
  return (
    <div className="flex flex-col gap-5 max-w-[820px]">
      <button onClick={() => go('aprende')} className="inline-flex items-center gap-1.5 text-[13px] font-bold w-fit" style={{ color: 'var(--ink-500)' }}>
        <ChevronLeft size={16} /> Volver a lecciones
      </button>

      <div className="flex gap-2 flex-wrap">
        <Badge kind="brand">Fiscal</Badge>
        <Badge>4 min de lectura</Badge>
      </div>

      <div className="text-[32px] lg:text-[42px] font-extrabold tracking-tight leading-tight" style={DISPLAY}>
        Deduce gasolina, mantenimiento y seguro
      </div>
      <div className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
        Si usas tu auto para trabajar (por ejemplo en Uber, Didi, Rappi o repartos), estos gastos pueden bajar lo que pagas de impuestos. Te lo explicamos paso a paso.
      </div>

      <VideoSlot title="Mira esta lección en video" duration="4 min" />

      {/* Paso 1 */}
      <Card>
        <div className="p-5 lg:p-6">
          <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>Paso 1</div>
          <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Qué cosas puedes deducir</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
            {['Gasolina y diesel', 'Refacciones y mantenimiento', 'Seguro de auto', 'Verificación y tenencia'].map(x => (
              <div key={x} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} color="var(--brand-500)" />
                <span className="text-[14px]">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Paso 2 */}
      <Card>
        <div className="p-5 lg:p-6">
          <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>Paso 2</div>
          <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Qué necesitas conservar</div>
          <div className="text-[14px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Pide siempre <strong>factura a tu nombre</strong>. Si el gasto pasa de $2,000 MXN, paga con tarjeta o transferencia (no en efectivo, porque entonces no cuenta).
          </div>
        </div>
      </Card>

      {/* Error común */}
      <div className="rounded-3xl p-5 lg:p-6" style={{ background: 'var(--coral-soft)', border: '1px solid rgba(255,136,98,0.35)' }}>
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: '#9E3A15' }}>Error común</div>
        <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>Pagar gasolina en efectivo</div>
        <div className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B2512' }}>
          Si pagas con efectivo, el SAT no te lo acepta como deducible. Usa tarjeta o monedero electrónico de gasolinera.
        </div>
      </div>

      {/* Impacto */}
      <div className="rounded-3xl p-6 text-white" style={{ background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', boxShadow: 'var(--sh-brand)' }}>
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>Lo que esto significa para ti</div>
        <div className="text-[40px] lg:text-[48px] font-extrabold tracking-tight leading-none mt-2" style={DISPLAY}>$4,100</div>
        <div className="text-[13.5px] mt-1.5" style={{ color: 'rgba(255,255,255,0.9)' }}>de ahorro estimado al año, según tus ingresos actuales</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Btn kind="ghost" size="lg" block><CheckCircle2 size={18} /> Me sirvió</Btn>
        <Btn kind="primary" size="lg" block><MessageCircle size={18} /> Tengo una duda</Btn>
      </div>
    </div>
  )
}

// ============ TRÁMITES ============
function TramitesScreen() {
  const tramitesSat = [
    { Icon: MapPin, t: 'Cambio de domicilio fiscal', s: 'Si te mudaste, hay que avisarle al SAT' },
    { Icon: Calendar, t: 'Agendar cita en el SAT', s: 'Para trámites que requieren ir en persona' },
    { Icon: Key, t: 'Sellos digitales (CSD)', s: 'Necesarios para emitir facturas' },
    { Icon: RefreshCcw, t: 'Actualizar tu régimen', s: 'Si cambiaste de actividad' },
  ]
  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí están los trámites <strong>extra</strong> que puedes contratar cuando los necesites. Los que ya vienen incluidos en tu plan dicen <em>“Incluido”</em> y no te cobramos nada extra.
      </HelpBox>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Trámites con el SAT</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Nosotros los hacemos por ti, sin que tengas que ir a una oficina.</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tramitesSat.map((x, i) => (
            <div key={x.t} className="rounded-3xl p-5 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}>
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                  <x.Icon size={20} />
                </div>
                <Badge kind="brand">Incluido</Badge>
              </div>
              <div>
                <div className="font-bold text-[15px]">{x.t}</div>
                <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>{x.s}</div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[12px] font-semibold line-through" style={{ color: 'var(--ink-400)' }}>${[300, 200, 300, 300][i]}</span>
                <Btn size="sm" kind="ghost">Solicitar</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Declaraciones extras</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Estas no vienen en tu plan mensual y se cobran por separado.</div>
        <Card>
          <div>
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Declaración complementaria mensual</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Para corregir un mes que ya presentaste</div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>$218.90</span>
              <Btn size="sm" kind="ghost">Contratar</Btn>
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-4" style={{ background: 'var(--brand-50)' }}>
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--card)', color: 'var(--brand-700)' }}><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Declaración anual</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-700)' }}>El reporte anual de todo tu año fiscal</div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>$934.00</span>
              <Btn size="sm" kind="brand">Contratar</Btn>
            </div>
            <Divider />
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--amber-soft)', color: '#7B5312' }}><FileText size={20} /></div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[14.5px]">Anual complementaria</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Si tu declaración anual tuvo un error</div>
              </div>
              <span className="text-[14.5px] font-extrabold mr-1" style={MONO}>$1,276.00</span>
              <Btn size="sm" kind="ghost">Contratar</Btn>
            </div>
          </div>
        </Card>
      </div>

      <div className="rounded-3xl p-5" style={{ background: '#F7F8FB', border: '1px solid var(--border)' }}>
        <div className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-500)' }}>
          Todos los precios incluyen IVA. La declaración anual no se incluye en el plan mensual y se cobra una vez al año.
        </div>
      </div>
    </div>
  )
}

// ============ MI PLAN ============
function PlanScreen() {
  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí ves tu suscripción, qué tienes incluido y cómo cambiar de plan. Si quieres cancelar o pausar, también lo haces desde aquí.
      </HelpBox>

      {/* Plan actual */}
      <div className="rounded-3xl p-7 lg:p-8 text-white" style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}>
        <Pill kind="coral">Tu plan actual</Pill>
        <div className="text-[44px] lg:text-[56px] font-extrabold tracking-tight leading-none mt-4" style={DISPLAY}>Platinum</div>
        <div className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>Pago mensual · se renueva el 28 de abril 2026</div>
        <div className="mt-5 pt-5 flex items-center justify-between flex-wrap gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <div>
            <div className="text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>Próximo cargo</div>
            <div className="text-[32px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
              $470<span className="text-[18px]" style={{ color: 'rgba(255,255,255,0.6)' }}>.25</span>
            </div>
            <div className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>Pesos · IVA incluido</div>
          </div>
          <Btn size="md" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>Cambiar método de pago</Btn>
        </div>
      </div>

      {/* Qué incluye */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Lo que incluye tu plan</div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>Todo esto ya está cubierto sin que pagues extra.</div>
        <Card>
          <div>
            {[
              { i: Sparkles, t: '6 declaraciones al mes con apoyo de IA', s: 'Llevas 2 usadas este mes' },
              { i: FileText, t: '300 facturas (CFDI) por semestre', s: 'Has emitido 24' },
              { i: MessageCircle, t: 'Chat ilimitado con tu contador', s: 'Te responden en menos de 2 horas' },
              { i: Lock, t: 'Monitoreo de listas negras del SAT', s: 'Vigilamos tu RFC todo el día' },
              { i: Stethoscope, t: 'Diagnóstico fiscal con IA', s: 'Te avisamos cuando puedes ahorrar' },
            ].map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
                    <it.i size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{it.s}</div>
                  </div>
                  <Check size={18} color="var(--brand-500)" />
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Ahorro semestral */}
      <div className="rounded-3xl p-6 lg:p-7" style={{ background: 'linear-gradient(160deg,var(--coral-soft) 0%,#FFFAF4 100%)', border: '1px solid rgba(255,136,98,0.35)' }}>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <Badge kind="coral">Te ahorras 47%</Badge>
        </div>
        <div className="text-[26px] font-extrabold tracking-tight" style={DISPLAY}>¿Y si pagas 6 meses de una vez?</div>
        <div className="text-[14px] mt-2 max-w-[520px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
          En vez de pagar $470.25 cada mes (= $2,821.50 al semestre), pagas <strong>$1,495 una sola vez</strong> y olvidas el cargo por 6 meses.
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Btn kind="primary" size="lg">Cambiar a plan semestral</Btn>
          <Btn kind="ghost" size="lg">Comparar planes</Btn>
        </div>
      </div>

      <Btn block kind="ghost" style={{ color: '#B01F1F' }}>Cancelar mi suscripción</Btn>

      <VideoSlot title="¿Qué cubre cada plan?" duration="2 min" />
    </div>
  )
}

// ============ SAT CONNECT ============
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
      setError('Tu RFC debe tener entre 12 y 13 letras y números')
      return
    }
    if (authMethod === 'ciec' && !ciec.trim()) {
      setError('Escribe tu contraseña del SAT')
      return
    }
    if (authMethod === 'fiel' && (!cerFile || !keyFile || !fielPwd.trim())) {
      setError('Sube los archivos .cer, .key y la contraseña de tu e.Firma')
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
        setError(data.error || 'No pudimos conectar con el SAT. Revisa tus datos e inténtalo otra vez.')
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos conectar con el SAT')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-[720px]">
      <HelpBox>
        Necesitamos tu permiso para conectarnos al SAT en tu nombre. Tus datos se guardan cifrados y solo los usamos para descargar tus facturas y constancia.
      </HelpBox>

      <Card>
        <div className="p-6 lg:p-7">
          <div className="text-[22px] font-extrabold tracking-tight" style={DISPLAY}>¿Cómo quieres conectarte?</div>
          <div className="text-[13.5px] mt-1.5" style={{ color: 'var(--ink-500)' }}>Elige una opción. Si no estás seguro, te recomendamos la primera.</div>

          {error && (
            <div className="rounded-2xl p-3.5 mt-4 text-[13px] font-semibold flex items-start gap-2.5" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                { id: 'ciec' as const, title: 'Con mi contraseña del SAT', desc: 'La que usas para entrar al portal del SAT. (CIEC)', icon: <Lock size={22} />, recommended: true },
                { id: 'fiel' as const, title: 'Con mi e.Firma', desc: 'Si tienes los archivos .cer y .key', icon: <FileDown size={22} /> },
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
                      <div className="text-[14px] font-extrabold leading-tight flex items-center gap-2">
                        {m.title}
                        {m.recommended && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: active ? 'var(--brand-300)' : 'var(--brand-100)', color: active ? 'var(--ink-900)' : 'var(--brand-900)' }}>Recomendado</span>}
                      </div>
                      <div className="text-[12px] mt-1" style={{ color: active ? 'rgba(255,255,255,0.7)' : 'var(--muted-foreground)' }}>{m.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-bold">Tu RFC</label>
              <input
                type="text"
                value={rfc}
                onChange={e => setRfc(e.target.value.toUpperCase())}
                placeholder="Ej. PEMA800101AB1"
                maxLength={13}
                required
                className="w-full px-4 py-3.5 rounded-xl text-[15px] font-semibold uppercase outline-none transition-all"
                style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
              />
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Son las 12 o 13 letras y números que el SAT te asignó.</p>
            </div>

            {authMethod === 'ciec' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[14px] font-bold">Tu contraseña del SAT (CIEC)</label>
                <div className="relative">
                  <input
                    type={showCiec ? 'text' : 'password'}
                    value={ciec}
                    onChange={e => setCiec(e.target.value)}
                    placeholder="La contraseña que usas para entrar al SAT"
                    required
                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-[15px] font-semibold outline-none"
                    style={{ background: 'var(--muted)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
                  />
                  <button type="button" onClick={() => setShowCiec(!showCiec)} aria-label={showCiec ? 'Ocultar' : 'Mostrar'} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                    <Eye size={18} />
                  </button>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>🔒 Se guarda cifrada. No la vemos nunca en texto plano.</p>
              </div>
            )}

            {authMethod === 'fiel' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-bold">Archivo del certificado (.cer)</label>
                  <input type="file" accept=".cer" onChange={e => setCerFile(e.target.files?.[0] ?? null)} className="text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-bold">Archivo de la llave privada (.key)</label>
                  <input type="file" accept=".key" onChange={e => setKeyFile(e.target.files?.[0] ?? null)} className="text-[13px] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:font-bold file:cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[14px] font-bold">Contraseña de tu e.Firma</label>
                  <div className="relative">
                    <input type={showFielPwd ? 'text' : 'password'} value={fielPwd} onChange={e => setFielPwd(e.target.value)} placeholder="Contraseña de la llave privada" required className="w-full px-4 py-3.5 pr-12 rounded-xl text-[15px] font-semibold outline-none" style={{ background: 'var(--muted)', border: '1.5px solid var(--border)' }} />
                    <button type="button" onClick={() => setShowFielPwd(!showFielPwd)} aria-label={showFielPwd ? 'Ocultar' : 'Mostrar'} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }}>
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}

            <Btn type="submit" kind="brand" size="lg" block disabled={loading}>
              {loading ? 'Conectando…' : <>Conectar con el SAT <ArrowRight size={18} /></>}
            </Btn>
          </form>
        </div>
      </Card>

      <VideoSlot title="¿Dónde encuentro mi contraseña del SAT?" duration="2 min" />
      <VideoSlot title="¿Qué pasa después de conectarme?" duration="1 min" />
    </div>
  )
}
