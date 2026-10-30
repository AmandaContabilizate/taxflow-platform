'use client'

import { Link2, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import {
  reissuePaymentLinkOnBehalf,
  type VendorPaymentLink,
} from '@/features/account/actions/registerSaleOnBehalf.action'
import type { ExpedienteVentaAbierta } from '@/features/taxpayers/types'
import { Badge, type BadgeKind } from '../ui'
import { PaymentLinkPanel } from './armar-venta-modal'

const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const ESTADO: Record<ExpedienteVentaAbierta['estado'], { label: string; kind: BadgeKind }> = {
  LigaVigente: { label: 'Liga vigente', kind: 'brand' },
  LigaVencida: { label: 'Liga vencida', kind: 'amber' },
  PendienteApp: { label: 'Checkout del cliente sin terminar', kind: 'default' },
}

function reissueError(code: string | undefined, fallback: string): string {
  switch (code) {
    case 'PAYMENT_SALE_NOT_OPEN':
      return fallback || 'La venta ya no está abierta: el cliente pagó o la venta se canceló. Recarga el expediente.'
    case 'PAYMENT_INTENT_NOT_FOUND':
      return fallback || 'Stripe ya no reconoce el cobro de esta venta. Arma la venta de nuevo.'
    default:
      return fallback || 'No se pudo emitir la liga.'
  }
}

/**
 * Ventas pendientes de cobro del cliente (expediente → Productos). Las armadas desde el backoffice
 * traen su liga: aquí se vuelve a emitir (48 h) cuando venció o se perdió, sin crear cobro nuevo
 * (spec-liga-de-pago-vendedor). Un checkout que el cliente dejó a medias en la app solo se informa.
 */
export function VentasAbiertas({
  ventas,
  canEmitir,
  onChanged,
}: {
  ventas: ExpedienteVentaAbierta[]
  canEmitir: boolean
  onChanged?: () => void
}) {
  if (ventas.length === 0) return null
  return (
    <div className="px-3 pt-3 flex flex-col gap-2">
      <div className="px-1 text-[12px] font-extrabold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>
        Pendientes de cobro
      </div>
      {ventas.map((v) => (
        <VentaAbiertaCard key={v.saleId} venta={v} canEmitir={canEmitir} onChanged={onChanged} />
      ))}
    </div>
  )
}

function VentaAbiertaCard({
  venta,
  canEmitir,
  onChanged,
}: {
  venta: ExpedienteVentaAbierta
  canEmitir: boolean
  onChanged?: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<VendorPaymentLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  const estado = ESTADO[venta.estado]
  const esLiga = venta.estado !== 'PendienteApp'

  async function reemitir() {
    setBusy(true)
    setError(null)
    const res = await reissuePaymentLinkOnBehalf(venta.saleId)
    setBusy(false)
    if (!res.success) {
      setError(reissueError(res.error.errorCode, res.error.message))
      // Si la venta ya no está abierta, el expediente debe reflejarlo.
      if (res.error.errorCode === 'PAYMENT_SALE_NOT_OPEN') onChanged?.()
      return
    }
    // No se recarga el expediente aquí: la recarga desmonta esta tarjeta y se perdería la liga
    // recién emitida antes de que el vendedor la copie. El vencimiento nuevo se muestra abajo.
    setLink(res.value)
  }

  return (
    <div className="rounded-xl px-4 py-3.5 flex flex-col gap-2.5" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--card)' }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {venta.planes.join(' + ') || 'Venta'} <span className="font-semibold" style={{ color: 'var(--ink-500)' }}>· venta #{venta.saleId}</span>
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            Armada el {fecha(venta.fecha)}
            {venta.emitidaPorNombre ? ` por ${venta.emitidaPorNombre}` : ''}
            {esLiga && venta.ligaVenceAt ? ` · liga ${venta.estado === 'LigaVigente' ? 'vence' : 'venció'} el ${fechaHora(venta.ligaVenceAt)}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge kind={estado.kind}>{estado.label}</Badge>
          <span className="text-[13.5px] font-extrabold tabular-nums" style={{ color: 'var(--ink-900)' }}>{money(venta.monto)}</span>
        </div>
      </div>

      {esLiga && canEmitir && !link && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={busy}
            onClick={() => void reemitir()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold disabled:opacity-60"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : venta.estado === 'LigaVigente' ? <Link2 size={14} /> : <RefreshCw size={14} />}
            {venta.estado === 'LigaVigente' ? 'Ver liga de nuevo' : 'Re-emitir liga (48 h)'}
          </button>
          <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
            {venta.estado === 'LigaVigente'
              ? 'Genera la misma liga con vigencia renovada; el cobro es el mismo.'
              : 'Sin cobro nuevo: la misma venta, nueva vigencia.'}
          </span>
        </div>
      )}

      {!esLiga && (
        <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
          El cliente inició una compra en la app y no terminó de pagar. Si armas una venta nueva aquí, esta se cancela.
        </div>
      )}

      {link && <PaymentLinkPanel link={link} />}

      {error && (
        <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
