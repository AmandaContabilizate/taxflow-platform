/** @type {import('next').NextConfig} */
const nextConfig = {
  // Empaqueta un server Node autocontenido en .next/standalone (solo las
  // dependencias realmente usadas) — así el mismo build sirve para STG y
  // Producción vía Azure App Service sin Docker. Ver scripts/build-deploy-zip.mjs.
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
