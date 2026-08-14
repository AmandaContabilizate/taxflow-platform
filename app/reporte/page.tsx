import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, SearchX } from 'lucide-react'
import { getDeclarationReport } from '@/features/declaration-report/actions'
import { PUBLIC_ROUTES } from '@/lib/routes'
import { ReportView } from './report-view'

export const metadata: Metadata = {
  title: 'Tu declaración — Contabilízate',
  robots: { index: false, follow: false },
}

/** El token cifrado cambia por destinatario: nunca se cachea la respuesta. */
export const dynamic = 'force-dynamic'

export default async function ReportePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[] }>
}) {
  const { t } = await searchParams
  const token = Array.isArray(t) ? (t[0] ?? '') : (t ?? '')

  const result = token
    ? await getDeclarationReport(token)
    : ({
        success: false as const,
        error: { statusCode: 400, message: '', code: 'REPORT_TOKEN_INVALID' },
      })

  return (
    <main
      className="report-print-root force-light flex min-h-screen justify-center px-4 pb-12 pt-8"
      style={{ background: 'var(--background)' }}
    >
      {result.success ? (
        <ReportView report={result.value} token={token} />
      ) : (
        <InvalidLink
          notFound={result.error.code === 'DECLARATION_NOT_FOUND'}
          message={
            result.error.code && result.error.code !== 'REPORT_TOKEN_INVALID'
              ? result.error.message
              : undefined
          }
        />
      )}
    </main>
  )
}

function InvalidLink({ notFound, message }: { notFound: boolean; message?: string }) {
  return (
    <div
      className="w-full max-w-[520px] self-start rounded-3xl px-7 py-9 text-center"
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--border-strong)',
        boxShadow: 'var(--sh-3)',
      }}
    >
      <div
        className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full"
        style={{ background: notFound ? 'var(--amber-soft)' : 'var(--danger-soft)' }}
      >
        {notFound ? (
          <SearchX size={28} style={{ color: 'var(--amber)' }} />
        ) : (
          <AlertTriangle size={28} style={{ color: 'var(--danger)' }} />
        )}
      </div>
      <h1
        className="mb-2 text-xl font-extrabold"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
      >
        {notFound ? 'No encontramos esta declaración' : 'Este enlace no es válido'}
      </h1>
      <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
        {message ??
          'Revisa que hayas abierto el enlace más reciente que te enviamos por correo. Si el problema sigue, escríbenos y tu contador te comparte el estado actual.'}
      </p>
      <Link
        href={PUBLIC_ROUTES.LOGIN}
        className="mt-6 inline-block text-xs font-bold hover:underline"
        style={{ color: 'var(--brand-700)' }}
      >
        Ir a mi cuenta →
      </Link>
    </div>
  )
}
