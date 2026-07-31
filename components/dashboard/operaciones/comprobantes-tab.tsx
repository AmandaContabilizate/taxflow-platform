'use client'

import { AlertCircle, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getDeclarationInvoices } from '@/features/operations/actions/getDeclarationInvoices.action'
import type { DeclarationInvoice, Paged } from '@/features/operations/types'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Card } from '../ui'

const TAKE = 100

const money = (v: string | number | null) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * Fecha que define a qué periodo pertenece la factura. Para nómina es la fecha
 * de pago, no la del CFDI: una factura del 3-feb con pago del 23-ene cae en enero.
 */
const periodDate = (inv: DeclarationInvoice) =>
  inv.esNomina && inv.fechaPagoNomina ? inv.fechaPagoNomina : inv.invoiceDate

function Chip({
  children,
  bg,
  fg,
  title,
}: {
  children: React.ReactNode
  bg: string
  fg: string
  title?: string
}) {
  return (
    <span
      title={title}
      className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold whitespace-nowrap"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  )
}

/** `clasificada` es la bandera; no se infiere por nulls. */
function ClasificacionCell({ inv }: { inv: DeclarationInvoice }) {
  if (!inv.clasificada) {
    return (
      <Chip bg="var(--muted)" fg="var(--ink-500)">
        Sin clasificar
      </Chip>
    )
  }

  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      <div className="flex flex-wrap items-center gap-1">
        {inv.isDeducible === true && (
          <Chip bg="var(--brand-50)" fg="var(--brand-700)">Deducible</Chip>
        )}
        {inv.isDeducible === false && (
          <Chip bg="var(--coral-soft)" fg="#9E3A15" title={inv.motivo ?? undefined}>
            No deducible
          </Chip>
        )}
        {inv.isGasto != null && (
          <Chip
            bg="var(--ink-50)"
            fg="var(--ink-700)"
            title="Naturaleza del comprobante; la deducibilidad va aparte"
          >
            {inv.isGasto ? 'Gasto' : 'Ingreso'}
          </Chip>
        )}
      </div>
      {inv.clasificacion && (
        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-900)' }}>
          {inv.clasificacion}
        </span>
      )}
      {inv.actividad && (
        <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
          {inv.actividad}
        </span>
      )}
      {/* `motivo` sale de la nota de la declaración, así que puede venir aunque
          sí sea deducible; solo se pinta en rojo cuando no lo es. */}
      {inv.motivo && (
        <span
          className="text-[11.5px] leading-snug"
          style={{ color: inv.isDeducible === false ? '#9E3A15' : 'var(--ink-500)' }}
        >
          {inv.motivo}
        </span>
      )}
    </div>
  )
}

export function ComprobantesTab({ declarationId, periodo }: { declarationId: number; periodo: string }) {
  const [page, setPage] = useState<Paged<DeclarationInvoice>>({ items: [], total: 0, skip: 0, take: TAKE })
  const [skip, setSkip] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subTab, setSubTab] = useState(0)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDeclarationInvoices({ declarationId, skip, take: TAKE })
      if (cancelled) return
      if (res.success) setPage(res.value)
      else {
        setError(res.error.message)
        setPage({ items: [], total: 0, skip: 0, take: TAKE })
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [declarationId, skip])

  // El backend no filtra por texto: se busca sobre la página cargada.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = !q
      ? page.items
      : page.items.filter((i) =>
          [i.folio, i.serie, i.uuid, i.emitterRfc, i.emitterName, i.receivedRfc, i.receiverName, i.clasificacion]
            .some((f) => f?.toLowerCase().includes(q)),
        )
    return [...filtered].sort((a, b) => periodDate(b).localeCompare(periodDate(a)))
  }, [page.items, query])

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const currentPage = Math.floor(skip / TAKE) + 1

  return (
    <Card>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              CFDIs Emitidos y Recibidos
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              {loading ? 'Cargando comprobantes…' : `${page.total} comprobantes del período ${periodo}`}
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            size={16}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por folio, UUID, RFC o clasificación…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        <div className="flex p-1 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {['CFDIs Normales', 'CFDIs de Retenciones'].map((t, i) => (
            <button
              key={t}
              onClick={() => setSubTab(i)}
              className="flex-1 px-4 py-2 rounded-lg text-[13px] font-bold transition"
              style={
                i === subTab
                  ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                  : { background: 'transparent', color: 'var(--ink-500)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {subTab === 1 ? (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            No hay CFDIs de retenciones en este período.
          </div>
        ) : error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        ) : loading ? (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando comprobantes…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            {page.items.length === 0
              ? 'No hay comprobantes en este período.'
              : 'Ningún comprobante coincide con la búsqueda.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fecha', 'Folio', 'Tipo', 'Comprobante', 'Emisor', 'Receptor', 'Subtotal', 'Total', 'Clasificación'].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((inv) => {
                    const desfasada = inv.esNomina && inv.fechaPagoNomina
                    return (
                      <tr key={inv.invoiceId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="px-3 py-3 whitespace-nowrap align-top">
                          <div style={{ color: 'var(--ink-900)' }}>{fmtDate(periodDate(inv))}</div>
                          {desfasada && (
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                              CFDI {fmtDate(inv.invoiceDate)}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 align-top" style={{ color: 'var(--ink-900)' }}>
                          <div className="font-semibold">{[inv.serie, inv.folio].filter(Boolean).join('-') || '—'}</div>
                          <div className="text-[10.5px] mt-0.5" style={{ ...MONO, color: 'var(--ink-500)' }}>
                            {inv.uuid?.slice(0, 8)}…
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <Chip
                            bg={inv.isIssued ? 'var(--sky-soft)' : 'var(--ink-50)'}
                            fg={inv.isIssued ? 'var(--sky)' : 'var(--ink-700)'}
                          >
                            {inv.isIssued ? 'Emitida' : 'Recibida'}
                          </Chip>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-col gap-1 items-start">
                            <span style={{ color: 'var(--ink-700)' }}>{inv.tipoComprobante}</span>
                            {inv.esNomina && (
                              <Chip bg="var(--violet-soft)" fg="var(--violet)">Nómina</Chip>
                            )}
                            {/* Validez con la que entró al cálculo de esta declaración. */}
                            {inv.isValid === false && (
                              <Chip
                                bg="var(--coral-soft)"
                                fg="#9E3A15"
                                title="La factura entró a esta declaración marcada como no válida"
                              >
                                No válida
                              </Chip>
                            )}
                            {inv.isValid === true && (
                              <Chip
                                bg="var(--muted)"
                                fg="var(--ink-500)"
                                title="Válida en el cálculo de esta declaración"
                              >
                                Válida
                              </Chip>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div style={{ color: 'var(--ink-900)' }}>{inv.emitterName}</div>
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.emitterRfc}</code>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <div style={{ color: 'var(--ink-900)' }}>{inv.receiverName}</div>
                          <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.receivedRfc}</code>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap align-top" style={{ ...MONO, color: 'var(--ink-900)' }}>
                          {money(inv.subTotal)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap align-top font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                          {money(inv.total)}
                        </td>
                        <td className="px-3 py-3 align-top">
                          <ClasificacionCell inv={inv} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {page.total > TAKE && (
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
                onNext={() => setSkip((s) => (s + TAKE < page.total ? s + TAKE : s))}
              />
            )}
          </>
        )}
      </div>
    </Card>
  )
}
