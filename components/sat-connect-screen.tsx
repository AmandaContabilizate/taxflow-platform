'use client'

import { useState, type ReactNode, type ComponentType } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, ChevronRight, Eye, FileDown, Lightbulb, Lock, PlayCircle } from 'lucide-react'
import { updateCiec } from '@/features/taxpayers/actions/updateCiec.action'

// ── Shared primitives (mirrored from dashboard) ──────────────────────────────

const DISPLAY = { fontFamily: 'var(--font-display)' } as const

function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}>
      {children}
    </div>
  )
}

function Btn({ children, kind = 'primary', size = 'md', onClick, block, type, disabled }: {
  children: ReactNode
  kind?: 'primary' | 'brand' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  block?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const padding = size === 'lg' ? 'px-7 py-4 text-[16px] min-h-[56px]' : 'px-5 py-3.5 text-[15px] min-h-[48px]'
  const stylesByKind: Record<string, React.CSSProperties> = {
    primary: { background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--sh-ink)' },
    brand: { background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
    ghost: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong)' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60 ${padding} ${block ? 'w-full' : ''}`}
      style={stylesByKind[kind]}
    >
      {children}
    </button>
  )
}

function HelpBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--helpbox-bg)', border: '1px solid var(--helpbox-border)' }}>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--helpbox-accent-bg)', color: 'var(--helpbox-text)' }}>
        <Lightbulb size={16} />
      </div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--helpbox-text)' }}>{children}</div>
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

// ── SatConnectScreen ──────────────────────────────────────────────────────────

interface SatConnectScreenProps {
  rfc?: string | null
}

export default function SatConnectScreen({ rfc: initialRfc }: SatConnectScreenProps = {}) {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'ciec' | 'fiel'>('ciec')
  const [rfc, setRfc] = useState(initialRfc ?? '')
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
    const rfcClean = rfc.trim().toUpperCase()
    if (rfcClean.length < 12 || rfcClean.length > 13) {
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
      // if (authMethod === 'ciec') {
      const res = await updateCiec({ rfc: rfcClean, satPassword: ciec })
      console.log(res);
      if (!res.success) {
        setError(res.error.message || 'No pudimos conectar con el SAT. Revisa tus datos e inténtalo otra vez.')
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
                      background: active ? 'var(--nav-active-bg)' : 'var(--muted)',
                      border: active ? '2px solid var(--nav-active-bg)' : '2px solid transparent',
                      color: active ? 'var(--nav-active-fg)' : 'var(--foreground)',
                      boxShadow: active ? 'var(--sh-ink)' : 'none',
                    }}
                  >
                    <span style={{ color: active ? 'var(--brand-400)' : 'var(--muted-foreground)' }}>{m.icon}</span>
                    <div>
                      <div className="text-[14px] font-extrabold leading-tight flex items-center gap-2">
                        {m.title}
                        {m.recommended && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full" style={{ background: active ? 'var(--brand-300)' : 'var(--brand-100)', color: 'var(--brand-900)' }}>
                            Recomendado
                          </span>
                        )}
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
              {loading ? 'Conectando…' : <><span>Conectar con el SAT</span> <ArrowRight size={18} /></>}
            </Btn>
          </form>
        </div>
      </Card>

      <VideoSlot title="¿Dónde encuentro mi contraseña del SAT?" duration="2 min" />
      <VideoSlot title="¿Qué pasa después de conectarme?" duration="1 min" />
    </div>
  )
}
