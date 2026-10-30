/**
 * Pantalla terminal mostrada cuando la sesión termina mientras la app corre
 * embebida en el iframe de un partner (puente SSO). No redirige — el frame
 * padre es quien controla la navegación desde aquí, no esta página.
 */
export default function SessionEndedPage() {
  return (
    <main
      className="force-light flex min-h-screen items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-black" style={{ color: "var(--foreground)" }}>
          Tu sesión ha terminado
        </h1>
        <p className="mt-2 text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
          Por seguridad, tu sesión ha finalizado.
        </p>
      </div>
    </main>
  );
}
