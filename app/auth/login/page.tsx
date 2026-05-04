'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'login' | 'register'
type OAuthProvider = 'google' | 'facebook'
type LoadingState = OAuthProvider | 'email' | null

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState<LoadingState>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleOAuth(provider: OAuthProvider) {
    setLoading(provider)
    setError(null)
    const redirectTo =
      process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
      `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
    if (error) {
      setError(error.message)
      setLoading(null)
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading('email')
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message
      )
      setLoading(null)
      return
    }
    router.push('/onboarding')
  }

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    setLoading('email')
    setError(null)

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (signUpError) {
      setError(
        signUpError.message.includes('already registered')
          ? 'Este correo ya está registrado. Intenta iniciar sesión.'
          : signUpError.message
      )
      setLoading(null)
      return
    }

    // If Supabase returns a session directly (email confirmation disabled),
    // redirect right away. Otherwise sign in with password to force a session.
    if (signUpData.session) {
      router.push('/onboarding')
      return
    }

    // Attempt immediate sign-in so the user doesn't need to confirm email
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // Confirmation email required — tell user clearly
      setSuccess('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.')
      setLoading(null)
      setTab('login')
      return
    }

    router.push('/onboarding')
  }

  const busy = loading !== null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel — decorative (dark blue/ink-900) */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-[420px] flex-shrink-0"
        style={{ background: 'var(--ink-900)' }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-16">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-500)' }}
            >
              <span
                className="text-lg font-black text-white"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                C
              </span>
            </div>
            <span
              className="text-base font-black text-white"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Contabilízate
            </span>
          </div>

          <h2
            className="text-3xl font-black text-white leading-tight mb-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tu contador fiscal con IA
          </h2>
          <p className="text-sm font-semibold mb-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Gestiona tus impuestos, declaraciones y cumplimiento fiscal de forma automática.
          </p>

          {/* Benefits */}
          <div className="flex flex-col gap-4">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Beneficios
            </p>
            {[
              { icon: '✓', text: 'Conexión segura con el SAT' },
              { icon: '⚡', text: 'Declaraciones automáticas' },
              { icon: '📊', text: 'Dashboard en tiempo real' },
              { icon: '🔒', text: 'Tus datos protegidos' },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 benefit-item animate-slide-in-left"
                style={{ opacity: 0 }}
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-sm flex-shrink-0 font-bold"
                  style={{ background: 'rgba(14,209,138,0.15)', color: 'var(--brand-400)' }}
                >
                  {item.icon}
                </span>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div>
          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Confían en nosotros miles de emprendedores en México
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="rounded-3xl p-8 shadow-2xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

          {/* Logo — desktop hidden */}
          <div className="lg:hidden flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg" style={{ background: 'var(--ink-900)' }}>
              <span className="text-2xl font-black" style={{ color: 'var(--brand-400)' }}>C</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--foreground)' }}>
              Contabilízate
            </h1>
            <p className="text-sm mt-1 text-center" style={{ color: 'var(--muted-foreground)' }}>
              Tu contador fiscal con IA
            </p>
          </div>

          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-6" style={{ background: 'var(--muted)' }}>
            {(['login', 'register'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); setSuccess(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={
                  tab === t
                    ? { background: 'var(--card)', color: 'var(--foreground)', boxShadow: '0 1px 4px rgba(21,17,63,0.10)' }
                    : { background: 'transparent', color: 'var(--muted-foreground)' }
                }
              >
                {t === 'login' ? 'Iniciar sesión' : 'Registrarse'}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="rounded-xl p-3 mb-4 text-sm font-semibold text-center" style={{ background: '#FCDCDC', color: 'var(--destructive)' }}>
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-xl p-3 mb-4 text-sm font-semibold text-center" style={{ background: '#D6FAE8', color: 'var(--brand-700)' }}>
              {success}
            </div>
          )}

          {/* Email/password form */}
          <form onSubmit={tab === 'login' ? handleEmailLogin : handleEmailRegister} className="flex flex-col gap-3 mb-4">
            {tab === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Juan García López"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all disabled:opacity-60"
                  style={{
                    background: 'var(--muted)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                Correo electrónico
              </label>
              <input
                type="email"
                required
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all disabled:opacity-60"
                style={{
                  background: 'var(--muted)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold" style={{ color: 'var(--muted-foreground)' }}>
                Contraseña {tab === 'register' && <span className="font-normal opacity-70">(mínimo 8 caracteres)</span>}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                  className="w-full px-4 py-3 pr-12 rounded-2xl text-sm font-medium outline-none transition-all disabled:opacity-60"
                  style={{
                    background: 'var(--muted)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-opacity opacity-50 hover:opacity-100"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all duration-150 active:scale-95 disabled:opacity-60 mt-1"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                boxShadow: '0 4px 18px rgba(14,209,138,0.35)',
              }}
            >
              {loading === 'email' ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner light /> {tab === 'login' ? 'Entrando...' : 'Creando cuenta...'}
                </span>
              ) : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>O CONTINÚA CON</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          {/* OAuth Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleOAuth('google')}
              disabled={busy}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--card)', border: '1.5px solid var(--border)', color: 'var(--foreground)' }}
            >
              {loading === 'google' ? <Spinner /> : <GoogleIcon />}
              {loading === 'google' ? 'Conectando...' : 'Google'}
            </button>

            <button
              onClick={() => handleOAuth('facebook')}
              disabled={busy}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-2xl font-semibold text-sm transition-all duration-150 active:scale-95 disabled:opacity-60"
              style={{ background: '#1877F2', color: '#fff', border: 'none' }}
            >
              {loading === 'facebook' ? <Spinner light /> : <FacebookIcon />}
              {loading === 'facebook' ? 'Conectando...' : 'Facebook'}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-foreground)' }}>
            Al continuar aceptas nuestros{' '}
            <a href="#" style={{ color: 'var(--brand-600)' }} className="font-semibold hover:underline">Términos</a>{' '}
            y{' '}
            <a href="#" style={{ color: 'var(--brand-600)' }} className="font-semibold hover:underline">Privacidad</a>
          </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg
      className="animate-spin"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={light ? '#fff' : 'var(--ink-700)'}
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}
