'use client'

import { AlertCircle, Check, Copy, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getDeclarationInvoices } from '@/features/operations/actions/getDeclarationInvoices.action'
import type { DeclarationInvoice, Paged, Retencion } from '@/features/operations/types'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Card } from '../ui'

const TAKE = 100

/** Catálogo de `invoiceTypeId` del backend; fuera de 1-5 responde INVALID_REQUEST. */
type InvoiceTypeId = 1 | 2 | 3 | 4 | 5

const INVOICE_TYPES: [InvoiceTypeId, string][] = [
  [1, 'Ingreso'],
  [2, 'Egreso'],
  [3, 'Traslado'],
  [4, 'Pago'],
  [5, 'Nómina'],
]

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: [T, string][]
}) {
  return (
    <label className="flex flex-col gap-1 min-w-[150px] flex-1">
      <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full px-3 py-2.5 rounded-lg text-[13px]"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

const money = (v: string | number | null) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n == null || !Number.isFinite(n)) return '—'
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

const toNumber = (v: string | number | null | undefined) => {
  const n = typeof v === 'string' ? Number(v) : v
  return n != null && Number.isFinite(n) ? n : 0
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

/** El UUID va completo (es el dato con el que se busca en el SAT) y se copia al hacer click. */
function FolioCell({ inv }: { inv: DeclarationInvoice }) {
  const [copied, setCopied] = useState(false)
  const folio = [inv.serie, inv.folio].filter(Boolean).join('-')

  useEffect(() => {
    if (!copied) return
    const t = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(t)
  }, [copied])

  const copy = async () => {
    if (!inv.uuid) return
    try {
      await navigator.clipboard.writeText(inv.uuid)
      setCopied(true)
    } catch {
      /* clipboard bloqueado (http o permisos): el UUID igual se ve completo */
    }
  }

  return (
    <div className="flex flex-col gap-1 min-w-[176px]">
      <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>
        {folio || 'Sin folio'}
      </span>
      {inv.uuid ? (
        <button
          type="button"
          onClick={copy}
          title={copied ? 'UUID copiado' : 'Copiar UUID'}
          className="group flex items-start gap-1 -mx-1 px-1 py-0.5 rounded text-left transition-colors hover:bg-[var(--ink-50)]"
        >
          <code
            className="text-[10.5px] leading-[1.45] break-all uppercase"
            style={{ ...MONO, color: 'var(--ink-500)' }}
          >
            {inv.uuid}
          </code>
          {copied ? (
            <Check size={11} className="shrink-0 mt-[2px]" style={{ color: 'var(--brand-700)' }} />
          ) : (
            <Copy
              size={11}
              className="shrink-0 mt-[2px] opacity-0 transition-opacity group-hover:opacity-100"
              style={{ color: 'var(--ink-500)' }}
            />
          )}
        </button>
      ) : (
        <span className="text-[10.5px]" style={{ color: 'var(--ink-500)' }}>
          Sin UUID
        </span>
      )}
    </div>
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
          <Chip bg="var(--coral-soft)" fg="var(--violet-ink)" title={inv.motivo ?? undefined}>
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
          style={{ color: inv.isDeducible === false ? 'var(--violet-ink)' : 'var(--ink-500)' }}
        >
          {inv.motivo}
        </span>
      )}
    </div>
  )
}

const MESES = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Periodo que declara el propio CFDI de retención; puede no ser el de la declaración. */
const retencionPeriodo = (r: Retencion) => {
  const ini = MESES[r.beginMonth] ?? r.beginMonth
  const fin = MESES[r.endMonth] ?? r.endMonth
  return r.beginMonth === r.endMonth ? `${ini} ${r.year}` : `${ini}–${fin} ${r.year}`
}

/** Colores por impuesto; el backend ya resuelve 001/002/003, el code es el fallback. */
const IMPUESTO_STYLE: Record<string, { bg: string; fg: string }> = {
  ISR: { bg: 'var(--violet-soft)', fg: 'var(--violet)' },
  IVA: { bg: 'var(--sky-soft)', fg: 'var(--sky)' },
  IEPS: { bg: 'var(--hero-amber-icon-bg)', fg: 'var(--ink-900)' },
}

