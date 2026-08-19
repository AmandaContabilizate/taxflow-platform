'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PROTECTED_ROUTES } from '@/lib/routes'
import { createTaxpayerByCiec } from '@/features/taxpayers/actions/createTaxpayerByCiec.action'
import { createTaxpayerByEfirma } from '@/features/taxpayers/actions/createTaxpayerByEfirma.action'

interface Props {
  existingRfc?: string
  onComplete: () => void
}

type AuthMethod = 'ciec' | 'fiel'

export default function SatCredentialsForm({ existingRfc, onComplete }: Props) {
  const router = useRouter()

  // CIEC y e.Firma son dos formas de llenar el MISMO formulario — cambiar de
  // método nunca debe avanzar/retroceder de pantalla.
  function handleMethodChange(method: AuthMethod) {
    setAuthMethod(method)
    setError(null)
  }
  const [authMethod, setAuthMethod] = useState<AuthMethod>('ciec')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [rfc, setRfc] = useState(existingRfc ?? '')
  const [ciec, setCiec] = useState('')
  const [showCiec, setShowCiec] = useState(false)

  const cerRef = useRef<HTMLInputElement>(null)
  const keyRef = useRef<HTMLInputElement>(null)
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [fielPassword, setFielPassword] = useState('')

  async function handleRfcCiec(e: React.FormEvent) {
    e.preventDefault()
    if (!rfc.trim() || !ciec.trim()) return
    if (rfc.length < 12 || rfc.length > 13) {
      setError('El RFC debe tener entre 12 y 13 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    const res = await createTaxpayerByCiec({ rfc: rfc.toUpperCase(), ciec })
    setLoading(false)
    if (!res.success) {
      setError(
        res.error.errorCode === 'INVALID_CIEC'
          ? 'La contraseña CIEC es incorrecta. Vuelve a ingresarla.'
          : res.error.message,
      )
      return
    }
    onComplete()
  }

  async function handleFiel(e: React.FormEvent) {
    e.preventDefault()
    if (rfc.length < 12 || rfc.length > 13) {
      setError('El RFC debe tener entre 12 y 13 caracteres')
      return
    }
    if (!cerFile) {
      setError('Por favor selecciona tu certificado (.cer)')
      return
    }
    if (!keyFile) {
      setError('Por favor selecciona tu clave privada (.key)')
      return
    }
    if (!fielPassword.trim()) {
      setError('Por favor ingresa la contraseña de tu clave privada')
      return
    }
    setLoading(true)
    setError(null)
    const res = await createTaxpayerByEfirma({
      rfc: rfc.toUpperCase(),
      cerFile,
      keyFile,
      authSecret: fielPassword,
    })
    setLoading(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    onComplete()
  }

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-3 mb-4 text-sm font-semibold"
          style={{ background: '#FCDCDC', color: 'var(--destructive)' }}
        >
          {error}
        </div>
      )}

      <form onSubmit={authMethod === 'ciec' ? handleRfcCiec : handleFiel} className="flex flex-col gap-4">
        <div>
          <h2
            className="text-xl font-black mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
          >
            Acceso al SAT
          </h2>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Elige cómo quieres conectar tu cuenta del SAT
          </p>
        </div>

        {/* Method selector */}
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              id: 'ciec' as AuthMethod,
              title: 'Con CIEC',
              desc: 'Contraseña del portal del SAT',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              ),
            },
            {
              id: 'fiel' as AuthMethod,
              title: 'Con e.Firma',
              desc: 'Certificado .cer y llave .key',
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
              ),
            },
          ] as const).map((m) => {
            const active = authMethod === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMethodChange(m.id)}
                className="flex flex-col items-start gap-2 p-4 rounded-2xl text-left transition-all"
                style={{
                  background: active ? 'var(--ink-900)' : 'var(--muted)',
                  border: active ? '2px solid var(--ink-700)' : '2px solid transparent',
                  color: active ? '#fff' : 'var(--foreground)',
                  boxShadow: active ? '0 4px 20px rgba(34,17,88,0.20)' : 'none',
                }}
              >
                <span style={{ color: active ? 'var(--brand-400)' : 'var(--muted-foreground)' }}>
                  {m.icon}
                </span>
                <div>
                  <p className="text-sm font-black leading-tight">{m.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: active ? 'rgba(255,255,255,0.65)' : 'var(--muted-foreground)' }}>
                    {m.desc}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* RFC field — always shown */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>RFC</label>
          <input
            type="text"
            value={rfc}
            onChange={e => setRfc(e.target.value.toUpperCase())}
            placeholder="XAXX010101000"
            maxLength={13}
            required
            className="w-full px-4 py-3 rounded-xl text-sm font-semibold uppercase outline-none transition-all"
            style={{
              background: 'var(--muted)',
              border: '1.5px solid var(--border)',
              color: 'var(--foreground)',
            }}
          />
        </div>

        {/* CIEC field — only when method is ciec */}
        {authMethod === 'ciec' && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Contraseña CIEC
            </label>
            <div className="relative">
              <input
                type={showCiec ? 'text' : 'password'}
                value={ciec}
                onChange={e => setCiec(e.target.value)}
                placeholder="Tu contraseña del SAT"
                required
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-semibold outline-none transition-all"
                style={{
                  background: 'var(--muted)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                type="button"
                onClick={() => setShowCiec(!showCiec)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {showCiec ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
              Tu CIEC se transmite cifrada y nunca se almacena en texto plano
            </p>
          </div>
        )}

        {/* Campos FIEL — solo cuando el método es fiel */}
        {authMethod === 'fiel' && (
          <>
            {/* Certificado (.cer) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                Certificado (.cer)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={cerFile ? cerFile.name : ''}
                  placeholder="Selecciona tu archivo .cer"
                  onClick={() => cerRef.current?.click()}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none cursor-pointer transition-all"
                  style={{
                    background: 'var(--muted)',
                    border: '1.5px solid var(--border)',
                    color: cerFile ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                />
                <input ref={cerRef} type="file" accept=".cer" className="hidden" onChange={e => setCerFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => cerRef.current?.click()}
                  className="px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
                  style={{
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1.5px solid var(--border)',
                  }}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Clave privada (.key) */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                Clave privada (.key)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={keyFile ? keyFile.name : ''}
                  placeholder="Selecciona tu archivo .key"
                  onClick={() => keyRef.current?.click()}
                  className="flex-1 px-4 py-3 rounded-xl text-sm outline-none cursor-pointer transition-all"
                  style={{
                    background: 'var(--muted)',
                    border: '1.5px solid var(--border)',
                    color: keyFile ? 'var(--foreground)' : 'var(--muted-foreground)',
                  }}
                />
                <input ref={keyRef} type="file" accept=".key" className="hidden" onChange={e => setKeyFile(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => keyRef.current?.click()}
                  className="px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap"
                  style={{
                    background: 'var(--card)',
                    color: 'var(--foreground)',
                    border: '1.5px solid var(--border)',
                  }}
                >
                  Buscar
                </button>
              </div>
            </div>

            {/* Contraseña de clave privada */}
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1.5 text-sm font-bold" style={{ color: 'var(--foreground)' }}>
                Contraseña de clave privada
                <span
                  title="Es la contraseña que asignaste al generar tu e.Firma en el SAT"
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-black cursor-help select-none flex-shrink-0"
                  style={{ background: 'var(--ink-900)', color: '#fff', fontSize: '11px' }}
                >
                  ?
                </span>
              </label>
              <div className="relative">
                <input
                  type={showCiec ? 'text' : 'password'}
                  value={fielPassword}
                  onChange={e => setFielPassword(e.target.value)}
                  placeholder="Contraseña de tu e.Firma"
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm font-semibold outline-none transition-all"
                  style={{
                    background: 'var(--muted)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--foreground)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCiec(!showCiec)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-opacity opacity-50 hover:opacity-100"
                  style={{ color: 'var(--muted-foreground)' }}
                  aria-label={showCiec ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showCiec ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        <div
          className="flex items-start gap-3 p-3 rounded-xl"
          style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-700)" strokeWidth="2" className="mt-0.5 flex-shrink-0"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <p className="text-xs font-semibold" style={{ color: 'var(--brand-700)' }}>
            Tus credenciales están protegidas con cifrado AES-256. Solo se usan para consultar el SAT en tu nombre.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 mt-2"
          style={{ background: 'var(--ink-900)', color: '#fff' }}
        >
          {loading
            ? 'Verificando...'
            : authMethod === 'fiel'
            ? 'Subir e.Firma'
            : 'Continuar'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => router.push(PROTECTED_ROUTES.DASHBOARD)}
        className="w-full text-center text-sm font-bold mt-4 hover:underline"
        style={{ color: 'var(--muted-foreground)' }}
      >
        Dejar para después
      </button>
    </div>
  )
}
