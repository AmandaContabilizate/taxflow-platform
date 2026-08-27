'use client'

import { CreditCard, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useState } from 'react'
import { getSalesSummary } from '@/features/operations/actions/getSalesSummary.action'
import type { ProductoVenta } from '@/features/operations/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
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

/** Opciones del filtro (ids de Catalogs.StatusSale). */
const ESTATUS_OPTIONS = [
  { value: 0, label: 'Todos los estatus' },
  { value: 1, label: 'En proceso' },
  { value: 2, label: 'Pagado' },
  { value: 3, label: 'No concluido' },
] as const

const PAGE_SIZES = [5, 10, 25, 50, 100] as const

/**
 * Etiqueta de negocio por estatus (solo esta pantalla): el id 3 se muestra como
 * "No concluido" — cubre carrito reemplazado y suscripción cancelada sin cobro;
 * nunca representa dinero cobrado, por eso no merece el rojo de "Cancelado".
 */
const ESTATUS_LABEL: Record<number, string> = {
  1: 'En proceso',
  2: 'Pagado',
  3: 'No concluido',
}

/** Pill de estatus: verde pagado, ámbar en proceso, gris no concluido. */
function EstatusBadge({ statusSaleId, estatus }: { statusSaleId: number; estatus: string | null }) {
  const palette =
    statusSaleId === 2
      ? { background: 'var(--brand-100)', color: 'var(--brand-900)' }
      : statusSaleId === 3
        ? { background: 'var(--ink-100)', color: 'var(--ink-700)' }
        : { background: 'var(--amber-soft)', color: 'var(--violet-ink)' }
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11.5px] font-bold whitespace-nowrap"
      style={palette}
    >
      {ESTATUS_LABEL[statusSaleId] ?? estatus ?? '—'}
    </span>
  )
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

function isStripeId(id: string | null | undefined): boolean {
  if (!id) return false
  const t = id.trim()
  return t.startsWith('cs_') || t.startsWith('pi_') || t.startsWith('cus_') || t.startsWith('sub_') || t.startsWith('in_')
}

export function OtherPaymentButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ver detalle del pago (Otro medio)"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11.5px] font-bold transition hover:bg-[var(--ink-50)]"
      style={{ borderColor: 'var(--border)', color: 'var(--ink-700)' }}
    >
      <CreditCard size={14} className="text-amber-500" />
      <span>Otro medio</span>
    </button>
  )
}

export function VentasScreen() {
  const [status, setStatus] = useState(0)
  const [pageSize, setPageSize] = useState(50)
  // El fetcher captura el filtro de estatus: al cambiar, el hook re-consulta.
  const fetcher = useCallback(
    (p: { skip?: number; take?: number; rfc?: string }) =>
      getSalesSummary({ ...p, status: status || undefined }),
    [status],
  )
  const list = usePagedList(fetcher, pageSize)
  const [stripeSaleId, setStripeSaleId] = useState<number | null>(null)

  const changeStatus = (value: number) => {
    setStatus(value)
    list.resetPage()
  }

  const changePageSize = (value: number) => {
    setPageSize(value)
    list.resetPage()
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)] min-h-[600px]">
      <HelpBox>
        Resumen de ventas registradas. Cada renglón muestra la cuenta que compró, los productos
        incluidos y el monto. Filtra por RFC y navega entre páginas. Con el botón de Stripe abres
        los identificadores del cobro (payment intent, customer, suscripción y checkout) para
        rastrearlo en el dashboard de Stripe.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <SearchBar value={list.rfc} onChange={list.setRfc} placeholder="Buscar por RFC, correo, teléfono o nombre…" />
          </div>
          <select
            value={status}
            onChange={(e) => changeStatus(Number(e.target.value))}
            aria-label="Filtrar por estatus"
            className="px-3 py-2.5 rounded-xl text-[13px] font-semibold outline-none cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {ESTATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => changePageSize(Number(e.target.value))}
            aria-label="Registros por página"
            className="px-3 py-2.5 rounded-xl text-[13px] font-semibold outline-none cursor-pointer"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n} por página</option>
            ))}
          </select>
        </div>
      </Card>

      <Card className="flex-1 min-h-[480px] flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {list.loading ? 'Cargando…' : `${list.total} ventas`}
          </div>
        </div>

        {list.error ? (
          <div className="flex-1 flex flex-col justify-center">
            <ErrorState message={list.error} />
          </div>
        ) : list.loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando ventas…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Venta', 'Cuenta', 'RFC', 'Productos', 'Monto', 'Código', 'Estatus', 'Medio de Pago'].map((h) => (
                      <th
                        key={h}
                        className={`px-5 py-3 font-extrabold ${h === 'Monto' ? 'text-right' : h === 'Medio de Pago' ? 'text-center' : 'text-left'}`}
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((v) => {
                    const stripeId = isStripeId(v.paymentIntentId)
                      ? v.paymentIntentId
                      : isStripeId(v.checkoutId)
                        ? v.checkoutId
                        : null
                    return (
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
                          {v.userPhone && (
                            <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              📞 {v.userPhone}
                            </div>
                          )}
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
                        <td className="px-5 py-4 align-top">
                          {v.discountCode ? (
                            <div
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold"
                              style={{ background: 'var(--violet-soft)', color: 'var(--violet-ink)' }}
                              title="Código de promoción aplicado en la compra"
                            >
                              <span style={MONO}>{v.discountCode}</span>
                              {v.discountPercent != null && v.discountPercent > 0 && (
                                <span>· {v.discountPercent}%</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 align-top">
                          <EstatusBadge statusSaleId={v.statusSaleId} estatus={v.estatus} />
                        </td>
                        <td className="px-5 py-4 align-top text-center">
                          {stripeId ? (
                            <>
                              <StripeButton onClick={() => setStripeSaleId(v.saleId)} />
                              <div
                                className="text-[10.5px] mt-1 truncate max-w-[130px] mx-auto"
                                style={{ ...MONO, color: 'var(--ink-400)' }}
                              >
                                {stripeId}
                              </div>
                            </>
                          ) : v.statusSaleId === 2 ? (
                            <OtherPaymentButton onClick={() => setStripeSaleId(v.saleId)} />
                          ) : (
                            <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {list.items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
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
