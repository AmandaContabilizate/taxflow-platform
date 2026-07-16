'use client'

import { useRouter } from 'next/navigation'
import SatCredentialsForm from '@/components/sat-credentials-form'

interface Props {
  existingRfc?: string
  hasCredentials: boolean
}

export default function OnboardingClient({ existingRfc, hasCredentials }: Props) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-[420px] flex-shrink-0"
        style={{ background: 'var(--ink-900)' }}
      >
        <div>
          <div className="flex items-center gap-2.5 mb-12">
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
            Conecta tu cuenta del SAT
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Elige cómo quieres vincularte, detectamos tu régimen automáticamente y te mostramos el plan ideal.
          </p>

          <div className="flex items-center gap-3 mb-8 mt-2">
            <a
              href="https://www.youtube.com/watch?v=iifS2LLieMU"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold hover:underline"
              style={{ color: 'var(--brand-400)' }}
            >
              ¿Qué es la CIEC?
            </a>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <a
              href="https://www.bbva.mx/educacion-financiera/empresa/cuenta-empresarial-que-es-la-e-firma.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold hover:underline"
              style={{ color: 'var(--brand-400)' }}
            >
              ¿Qué es la e.firma?
            </a>
          </div>

          {/* Method cards */}
          <div className="flex flex-col gap-3 mb-10">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Métodos de conexión
            </p>

            <div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(14,209,138,0.15)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-400)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <div>
                <p className="text-sm font-black text-white">Con CIEC</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Tu contraseña del portal del SAT. Rápido y sin archivos.
                </p>
              </div>
            </div>

            <div
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(14,209,138,0.15)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-400)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
              </div>
              <div>
                <p className="text-sm font-black text-white">Con e.Firma (FIEL)</p>
                <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Tu certificado .cer, llave .key y contraseña de clave privada.
                </p>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Qué pasa después
            </p>
            {[
              { icon: '⬇', text: 'Descargamos tu Constancia de Situación Fiscal' },
              { icon: '⚡', text: 'Detectamos tu régimen fiscal automáticamente' },
              { icon: '✦', text: 'Te presentamos el plan ideal para ti' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'rgba(14,209,138,0.12)', color: 'var(--brand-400)' }}
                >
                  {item.icon}
                </span>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © 2025 Contabilízate. Plataforma fiscal con IA.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 overflow-y-auto">
        {/* Mobile header */}
        <div className="flex items-center gap-2 mb-8 lg:hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--ink-900)' }}
          >
            <span className="text-base font-black" style={{ color: 'var(--brand-400)', fontFamily: 'var(--font-display)' }}>
              C
            </span>
          </div>
          <span className="text-base font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}>
            Contabilízate
          </span>
        </div>

        <div className="w-full max-w-lg">
          <SatCredentialsForm
            existingRfc={existingRfc}
            onComplete={() => router.push('/dashboard')}
          />
        </div>
      </div>
    </div>
  )
}
