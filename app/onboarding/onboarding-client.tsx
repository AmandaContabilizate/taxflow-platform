'use client'

import { useRouter } from 'next/navigation'
import SatCredentialsForm from '@/components/sat-credentials-form'
import type { FiscalRegime } from '@/lib/types'

interface Props {
  regimes: FiscalRegime[]
  existingRfc?: string
  hasCredentials: boolean
}

export default function OnboardingClient({ regimes, existingRfc, hasCredentials }: Props) {
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
            className="text-3xl font-black text-white leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Configura tu perfil fiscal en 3 pasos
          </h2>
          <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Conecta tu RFC al SAT y descubrimos tu régimen para presentarte los planes correctos.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {[
            { num: '1', title: 'RFC y CIEC', desc: 'Identidad y acceso al SAT' },
            { num: '2', title: 'e.Firma (FIEL)', desc: 'Certificado digital opcional' },
            { num: '3', title: 'Constancia Fiscal', desc: 'Descarga o sube tu constancia' },
          ].map(step => (
            <div key={step.num} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                style={{ background: 'rgba(14,209,138,0.15)', color: 'var(--brand-400)' }}
              >
                {step.num}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{step.title}</p>
                <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
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
            regimes={regimes}
            existingRfc={existingRfc}
            onComplete={() => router.push('/planes')}
          />
        </div>
      </div>
    </div>
  )
}
