import type { Metadata } from 'next'
import { Montserrat, Assistant } from 'next/font/google'
import './globals.css'

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const assistant = Assistant({
  subsets: ['latin'],
  variable: '--font-ui',
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Contabilízate — Tu contador fiscal con IA',
  description:
    'Declara impuestos con inteligencia artificial. Conecta tu RFC, descarga tu constancia y elige el plan perfecto según tu régimen fiscal.',
  keywords: ['declaración de impuestos', 'SAT', 'RFC', 'contabilidad', 'régimen fiscal', 'CIEC', 'FIEL'],
  generator: 'v0.app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${montserrat.variable} ${assistant.variable} bg-background`}>
      <body className="font-ui antialiased text-foreground min-h-screen">{children}</body>
    </html>
  )
}
