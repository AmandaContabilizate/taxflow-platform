'use client'

import { notFound, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { DiagnosticoScreen } from '@/components/dashboard/screens/diagnostico'
import { DIAG_MOCK_COOKIE, ESCENARIOS } from '@/features/diagnostico/mocks/escenarios'
import { RfcProvider } from '@/features/taxpayers/stores/rfcStore'

/**
 * Previsualización de la pantalla Diagnóstico del cliente con datos simulados
 * (features/diagnostico/mocks). Solo `next dev`: escribe la cookie diag_mock y las server
 * actions de la pantalla regresan el escenario en vez de llamar a las APIs.
 * Uso: /dev/diagnostico?escenario=con-adeudos
 */
function Preview() {
  const router = useRouter()
  const params = useSearchParams()
  const escenario = params.get('escenario') ?? 'con-adeudos'
  const [ready, setReady] = useState<string | null>(null)

  useEffect(() => {
    document.cookie = `${DIAG_MOCK_COOKIE}=${escenario}; path=/; SameSite=Lax`
    setReady(escenario)
  }, [escenario])

  const limpiar = () => {
    document.cookie = `${DIAG_MOCK_COOKIE}=; path=/; max-age=0`
    setReady(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg, var(--background))' }}>
      <div
        className="px-5 py-3 flex items-center gap-3 flex-wrap border-b text-[13px]"
        style={{ borderColor: 'var(--border)', color: 'var(--ink-500)' }}
      >
        <strong style={{ color: 'var(--ink-900)' }}>Diagnóstico · datos simulados</strong>
        <select
          value={escenario}
          onChange={(e) => router.replace(`/dev/diagnostico?escenario=${e.target.value}`)}
          className="rounded-md border px-2 py-1"
          style={{ borderColor: 'var(--border)' }}
        >
          {Object.entries(ESCENARIOS).map(([id, e]) => (
            <option key={id} value={id}>
              {id} — {e.titulo}
            </option>
          ))}
        </select>
        <button type="button" onClick={limpiar} className="underline">
          Quitar simulación
        </button>
      </div>

      <main className="min-w-0 px-5 py-6 lg:px-10 lg:py-7 pb-20 max-w-[1280px]">
        {ready === escenario && (
          <RfcProvider key={escenario}>
            <DiagnosticoScreen go={() => {}} />
          </RfcProvider>
        )}
      </main>
    </div>
  )
}

export default function DevDiagnosticoPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return (
    <Suspense>
      <Preview />
    </Suspense>
  )
}
