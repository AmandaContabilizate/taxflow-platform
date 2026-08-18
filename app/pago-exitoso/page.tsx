export default function PagoExitosoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div
        className="max-w-md w-full rounded-3xl p-10 text-center shadow-xl"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        {/* Success icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--brand-50)' }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--brand-500)"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1
          className="text-2xl font-black mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          ¡Pago exitoso!
        </h1>
        <p className="text-sm font-semibold mb-8" style={{ color: 'var(--muted-foreground)' }}>
          Tu suscripción ha sido activada. Ya puedes comenzar a declarar con inteligencia artificial.
        </p>

        <div
          className="flex items-center gap-3 p-4 rounded-2xl mb-6 text-left"
          style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" className="flex-shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p className="text-sm font-semibold" style={{ color: 'var(--brand-700)' }}>
            Recibirás un correo de confirmación con los detalles de tu plan.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href="/dashboard"
            className="flex items-center justify-center w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
            style={{ background: 'var(--brand-500)', color: '#fff', boxShadow: '0 14px 34px -10px rgba(0,211,161,0.45)' }}
          >
            Ir a mi dashboard
          </a>
          <a
            href="/planes"
            className="flex items-center justify-center w-full py-3 rounded-2xl font-semibold text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Ver mis planes
          </a>
        </div>
      </div>
    </div>
  )
}
