'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { getSalesSummary } from '@/features/operations/actions/getSalesSummary.action'
import type { ProductoVenta } from '@/features/operations/types'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'
import { Pagination, SearchBar, usePagedList } from '../clientes/parts'
import { StripeDetailModal } from '../ventas/stripe-detail-modal'

const money = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ProductosCell({ productos }: { productos: ProductoVenta[] }) {
  if (!productos || productos.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  return (
    <div className="flex flex-col gap-1.5">
      {productos.map((p, i) => (
        <div key={`${p.subscriptionId}-${i}`} className="flex items-start gap-1.5">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0"
            style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
          >
            ×{p.cantidad}
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold leading-tight" style={{ color: 'var(--ink-900)' }}>
              {p.nombre}
            </div>
            {p.descripcion && (
              <div className="text-[11px] leading-tight" style={{ color: 'var(--ink-500)' }}>
                {p.descripcion}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function StripeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver datos de Stripe"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition hover:bg-[var(--ink-50)]"
      style={{ borderColor: 'var(--border)' }}
    >
      <Image src="/stripe-logo.png" alt="Stripe" width={44} height={18} />
    </button>
  )
}

export function VentasScreen() {
  const list = usePagedList(getSalesSummary, 50)
  const [stripeSaleId, setStripeSaleId] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>
        Resumen de ventas registradas. Cada renglón muestra la cuenta que compró, los productos
        incluidos y el monto. Filtra por RFC y navega entre páginas. Con el botón de Stripe abres
        los identificadores del cobro (payment intent, customer, suscripción y checkout) para
        rastrearlo en el dashboard de Stripe.
      </HelpBox>

      <Card>
        <div className="p-4">
          <SearchBar value={list.rfc} onChange={list.setRfc} placeholder="Buscar por RFC…" />
        </div>
      </Card>

      <Card>
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} ventas`}
          </div>
        </div>

        {list.error ? (
          <div className="px-5 py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {list.error}
            </div>
          </div>
        ) : list.loading ? (
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando ventas…
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Venta', 'Cuenta', 'RFC', 'Productos', 'Monto', 'Stripe'].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3 font-extrabold ${h === 'Monto' ? 'text-right' : h === 'Stripe' ? 'text-center' : 'text-left'}`}
                        style={{ color: 'var(--ink-700)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((v) => (
                    <tr key={v.saleId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          #{v.saleId}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {formatDate(v.saleDate)}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {v.userFullName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {v.userEmail}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{v.rfc}</code>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <ProductosCell productos={v.productos} />
                      </td>
                      <td className="px-5 py-4 align-top text-right">
                        <span className="font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                          {money.format(v.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top text-center">
                        <StripeButton onClick={() => setStripeSaleId(v.saleId)} />
                        {v.paymentIntentId && (
                          <div
                            className="text-[10.5px] mt-1 truncate max-w-[130px] mx-auto"
                            style={{ ...MONO, color: 'var(--ink-400)' }}
                          >
                            {v.paymentIntentId}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8">
                <div style={{ color: 'var(--ink-500)' }}>No se encontraron ventas</div>
              </div>
            ) : (
              <Pagination
                page={list.page}
                totalPages={list.totalPages}
                total={list.total}
                skip={list.skip}
                take={list.take}
                itemCount={list.items.length}
                onPrev={list.prevPage}
                onNext={list.nextPage}
              />
            )}
          </>
        )}
      </Card>

      <StripeDetailModal saleId={stripeSaleId} onClose={() => setStripeSaleId(null)} />
    </div>
  )
}
