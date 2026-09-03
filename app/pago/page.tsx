import type { Metadata } from 'next'
import { AlertTriangle, Clock3, SearchX } from 'lucide-react'
import { redeemPaymentLink } from '@/features/payment-link/actions'
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
    <main className="flex min-h-screen justify-center px-4 py-8" style={{ background: 'var(--background)' }}>
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
    </main>
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

  return <PagoView clientSecret={result.value.clientSecret} initialStatus={result.value.status} />
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
        message="Por seguridad, el enlace solo dura unos minutos. Vuelve a la app y abre el pago de nuevo para generar uno actualizado."
      />
    )
  }

  if (code === 'SALE_NOT_FOUND') {
    return (
      <StatusCard
        icon={<SearchX size={28} style={{ color: 'var(--amber)' }} />}
        iconBg="var(--amber-soft)"
        title="No encontramos esta compra"
        message="El enlace no corresponde a ningún pago pendiente. Vuelve a la app e inténtalo de nuevo."
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
      className="w-full max-w-[440px] self-start rounded-3xl px-6 py-9 text-center"
      style={{ background: 'var(--card)', border: '1.5px solid var(--border-strong)', boxShadow: 'var(--sh-3)' }}
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
