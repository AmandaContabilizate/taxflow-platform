'use client'

import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  Columns3,
  Copy,
  Loader2,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getDeclarationInvoices } from '@/features/operations/actions/getDeclarationInvoices.action'
import type {
  DeclarationInvoice,
  DeclarationInvoiceConcepto,
  InvoiceSortBy,
  InvoiceSortDir,
  Paged,
  Retencion,
} from '@/features/operations/types'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Card } from '../ui'
import { useUrlState } from '../url-state'

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

/** Columnas seleccionables (Fecha y Folio/UUID son fijas, no van aquí). */
type ColumnKey =
  | 'tipo'
  | 'comprobante'
  | 'emisor'
  | 'receptor'
  | 'subtotal'
  | 'iva'
  | 'total'
  | 'metodoPago'
  | 'formaPago'
  | 'conceptos'
  | 'clasificacion'

const COLUMN_DEFS: { key: ColumnKey; label: string }[] = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'comprobante', label: 'Comprobante' },
  { key: 'emisor', label: 'Emisor' },
  { key: 'receptor', label: 'Receptor' },
  { key: 'subtotal', label: 'Subtotal' },
  { key: 'iva', label: 'IVA' },
  { key: 'total', label: 'Total' },
  { key: 'metodoPago', label: 'Método de pago' },
  { key: 'formaPago', label: 'Forma de pago' },
  { key: 'conceptos', label: 'Conceptos' },
  { key: 'clasificacion', label: 'Clasificación' },
]

