'use client'

import { AlertCircle, Check, Copy, ExternalLink, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getSalePaymentInstructions } from '@/features/account/actions/getSalePaymentInstructions.action'
import { formatMXN, type SalePaymentInstructions } from '@/features/account/types'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { Modal } from '../modal'
import { MONO } from '../constants'

interface Props {
  saleId: number | null
  onClose: () => void
}

export function PaymentInstructionsModal({ saleId, onClose }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SalePaymentInstructions | null>(null)

  useEffect(() => {
    if (saleId == null) return
    let active = true
    setLoading(true)
    setError(null)
    setData(null)
    void getSalePaymentInstructions(saleId).then((res) => {
      if (!active) return
      if (res.success) setData(res.value)
      else setError(res.error.message)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [saleId])

  return (
    <Modal isOpen={saleId != null} onClose={onClose} title="Datos para tu pago">
      {loading ? (
        <div className="py-8 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando…
        </div>
      ) : error ? (
        <div className="py-6 text-center flex flex-col items-center gap-2">
          <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
          <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
            {error}
          </div>
        </div>
      ) : data ? (
        <PaymentInstructionsBody data={data} />
      ) : null}
    </Modal>
  )
}

function PaymentInstructionsBody({ data }: { data: SalePaymentInstructions }) {
  const { copy, copiedKey } = useCopyToClipboard()

  const amountLabel = `${formatMXN(data.amount)}${data.currency ? ` ${data.currency.toUpperCase()}` : ''}`

  if (data.paymentMethod === 'spei' && data.spei) {
    const s = data.spei
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
          Transfiere desde tu banco a esta cuenta CLABE. El monto se acredita automáticamente.
        </p>
        <Field label="Monto a transferir" value={amountLabel} onCopy={copy} copiedKey={copiedKey} />
        {s.clabe && <Field label="CLABE" value={s.clabe} onCopy={copy} copiedKey={copiedKey} />}
        {s.bankName && <Field label="Banco" value={s.bankName} onCopy={copy} copiedKey={copiedKey} />}
        {s.reference && <Field label="Referencia" value={s.reference} onCopy={copy} copiedKey={copiedKey} />}
        {s.accountHolderName && (
          <Field label="Beneficiario" value={s.accountHolderName} onCopy={copy} copiedKey={copiedKey} />
        )}
      </div>
    )
  }

  if (data.paymentMethod === 'oxxo' && data.oxxo) {
    const o = data.oxxo
    return (
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
          Paga en cualquier tienda OXXO con esta referencia.
        </p>
        <Field label="Monto a pagar" value={amountLabel} onCopy={copy} copiedKey={copiedKey} />
        {o.number && <Field label="Referencia" value={o.number} onCopy={copy} copiedKey={copiedKey} />}
        {o.hostedVoucherUrl && (
          <a
            href={o.hostedVoucherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold w-fit"
            style={{ color: 'var(--brand-700)' }}
          >
            Ver voucher <ExternalLink size={13} />
          </a>
        )}
      </div>
    )
  }

  return (
    <div className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
      Ya no hay instrucciones de pago disponibles para esta compra.
    </div>
  )
}

function Field({
  label,
  value,
  onCopy,
  copiedKey,
}: {
  label: string
  value: string
  onCopy: (value: string, key?: string) => void
  copiedKey: string | null
}) {
  const copied = copiedKey === value
  return (
    <div className="flex items-center justify-between gap-3 py-2" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
          {label}
        </div>
        <div className="text-[14px] font-semibold truncate" style={{ ...MONO, color: 'var(--ink-900)' }}>
          {value}
        </div>
      </div>
      <button
        type="button"
        title={`Copiar ${label}`}
        onClick={() => onCopy(value)}
        className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80 flex-shrink-0"
        style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
      >
        {copied ? <Check size={12} style={{ color: 'var(--brand-700)' }} /> : <Copy size={12} />}
        {copied ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
