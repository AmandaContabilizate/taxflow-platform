export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      <div
        className="rounded-3xl p-8 shadow-xl text-center max-w-sm w-full"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="text-5xl mb-4">😕</div>
        <h1
          className="text-xl font-black mb-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--foreground)' }}
        >
          Error de autenticación
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Hubo un problema al iniciar sesión. Por favor intenta de nuevo.
        </p>
        <a
          href="/auth/login"
          className="inline-flex items-center justify-center w-full py-3 px-4 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{ background: 'var(--ink-900)', color: '#fff' }}
        >
          Volver al inicio de sesión
        </a>
      </div>
    </div>
  )
}
