import type { Metadata } from 'next'
import { Poppins, Assistant } from 'next/font/google'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const CLARITY_PROJECT_ID = 'xy8b9l2b6i'

// Sustituta libre de Basic Sans (tipografía de encabezados del manual de identidad)
const poppins = Poppins({
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
  icons: {
    icon: '/Conta.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${poppins.variable} ${assistant.variable} bg-background`}
    >
      <body className="font-sans antialiased text-foreground min-h-screen">
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
        </Script>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
