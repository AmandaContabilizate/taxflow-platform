import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/auth/actions'

export default async function Home() {
  // Si hay sesión Bearer válida, mandar al dashboard.
  // TODO(backend): el flag de "ya completó onboarding" debe venir del backend
  // (antes era una query a Supabase user_credentials). Mientras no exista ese
  // endpoint, todos los usuarios autenticados van directo al dashboard.
  const user = await getCurrentUser()
  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex flex-col" style={{ background: '#15113F' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#0ED18A' }}
          >
            <span className="text-lg font-black text-white">C</span>
          </div>
          <span className="text-lg font-black text-white">Contabilízate</span>
        </div>
        <Link
          href="/auth/login"
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
          style={{ background: '#0ED18A', color: '#15113F' }}
        >
          Iniciar sesión
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6"
          style={{ background: 'rgba(14,209,138,0.12)', color: '#0ED18A', border: '1px solid rgba(14,209,138,0.25)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>
          Declaraciones procesadas con IA
        </div>

        <h1
          className="text-4xl md:text-6xl font-black text-white leading-tight max-w-3xl text-balance mb-6"
        >
          Tu contador fiscal con{' '}
          <span style={{ color: '#0ED18A' }}>inteligencia artificial</span>
        </h1>
        <p className="text-lg max-w-xl text-balance mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
          Conecta tu RFC al SAT, descarga tu Constancia de Situación Fiscal y presentamos los planes exactos para tu régimen fiscal.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/auth/login"
            className="px-8 py-4 rounded-2xl text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{ background: '#0ED18A', color: '#15113F' }}
          >
            Comenzar gratis
          </Link>
          <a
            href="#planes"
            className="px-8 py-4 rounded-2xl text-base font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            Ver planes
          </a>
        </div>

        {/* Trust bar */}
        <div className="flex items-center gap-8 mt-14 flex-wrap justify-center">
          {[
            { label: 'RFC y CIEC', desc: 'Conexión directa al SAT' },
            { label: 'e.Firma (FIEL)', desc: 'Certificado digital' },
            { label: 'Constancia Fiscal', desc: 'Descarga automática' },
            { label: 'IA Fiscal', desc: 'Declaraciones con IA' },
          ].map(item => (
            <div key={item.label} className="flex flex-col items-center gap-1">
              <span className="text-sm font-black text-white">{item.label}</span>
              <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Plans section anchor */}
      <section id="planes" className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-black text-white mb-3 text-balance">Planes que se adaptan a ti</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)' }} className="text-base">
            Elige el plan perfecto para tus necesidades. Sin compromisos, cancela cuando quieras.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Básico */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div>
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-black mb-3"
                style={{ background: 'rgba(14,209,138,0.15)', color: '#0ED18A' }}
              >
                GRATIS
              </span>
              <h3 className="text-xl font-black text-white">Básico</h3>
              <p className="text-4xl font-black text-white mt-2">
                <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>$</span>0
              </p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>para siempre</p>
            </div>
            <ul className="flex flex-col gap-3">
              {['Constancia de Situación Fiscal', 'Opinión de Cumplimiento', 'Diagnóstico fiscal últimos 5 años', 'Estatus en listas negras (69-B, etc.)'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ED18A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/login"
              className="mt-auto w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all hover:opacity-90"
              style={{ background: '#0ED18A', color: '#15113F' }}
            >
              Comenzar
            </Link>
          </div>

          {/* Diamond */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-6 relative"
            style={{ background: '#FFFFFF', border: '2px solid #0ED18A' }}
          >
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black"
              style={{ background: '#0ED18A', color: '#15113F' }}
            >
              Mas popular
            </div>
            <div>
              <h3 className="text-xl font-black" style={{ color: '#15113F' }}>Diamond</h3>
              <p className="text-xs mb-2" style={{ color: '#8982BC' }}>Para freelancers y profesionistas</p>
              <p className="text-4xl font-black" style={{ color: '#15113F' }}>
                <span className="text-sm font-bold">$</span>296
                <span className="text-base font-semibold" style={{ color: '#8982BC' }}>/mes</span>
              </p>
              <p className="text-xs mt-1 font-bold" style={{ color: '#0ED18A' }}>Ahorras 52% vs plan mensual</p>
            </div>
            <ul className="flex flex-col gap-3">
              {['Todo el plan Básico', '12 declaraciones con IA incluidas', 'Facturación electrónica 600 folios anuales', 'Soporte ilimitado por chat y correo', 'Asesoría personalizada e ilimitada'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: '#15113F' }}>
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ED18A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/login"
              className="mt-auto w-full py-3.5 rounded-2xl text-sm font-bold text-center transition-all hover:opacity-90"
              style={{ background: '#0ED18A', color: '#15113F' }}
            >
              Elegir plan
            </Link>
          </div>

          {/* Empresarial */}
          <div
            className="rounded-3xl p-8 flex flex-col gap-6"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div>
              <h3 className="text-xl font-black text-white">Empresarial</h3>
              <p className="text-4xl font-black text-white mt-2">Personalizado</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Soluciones a medida para tu empresa</p>
            </div>
            <ul className="flex flex-col gap-3">
              {['Facturación por API', 'Portal de proveedores', 'Auditoría fiscal', 'Economía colaborativa', 'Gerente de cuenta dedicado'].map(f => (
                <li key={f} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ED18A" strokeWidth="3" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className="mt-auto w-full py-3.5 rounded-2xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Contactar ventas
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 px-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
        <p className="text-sm">© 2025 Contabilízate. Plataforma fiscal con inteligencia artificial para México.</p>
      </footer>
    </main>
  )
}
