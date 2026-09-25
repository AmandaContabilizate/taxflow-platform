import type { Metadata } from 'next'
import Image from 'next/image'
import { AlertTriangle, Clock3, SearchX } from 'lucide-react'
import { redeemPaymentLink } from '@/features/payment-link/actions'
import { EASE_OUT, ENTRADA, TARJETA } from './pago-estilos'
import { PagoView } from './pago-view'

export const metadata: Metadata = {
  title: 'Completa tu pago — Contabilízate',
  robots: { index: false, follow: false },
}

/** El token cambia por pago y caduca en minutos: nunca se cachea la respuesta. */
export const dynamic = 'force-dynamic'

export default async function PagoPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string | string[]; status?: string | string[] }>
}) {
  const { t, status } = await searchParams
  const token = Array.isArray(t) ? (t[0] ?? '') : (t ?? '')
  const returnStatus = Array.isArray(status) ? status[0] : status

  return (
    <main
      className="flex min-h-screen flex-col items-center gap-5 px-4 py-6 sm:py-8"
      style={{ background: 'var(--background)' }}
    >
      <MarcaCabecera />
      {returnStatus === 'return' ? (
        <StatusCard
          icon={<Clock3 size={28} style={{ color: 'var(--amber)' }} />}
          iconBg="var(--amber-soft)"
          title="Estamos esperando tu pago"
          message="Recibimos tus datos de pago. En cuanto el banco confirme la transferencia, tu cuenta se actualiza sola. Puedes cerrar esta pantalla."
        />
      ) : (
        <RedeemedPayment token={token} />
      )}
      <MarcaPie />
    </main>
  )
}

/** Logo + nombre, igual que el login: el cliente llega desde un WhatsApp y debe reconocer la marca. */
function MarcaCabecera() {
  return (
    <header className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={36} height={36} priority className="size-9 select-none" />
      <span className="text-lg font-black" style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}>
        Contabilízate
      </span>
    </header>
  )
}

function MarcaPie() {
  return (
    <footer className="flex max-w-[480px] flex-col items-center gap-1 text-center text-[12px]" style={{ color: 'var(--ink-500)' }}>
      <span>¿Dudas con tu pago? Escríbele al asesor que te envió este enlace.</span>
      <span className="opacity-80">© {new Date().getFullYear()} Contabilízate</span>
    </footer>
  )
}

async function RedeemedPayment({ token }: { token: string }) {
  const result = token
    ? await redeemPaymentLink(token)
    : ({
        success: false as const,
        error: { statusCode: 400, message: '', code: 'PAYMENT_TOKEN_INVALID' },
      })

  if (!result.success) {
    return <InvalidLink code={result.error.code} message={result.error.message} />
  }

  const { clientSecret, status, amount, currency, rfc, conceptos, expiresAt } = result.value
  return (
    <PagoView
      clientSecret={clientSecret}
      initialStatus={status}
      resumen={{ amount: amount ?? 0, currency: currency ?? 'MXN', rfc: rfc ?? '', conceptos: conceptos ?? [], expiresAt: expiresAt ?? null }}
    />
  )
}

function InvalidLink({ code, message }: { code?: string; message: string }) {
  if (code === 'PAYMENT_SALE_NOT_OPEN') {
    return (
      <StatusCard
        icon={<Clock3 size={28} style={{ color: 'var(--amber)' }} />}
        iconBg="var(--amber-soft)"
        title="Esta compra ya fue procesada"
        message="No hay nada pendiente por pagar aquí. Si crees que es un error, revisa el estado de tu compra desde la app."
      />
    )
  }

  if (code === 'PAYMENT_TOKEN_EXPIRED') {
    return (
      <StatusCard
        icon={<Clock3 size={28} style={{ color: 'var(--amber)' }} />}
        iconBg="var(--amber-soft)"
        title="Este enlace de pago venció"
        message="Por seguridad, los enlaces de pago tienen vigencia limitada. Si te lo envió tu asesor, pídele uno nuevo; si venías de la app, vuelve a abrir el pago para generar uno actualizado."
      />
    )
  }

  if (code === 'SALE_NOT_FOUND') {
    return (
      <StatusCard
        icon={<SearchX size={28} style={{ color: 'var(--amber)' }} />}
        iconBg="var(--amber-soft)"
        title="No encontramos esta compra"
        message="El enlace no corresponde a ningún pago pendiente. Si te lo envió tu asesor, pídele que lo revise; si venías de la app, inténtalo de nuevo."
      />
    )
  }

  return (
    <StatusCard
      icon={<AlertTriangle size={28} style={{ color: 'var(--danger)' }} />}
      iconBg="var(--danger-soft)"
      title="Este enlace no es válido"
      message={message || 'No pudimos preparar tu pago. Vuelve a la app e inténtalo de nuevo.'}
    />
  )
}

function StatusCard({
  icon,
  iconBg,
  title,
  message,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  message: string
}) {
  return (
    <div
      className={`w-full max-w-[440px] rounded-3xl px-6 py-9 text-center ${ENTRADA}`}
      style={{ ...EASE_OUT, ...TARJETA }}
    >
      <div className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full" style={{ background: iconBg }}>
        {icon}
      </div>
      <h1
        className="mb-2 text-xl font-extrabold"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h1>
      <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
        {message}
      </p>
    </div>
  )
}