function RetencionBlock({ r }: { r: Retencion }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip bg="var(--ink-50)" fg="var(--ink-700)" title="Periodo declarado por el CFDI de retención">
          {retencionPeriodo(r)}
        </Chip>
        <span style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-500)' }}>
          Base {money(r.totalTaxableAmount)}
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {r.detalle.map((d, i) => {
          const nombre = d.impuesto || d.retentionTaxCode || '—'
          const st = IMPUESTO_STYLE[nombre] ?? { bg: 'var(--muted)', fg: 'var(--ink-700)' }
          return (
            <div key={`${d.retentionTaxCode}-${i}`} className="flex flex-wrap items-center gap-1.5">
              <Chip bg={st.bg} fg={st.fg} title={d.retentionPaymentType ?? undefined}>
                {nombre}
              </Chip>
              <span style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-900)' }}>
                {money(d.retentionAmount)}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                sobre {money(d.retentionBaseAmount)}
              </span>
            </div>
          )
        })}
      </div>
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
  // '' = sin filtro (el EP los trae todos cuando el query param se omite).
  const [origen, setOrigen] = useState<'' | 'true' | 'false'>('')
  const [tipo, setTipo] = useState('')
  const [clasificada, setClasificada] = useState<'' | 'true' | 'false'>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getDeclarationInvoices({
        declarationId,
        isIssued: origen === '' ? undefined : origen === 'true',
        invoiceTypeId: tipo === '' ? undefined : Number(tipo),
        clasificada: clasificada === '' ? undefined : clasificada === 'true',
        skip,
        take: TAKE,
      })
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
  }, [declarationId, skip, origen, tipo, clasificada])

  // Cambiar un filtro reinicia la paginación: el `total` del backend cambia.
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setSkip(0)
    setter(v)
  }

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

  // Los CFDI de retenciones no tienen TipoDeComprobante: el backend los marca con
  // `esRetencion` y viven en su propia sub-pestaña.
  const normales = useMemo(() => rows.filter((i) => !i.esRetencion), [rows])
  const retenciones = useMemo(() => rows.filter((i) => i.esRetencion), [rows])
  const visibles = subTab === 1 ? retenciones : normales

  // Suma de lo que se está viendo: cambia con los filtros, la búsqueda y la
  // página, así que el encabezado dice explícitamente sobre qué se sumó.
  const totales = useMemo(
    () =>
      visibles.reduce(
        (acc, i) => ({
          subTotal: acc.subTotal + toNumber(i.subTotal),
          total: acc.total + toNumber(i.total),
          retenido: acc.retenido + toNumber(i.totalRetenido),
        }),
        { subTotal: 0, total: 0, retenido: 0 },
      ),
    [visibles],
  )

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

        {/* Filtros del EP: los tres son opcionales, "Todos" omite el query param. */}
        <div className="flex flex-wrap gap-3 items-end">
          <FilterSelect
            label="Emitidas / Recibidas"
            value={origen}
            onChange={onFilter(setOrigen)}
            options={[
              ['', 'Todas'],
              ['true', 'Emitidas'],
              ['false', 'Recibidas'],
            ]}
          />
          <FilterSelect
            label="Tipo de comprobante"
            value={tipo}
            onChange={onFilter(setTipo)}
            options={[['', 'Todos'], ...INVOICE_TYPES.map(([v, l]) => [String(v), l] as [string, string])]}
          />
          <FilterSelect
            label="Clasificación"
            value={clasificada}
            onChange={onFilter(setClasificada)}
            options={[
              ['', 'Todos'],
              ['true', 'Clasificados'],
              ['false', 'Sin clasificar'],
            ]}
          />
          {(origen || tipo || clasificada) && (
            <button
              onClick={() => {
                setSkip(0)
                setOrigen('')
                setTipo('')
                setClasificada('')
              }}
              className="px-3.5 py-2.5 rounded-lg text-[12.5px] font-bold transition hover:opacity-90"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex p-1 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {[
            ['CFDIs Normales', normales.length],
            ['CFDIs de Retenciones', retenciones.length],
          ].map(([t, n], i) => (
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
              {!loading && <span className="ml-1.5 font-semibold opacity-70">({n})</span>}
            </button>
          ))}
        </div>

        {error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        ) : loading ? (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando comprobantes…
          </div>
        ) : visibles.length === 0 ? (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            {rows.length > 0 && page.items.length > 0 && query.trim()
              ? 'Ningún comprobante coincide con la búsqueda.'
              : subTab === 1
                ? 'No hay CFDIs de retenciones en este período.'
                : origen || tipo || clasificada
                  ? 'No hay comprobantes con esos filtros.'
                  : 'No hay comprobantes en este período.'}
            {subTab === 1 && tipo && (
              <div className="mt-1.5 text-[12.5px]">
                Los CFDI de retenciones no tienen tipo de comprobante, así que el filtro
                “Tipo de comprobante” los deja fuera. Ponlo en “Todos” para verlos.
              </div>
            )}
            {subTab === 0 && page.items.length === 0 && clasificada === 'true' && (
              <div className="mt-1.5 text-[12.5px]">
                Si la declaración no tiene periodo asignado, el clasificador no ha corrido y esta vista sale vacía.
              </div>
            )}
          </div>
        ) : subTab === 1 ? (
          <>
            <TotalesResumen
              caption={`${visibles.length} CFDI de retenciones en pantalla`}
              entries={[['Total retenido', money(totales.retenido)]]}
            />

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fecha', 'Folio / UUID', 'Origen', 'Emisor', 'Receptor', 'Retenciones', 'Total retenido'].map((h) => (
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
                  {visibles.map((inv) => (
                    <tr key={inv.invoiceId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-3 py-3 whitespace-nowrap align-top" style={{ color: 'var(--ink-900)' }}>
                        {fmtDate(inv.invoiceDate)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <FolioCell inv={inv} />
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
                        <div style={{ color: 'var(--ink-900)' }}>{inv.emitterName}</div>
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.emitterRfc}</code>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div style={{ color: 'var(--ink-900)' }}>{inv.receiverName}</div>
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.receivedRfc}</code>
                      </td>
                      <td className="px-3 py-3 align-top min-w-[260px]">
                        <div className="flex flex-col gap-2.5">
                          {(inv.retenciones ?? []).map((r, i) => (
                            <RetencionBlock key={`${inv.invoiceId}-${i}`} r={r} />
                          ))}
                        </div>
                      </td>
                      <td
                        className="px-3 py-3 whitespace-nowrap align-top font-semibold"
                        style={{ ...MONO, color: 'var(--ink-900)' }}
                      >
                        {money(inv.totalRetenido ?? null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
              El periodo que aparece en cada retención es el que declara el propio CFDI y puede no
              coincidir con el de la declaración ({periodo}).
            </p>

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
        ) : (
          <>
            <TotalesResumen
              caption={`${visibles.length} comprobantes en pantalla`}
              entries={[
                ['Subtotal', money(totales.subTotal)],
                ['Total', money(totales.total)],
              ]}
            />

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Fecha', 'Folio / UUID', 'Tipo', 'Comprobante', 'Emisor', 'Receptor', 'Subtotal', 'Total', 'Clasificación'].map((h) => (
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
                  {visibles.map((inv) => {
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
                        <td className="px-3 py-3 align-top">
                          <FolioCell inv={inv} />
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
                                fg="var(--violet-ink)"
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

/**
 * Suma de los comprobantes visibles. Es sobre la página cargada y con los filtros
 * puestos, no sobre el universo del periodo: el `caption` lo dice para que el
 * contador no lea el número como el total de la declaración.
 */
function TotalesResumen({
  caption,
  entries,
}: {
  caption: string
  entries: [string, string][]
}) {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <span
        className="text-[11.5px] font-bold uppercase tracking-wider"
        style={{ color: 'var(--ink-500)' }}
      >
        {caption}
      </span>
      {entries.map(([label, value]) => (
        <span key={label} className="flex items-baseline gap-1.5">
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            {label}
          </span>
          <span className="text-[15px] font-extrabold" style={{ ...MONO, color: 'var(--ink-900)' }}>
            {value}
          </span>
        </span>
      ))}
    </div>
  )
}