/** Columnas que la tabla ya mostraba, más IVA (nueva). */
const DEFAULT_COLUMNS: ColumnKey[] = [
  'tipo',
  'comprobante',
  'emisor',
  'receptor',
  'subtotal',
  'iva',
  'total',
  'clasificacion',
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

/** Nombre resuelto por el backend; el id crudo solo se ve si el catálogo no vino. */
function CatalogCell({ name, id }: { name: string | null; id: number | string | null }) {
  if (name) return <span style={{ color: 'var(--ink-700)' }}>{name}</span>
  if (id != null) {
    return (
      <span style={{ color: 'var(--ink-500)' }} title="Catálogo no resuelto por el backend">
        #{id}
      </span>
    )
  }
  return <span style={{ color: 'var(--ink-500)' }}>—</span>
}

/** Conceptos: resumen siempre visible; con más de uno, popover con el detalle completo. */
function ConceptosCell({
  inv,
  concepts,
  loading,
  error,
  onOpen,
}: {
  inv: DeclarationInvoice
  concepts: DeclarationInvoiceConcepto[] | undefined
  loading: boolean
  error: string | null
  onOpen: () => void
}) {
  if (!inv.conceptosResumen && inv.conceptosCount === 0) {
    return <span style={{ color: 'var(--ink-500)' }}>—</span>
  }
  if (inv.conceptosCount <= 1) {
    return <span style={{ color: 'var(--ink-700)' }}>{inv.conceptosResumen ?? '—'}</span>
  }

  return (
    <Popover onOpenChange={(open) => open && onOpen()}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="text-left underline decoration-dotted underline-offset-2"
          style={{ color: 'var(--brand-700)' }}
        >
          {inv.conceptosResumen}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-72 overflow-y-auto">
        <div className="text-[12px] font-bold mb-2" style={{ color: 'var(--foreground)' }}>
          {inv.conceptosCount} conceptos
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-[12px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={14} className="animate-spin" /> Cargando…
          </div>
        ) : error && !concepts ? (
          <div className="text-[12px]" style={{ color: 'var(--violet-ink)' }}>{error}</div>
        ) : (
          <div className="flex flex-col gap-2">
            {(concepts ?? []).map((c, i) => (
              <div
                key={i}
                className="text-[12px] pb-2"
                style={i < (concepts?.length ?? 0) - 1 ? { borderBottom: '1px solid var(--border)' } : undefined}
              >
                <div className="font-semibold" style={{ color: 'var(--foreground)' }}>
                  {c.description ?? 'Sin descripción'}
                </div>
                <div style={{ color: 'var(--ink-500)' }}>
                  {c.productCode ?? '—'} · {c.quantity ?? '—'} × {money(c.unitPrice)} = {money(c.subtotal)}
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

/** Modal selector de columnas: Fecha y Folio/UUID son fijas y no aparecen aquí. */
function ColumnsModal({
  open,
  onOpenChange,
  selected,
  onChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selected: ColumnKey[]
  onChange: (next: ColumnKey[]) => void
}) {
  const toggle = (key: ColumnKey) => {
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key])
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Columnas de la tabla</DialogTitle>
          <DialogDescription>Fecha y Folio / UUID siempre se muestran.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1 max-h-[55vh] overflow-y-auto -mx-1 px-1">
          {COLUMN_DEFS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-muted"
            >
              <Checkbox checked={selected.includes(key)} onCheckedChange={() => toggle(key)} />
              <span className="text-[13px]" style={{ color: 'var(--foreground)' }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: InvoiceSortDir }) {
  if (!active) return <ArrowUpDown size={12} style={{ opacity: 0.45 }} />
  return dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: InvoiceSortDir
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 font-extrabold whitespace-nowrap"
      style={{ color: active ? 'var(--brand-700)' : 'var(--ink-700)' }}
    >
      {label}
      <SortIcon active={active} dir={dir} />
    </button>
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

/** Solo el 625 depende de las constancias de retención para sus ingresos. */
const REGIMEN_PLATAFORMAS = '625'

export function ComprobantesTab({
  declarationId,
  periodo,
  regimeSatCode,
}: {
  declarationId: number
  periodo: string
  regimeSatCode?: string | null
}) {
  const { params, setParams } = useUrlState()

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
  const [columnsModalOpen, setColumnsModalOpen] = useState(false)

  // Orden server-side (E2): persistido en la URL, no se ordena en cliente.
  const sortBy: InvoiceSortBy = params.get('sortBy') === 'total' ? 'total' : 'invoiceDate'
  const sortDir: InvoiceSortDir = params.get('sortDir') === 'desc' ? 'desc' : 'asc'

  const setSort = (col: InvoiceSortBy) => {
    setParams(
      { sortBy: col, sortDir: sortBy === col && sortDir === 'asc' ? 'desc' : 'asc' },
      { replace: true },
    )
    setSkip(0)
  }

  // Selección de columnas persistida en la URL. `cols=none` distingue "el
  // usuario las quitó todas" de "no hay parámetro todavía" (default).
  const rawCols = params.get('cols')
  const selectedCols = useMemo<ColumnKey[]>(() => {
    if (rawCols == null) return DEFAULT_COLUMNS
    if (rawCols === 'none') return []
    const set = new Set(rawCols.split(','))
    return COLUMN_DEFS.map((d) => d.key).filter((k) => set.has(k))
  }, [rawCols])

  const setSelectedCols = (next: ColumnKey[]) => {
    setParams({ cols: next.length === 0 ? 'none' : next.join(',') }, { replace: true })
  }

  // En egresos el IVA es justo el dato que el contador vino a buscar: se
  // activa aunque el usuario lo haya desmarcado (D4).
  const effectiveColSet = useMemo(() => {
    const set = new Set(selectedCols)
    if (tipo === '2') set.add('iva')
    return set
  }, [selectedCols, tipo])
  const visibleColumns = COLUMN_DEFS.filter((d) => effectiveColSet.has(d.key))

  // Conceptos completos: solo se piden bajo demanda (`includeConcepts=true`),
  // cacheados por invoiceId para no repetir la llamada al reabrir el popover.
  const [conceptsCache, setConceptsCache] = useState<Record<number, DeclarationInvoiceConcepto[]>>({})
  const [conceptsLoadingId, setConceptsLoadingId] = useState<number | null>(null)
  const [conceptsError, setConceptsError] = useState<string | null>(null)

  const loadConcepts = async (invoiceId: number) => {
    if (conceptsCache[invoiceId]) return
    setConceptsLoadingId(invoiceId)
    setConceptsError(null)
    const res = await getDeclarationInvoices({
      declarationId,
      isIssued: origen === '' ? undefined : origen === 'true',
      invoiceTypeId: tipo === '' ? undefined : Number(tipo),
      clasificada: clasificada === '' ? undefined : clasificada === 'true',
      skip,
      take: TAKE,
      sortBy,
      sortDir,
      includeConcepts: true,
    })
    if (res.success) {
      setConceptsCache((prev) => {
        const next = { ...prev }
        for (const it of res.value.items) if (it.conceptos) next[it.invoiceId] = it.conceptos
        return next
      })
    } else {
      setConceptsError(res.error.message)
    }
    setConceptsLoadingId(null)
  }

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
        sortBy,
        sortDir,
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
  }, [declarationId, skip, origen, tipo, clasificada, sortBy, sortDir])

  // Cambiar un filtro reinicia la paginación: el `total` del backend cambia.
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setSkip(0)
    setter(v)
  }

  // El backend no filtra por texto: se busca sobre la página cargada. El
  // orden ya viene resuelto por el backend (E2) — no se reordena en cliente.
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return page.items
    return page.items.filter((i) =>
      [i.folio, i.serie, i.uuid, i.emitterRfc, i.emitterName, i.receivedRfc, i.receiverName, i.clasificacion]
        .some((f) => f?.toLowerCase().includes(q)),
    )
  }, [page.items, query])

  // Los CFDI de retenciones no tienen TipoDeComprobante: el backend los marca con
  // `esRetencion` y viven en su propia sub-pestaña. Selector y orden no les aplican.
  const normales = useMemo(() => rows.filter((i) => !i.esRetencion), [rows])
  const retenciones = useMemo(() => rows.filter((i) => i.esRetencion), [rows])
  const visibles = subTab === 1 ? retenciones : normales

  // Base para el aviso de "sin constancias": sobre `page.items` (sin el filtro
  // de búsqueda de texto), para que el aviso no dependa de lo que el usuario
  // haya escrito en el buscador.
  const sinConstanciasDeRetencion = useMemo(
    () => !loading && !error && page.items.every((i) => !i.esRetencion),
    [loading, error, page.items],
  )
  const esRegimenPlataformas = regimeSatCode === REGIMEN_PLATAFORMAS

  // Suma de lo que se está viendo: cambia con los filtros, la búsqueda y la
  // página, así que el encabezado dice explícitamente sobre qué se sumó.
  const totales = useMemo(() => {
    const ivaResueltos = visibles.filter((i) => i.ivaAmount != null)
    return {
      subTotal: visibles.reduce((acc, i) => acc + toNumber(i.subTotal), 0),
      total: visibles.reduce((acc, i) => acc + toNumber(i.total), 0),
      retenido: visibles.reduce((acc, i) => acc + toNumber(i.totalRetenido), 0),
      iva: ivaResueltos.reduce((acc, i) => acc + toNumber(i.ivaAmount), 0),
      ivaResuelto: ivaResueltos.length > 0,
    }
  }, [visibles])

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
          {subTab === 0 && (
            <button
              type="button"
              onClick={() => setColumnsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              <Columns3 size={14} /> Columnas
            </button>
          )}
        </div>

        {esRegimenPlataformas && sinConstanciasDeRetencion && (
          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-2.5 text-[13px]"
            style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              No se recibieron constancias de retención para este periodo; en el régimen 625 los
              ingresos provienen de ellas. Un <strong>$0.00</strong> en Ingresos/IVA/ISR puede
              significar que la constancia no llegó, no que no hubo ingresos.
            </span>
          </div>
        )}

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
                ...(effectiveColSet.has('iva')
                  ? ([['IVA (en esta página)', totales.ivaResuelto ? money(totales.iva) : '—']] as [string, string][])
                  : []),
              ]}
            />

            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      <SortableHeader
                        label="Fecha"
                        active={sortBy === 'invoiceDate'}
                        dir={sortDir}
                        onClick={() => setSort('invoiceDate')}
                      />
                    </th>
                    <th className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      Folio / UUID
                    </th>
                    {visibleColumns.map((col) => (
                      <th
                        key={col.key}
                        className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap"
                        style={{ color: 'var(--ink-700)' }}
                      >
                        {col.key === 'total' ? (
                          <SortableHeader
                            label="Total"
                            active={sortBy === 'total'}
                            dir={sortDir}
                            onClick={() => setSort('total')}
                          />
                        ) : (
                          col.label
                        )}
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
                        {visibleColumns.map((col) => (
                          <td key={col.key} className="px-3 py-3 align-top">
                            {col.key === 'tipo' && (
                              <Chip
                                bg={inv.isIssued ? 'var(--sky-soft)' : 'var(--ink-50)'}
                                fg={inv.isIssued ? 'var(--sky)' : 'var(--ink-700)'}
                              >
                                {inv.isIssued ? 'Emitida' : 'Recibida'}
                              </Chip>
                            )}
                            {col.key === 'comprobante' && (
                              <div className="flex flex-col gap-1 items-start">
                                <span style={{ color: 'var(--ink-700)' }}>{inv.tipoComprobante}</span>
                                {inv.esNomina && (
                                  <Chip bg="var(--violet-soft)" fg="var(--violet)">Nómina</Chip>
                                )}
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
                            )}
                            {col.key === 'emisor' && (
                              <>
                                <div style={{ color: 'var(--ink-900)' }}>{inv.emitterName}</div>
                                <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.emitterRfc}</code>
                              </>
                            )}
                            {col.key === 'receptor' && (
                              <>
                                <div style={{ color: 'var(--ink-900)' }}>{inv.receiverName}</div>
                                <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.receivedRfc}</code>
                              </>
                            )}
                            {col.key === 'subtotal' && (
                              <span className="whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
                                {money(inv.subTotal)}
                              </span>
                            )}
                            {col.key === 'iva' && (
                              <span className="whitespace-nowrap font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                                {money(inv.ivaAmount)}
                              </span>
                            )}
                            {col.key === 'total' && (
                              <span className="whitespace-nowrap font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                                {money(inv.total)}
                              </span>
                            )}
                            {col.key === 'metodoPago' && (
                              <CatalogCell name={inv.paymentMethodName} id={inv.paymentMethodId} />
                            )}
                            {col.key === 'formaPago' && (
                              <CatalogCell name={inv.wayOfPaymentName} id={inv.wayOfPaymentId} />
                            )}
                            {col.key === 'conceptos' && (
                              <ConceptosCell
                                inv={inv}
                                concepts={conceptsCache[inv.invoiceId]}
                                loading={conceptsLoadingId === inv.invoiceId}
                                error={conceptsError}
                                onOpen={() => void loadConcepts(inv.invoiceId)}
                              />
                            )}
                            {col.key === 'clasificacion' && <ClasificacionCell inv={inv} />}
                          </td>
                        ))}
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

      <ColumnsModal
        open={columnsModalOpen}
        onOpenChange={setColumnsModalOpen}
        selected={selectedCols}
        onChange={setSelectedCols}
      />
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
