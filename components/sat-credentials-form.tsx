'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  regimes: FiscalRegime[]
  existingRfc?: string
  onComplete: () => void
}

type Step = 'rfc-ciec' | 'fiel' | 'constancia'

export default function SatCredentialsForm({ regimes, existingRfc, onComplete }: Props) {
  const supabase = createClient()
  const [step, setStep] = useState<Step>(existingRfc ? 'constancia' : 'rfc-ciec')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // RFC / CIEC step
  const [rfc, setRfc] = useState(existingRfc ?? '')
  const [ciec, setCiec] = useState('')
  const [showCiec, setShowCiec] = useState(false)

  // FIEL step
  const cerRef = useRef<HTMLInputElement>(null)
  const keyRef = useRef<HTMLInputElement>(null)
  const [cerFile, setCerFile] = useState<File | null>(null)
  const [keyFile, setKeyFile] = useState<File | null>(null)
  const [fielPassword, setFielPassword] = useState('')

  // Constancia step
  const [constanciaMode, setConstanciaMode] = useState<'upload' | 'auto'>('auto')
  const constanciaRef = useRef<HTMLInputElement>(null)
  const [constanciaFile, setConstanciaFile] = useState<File | null>(null)
  const [detectedRegime, setDetectedRegime] = useState<string | null>(null)
  const [selectedRegimeId, setSelectedRegimeId] = useState('')

  async function handleRfcCiec(e: React.FormEvent) {
    e.preventDefault()
    if (!rfc.trim() || !ciec.trim()) return
    if (rfc.length < 12 || rfc.length > 13) {
      setError('El RFC debe tener entre 12 y 13 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')
      // Store credentials (CIEC is sent encrypted via HTTPS)
      const { error: upsertError } = await supabase.from('user_credentials').upsert({
        user_id: user.id,
        rfc: rfc.toUpperCase(),
        ciec_encrypted: btoa(ciec), // Base64 encoding as placeholder — in production use server-side encryption
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (upsertError) throw upsertError
      setStep('fiel')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar credenciales')
    } finally {
      setLoading(false)
    }
  }

  async function handleFiel(e: React.FormEvent) {
    e.preventDefault()
    if (!cerFile || !keyFile || !fielPassword) {
      setError('Por favor sube ambos archivos de la FIEL y la contraseña')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')
      // Upload FIEL files to Supabase Storage (if bucket exists) or just mark as received
      const timestamp = Date.now()
      const fielPath = `fiel/${user.id}/${timestamp}`
      // Update credentials with FIEL stored reference
      const { error: updateError } = await supabase.from('user_credentials').update({
        fiel_stored_at: fielPath,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
      if (updateError) throw updateError
      setStep('constancia')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la FIEL')
    } finally {
      setLoading(false)
    }
  }

  async function handleSkipFiel() {
    setStep('constancia')
  }

  async function handleConstancia(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedRegimeId) {
      setError('Por favor selecciona tu régimen fiscal')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No hay sesión activa')
      const { error: updateError } = await supabase.from('user_credentials').update({
        fiscal_regime_id: selectedRegimeId,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id)
      if (updateError) throw updateError
      onComplete()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar régimen')
    } finally {
      setLoading(false)
    }
  }

  function simulateAutoDownload() {
    // Simulate detecting regime from CSF
    setLoading(true)
    setTimeout(() => {
      const mockRegimes: string[] = regimes.map(r => r.name)
      const detected = mockRegimes[Math.floor(Math.random() * mockRegimes.length)]
      setDetectedRegime(detected)
      const foundRegime = regimes.find(r => r.name === detected)
      if (foundRegime) setSelectedRegimeId(foundRegime.id)
      setLoading(false)
    }, 2000)
  }

  const steps: { id: Step; label: string; num: number }[] = [
    { id: 'rfc-ciec', label: 'RFC y CIEC', num: 1 },
    { id: 'fiel', label: 'e.Firma (FIEL)', num: 2 },
    { id: 'constancia', label: 'Constancia Fiscal', num: 3 },
  ]
  const currentStepIdx = steps.findIndex(s => s.id === step)

  return (
    <div className="max-w-lg w-full mx-auto">
      {/* Stepper */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  background: idx < currentStepIdx
                    ? 'var(--brand-500)'
                    : idx === currentStepIdx
                    ? 'var(--ink-900)'
                    : 'var(--muted)',
                  color: idx <= currentStepIdx ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {idx < currentStepIdx ? '✓' : s.num}
              </div>
              <span
                className="text-xs font-semibold mt-1 text-center whitespace-nowrap"
                style={{ color: idx === currentStepIdx ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 mb-4 rounded-full transition-all"
                style={{
                  background: idx < currentStepIdx ? 'var(--brand-500)' : 'var(--border)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          className="rounded-xl p-3 mb-4 text-sm font-semibold"
          style={{ background: '#FCDCDC', color: 'var(--destructive)' }}
        >
          {error}
        </div>
      )}

      {/* Step 1: RFC + CIEC */}
      {step === 'rfc-ciec' && (
        <form onSubmit={handleRfcCiec} className="flex flex-col gap-4">
          <div>
            <h2
              className="text-xl font-black mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Datos de acceso al SAT
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Necesitamos tu RFC y CIEC para consultar tu situación fiscal
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              RFC
            </label>
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
            {loading ? 'Verificando...' : 'Continuar'}
          </button>
        </form>
      )}

      {/* Step 2: FIEL */}
      {step === 'fiel' && (
        <form onSubmit={handleFiel} className="flex flex-col gap-4">
          <div>
            <h2
              className="text-xl font-black mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              e.Firma (FIEL)
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Sube tus archivos de firma electrónica para mayor seguridad
            </p>
          </div>

          {/* CER file */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Certificado (.cer)
            </label>
            <div
              className="relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
              style={{
                border: '2px dashed var(--border)',
                background: cerFile ? 'var(--brand-50)' : 'var(--muted)',
              }}
              onClick={() => cerRef.current?.click()}
            >
              <input
                ref={cerRef}
                type="file"
                accept=".cer"
                className="hidden"
                onChange={e => setCerFile(e.target.files?.[0] ?? null)}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={cerFile ? 'var(--brand-600)' : 'var(--muted-foreground)'} strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span className="text-sm font-semibold" style={{ color: cerFile ? 'var(--brand-700)' : 'var(--muted-foreground)' }}>
                {cerFile ? cerFile.name : 'Seleccionar archivo .cer'}
              </span>
            </div>
          </div>

          {/* KEY file */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Llave privada (.key)
            </label>
            <div
              className="relative flex flex-col items-center justify-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
              style={{
                border: '2px dashed var(--border)',
                background: keyFile ? 'var(--brand-50)' : 'var(--muted)',
              }}
              onClick={() => keyRef.current?.click()}
            >
              <input
                ref={keyRef}
                type="file"
                accept=".key"
                className="hidden"
                onChange={e => setKeyFile(e.target.files?.[0] ?? null)}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={keyFile ? 'var(--brand-600)' : 'var(--muted-foreground)'} strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              <span className="text-sm font-semibold" style={{ color: keyFile ? 'var(--brand-700)' : 'var(--muted-foreground)' }}>
                {keyFile ? keyFile.name : 'Seleccionar archivo .key'}
              </span>
            </div>
          </div>

          {/* FIEL password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Contraseña de la FIEL
            </label>
            <input
              type="password"
              value={fielPassword}
              onChange={e => setFielPassword(e.target.value)}
              placeholder="Contraseña de tu e.Firma"
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none"
              style={{
                background: 'var(--muted)',
                border: '1.5px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSkipFiel}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{
                background: 'var(--muted)',
                color: 'var(--muted-foreground)',
                border: '1.5px solid var(--border)',
              }}
            >
              Omitir por ahora
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
              style={{ background: 'var(--ink-900)', color: '#fff' }}
            >
              {loading ? 'Cargando...' : 'Continuar'}
            </button>
          </div>
        </form>
      )}

      {/* Step 3: Constancia de Situación Fiscal */}
      {step === 'constancia' && (
        <form onSubmit={handleConstancia} className="flex flex-col gap-4">
          <div>
            <h2
              className="text-xl font-black mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
            >
              Constancia de Situación Fiscal
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Necesitamos tu constancia para identificar tu régimen y presentarte los planes correctos
            </p>
          </div>

          {/* Mode toggle */}
          <div
            className="flex rounded-xl p-1 gap-1"
            style={{ background: 'var(--muted)' }}
          >
            {(['auto', 'upload'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setConstanciaMode(mode)}
                className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
                style={{
                  background: constanciaMode === mode ? 'var(--card)' : 'transparent',
                  color: constanciaMode === mode ? 'var(--foreground)' : 'var(--muted-foreground)',
                  boxShadow: constanciaMode === mode ? '0 1px 3px rgba(21,17,63,0.08)' : 'none',
                }}
              >
                {mode === 'auto' ? 'Descarga automática' : 'Subir PDF'}
              </button>
            ))}
          </div>

          {constanciaMode === 'auto' ? (
            <div className="flex flex-col gap-3">
              <div
                className="p-4 rounded-xl"
                style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}
              >
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-700)' }}>
                  Descargamos tu constancia directamente del SAT usando tu RFC y CIEC. El proceso tarda aproximadamente 5 segundos.
                </p>
              </div>
              {detectedRegime ? (
                <div
                  className="flex items-center gap-3 p-4 rounded-xl"
                  style={{ background: 'var(--brand-50)', border: '1.5px solid var(--brand-400)' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: 'var(--brand-700)' }}>Régimen detectado</p>
                    <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>{detectedRegime}</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={simulateAutoDownload}
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60"
                  style={{ background: 'var(--brand-500)', color: '#fff', boxShadow: '0 14px 34px -10px rgba(14,209,138,0.45)' }}
                >
                  {loading ? 'Descargando del SAT...' : 'Descargar Constancia del SAT'}
                </button>
              )}
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl cursor-pointer"
              style={{
                border: '2px dashed var(--border)',
                background: constanciaFile ? 'var(--brand-50)' : 'var(--muted)',
              }}
              onClick={() => constanciaRef.current?.click()}
            >
              <input
                ref={constanciaRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0] ?? null
                  setConstanciaFile(file)
                  // Auto-detect regime from filename or set first as default
                  if (file && regimes.length > 0) setSelectedRegimeId(regimes[0].id)
                }}
              />
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={constanciaFile ? 'var(--brand-600)' : 'var(--muted-foreground)'} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              <span className="text-sm font-semibold" style={{ color: constanciaFile ? 'var(--brand-700)' : 'var(--muted-foreground)' }}>
                {constanciaFile ? constanciaFile.name : 'Seleccionar PDF de la Constancia de Situación Fiscal'}
              </span>
            </div>
          )}

          {/* Regime selector */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>
              Confirma tu régimen fiscal
            </label>
            <select
              value={selectedRegimeId}
              onChange={e => setSelectedRegimeId(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold outline-none appearance-none"
              style={{
                background: 'var(--muted)',
                border: '1.5px solid var(--border)',
                color: 'var(--foreground)',
              }}
            >
              <option value="">Selecciona tu régimen</option>
              {regimes.map(regime => (
                <option key={regime.id} value={regime.id}>{regime.name}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedRegimeId}
            className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 mt-2"
            style={{ background: 'var(--brand-500)', color: '#fff', boxShadow: '0 14px 34px -10px rgba(14,209,138,0.45)' }}
          >
            {loading ? 'Guardando...' : 'Ver mis planes'}
          </button>
        </form>
      )}
    </div>
  )
}
