/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empaqueta un server Node autocontenido en .next/standalone (solo las
  // dependencias realmente usadas) — así el mismo build sirve para STG y
  // Producción vía Azure App Service sin Docker. Ver scripts/build-deploy-zip.ps1.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  turbopack: {},
  // apple-app-site-association va sin extension: Next/Azure lo servirian como
  // octet-stream y iOS exige application/json.
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: [{ key: "Content-Type", value: "application/json" }],
      },
    ]
  },
  // Los deep links de la app movil usan el prefijo /app (ver app.json de
  // mi-app-contabilidad). Si el usuario NO tiene la app instalada, el link se
  // abre en el navegador: este rewrite sirve la misma pagina web sin que la
  // URL cambie, en vez de un 404.
  async rewrites() {
    return [
      {
        source: "/app/:path*",
        destination: "/:path*",
      },
    ]
  },
  // Red de seguridad: si algo (OAuth mal configurado en BD/Azure, notificacion
  // vieja, bookmark) manda a /sign-in, evitar el 404 y llevar al login real.
  async redirects() {
    return [
      {
        source: "/sign-in",
        destination: "/auth/login",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
