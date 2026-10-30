'use client'

import { ChevronLeft, ChevronRight, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Result } from '@/lib/common'
import type { Paged, TaxpayerRegimen } from '@/features/taxpayers/types'

type Fetcher<T> = (p: {
  skip: number
  take: number
  rfc?: string
  regimeId?: number
  minSales?: number
}) => Promise<Result<Paged<T>, { message: string }>>

interface PagedListState<T> {
  items: T[]
  total: number
  skip: number
  take: number
  page: number
  totalPages: number
  loading: boolean
  error: string | null
  rfc: string
  setRfc: (value: string) => void
  regimeId: number | ''
  setRegimeId: (value: number | '') => void
  minSales: number | ''
  setMinSales: (value: number | '') => void
  nextPage: () => void
  prevPage: () => void
  reload: () => void
  /** Regresa a la primera página (útil al cambiar filtros externos al hook). */
  resetPage: () => void
}

/**
 * Lista paginada server-side con filtros por RFC (debounced), régimen y
 * mínimo de ventas pagadas. `initialMinSales` es el valor con el que arranca
 * el filtro; el usuario puede cambiarlo desde la pantalla.
 */
export function usePagedList<T>(
  fetcher: Fetcher<T>,
  take = 50,
  initialMinSales: number | '' = '',
): PagedListState<T> {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [rfc, setRfcState] = useState('')
  const [regimeId, setRegimeIdState] = useState<number | ''>('')
  const [minSales, setMinSalesState] = useState<number | ''>(initialMinSales)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const trimmed = rfc.trim()
    if (trimmed.length > 0 && trimmed.length < 3) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const delay = trimmed ? 350 : 0
    const handle = setTimeout(async () => {
      const res = await fetcher({
        skip,
        take,
        rfc: trimmed || undefined,
        regimeId: regimeId || undefined,
        minSales: minSales || undefined,
      })
      if (cancelled) return
      if (res.success) {
        setItems(res.value.items)
        setTotal(res.value.total)
      } else {
        setError(res.error.message)
        setItems([])
        setTotal(0)
      }
      setLoading(false)
    }, delay)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [fetcher, skip, take, rfc, regimeId, minSales, reloadKey])

  const setRfc = (value: string) => {
    setSkip(0)
    setRfcState(value)
  }

  const setRegimeId = (value: number | '') => {
    setSkip(0)
    setRegimeIdState(value)
  }

  const setMinSales = (value: number | '') => {
    setSkip(0)
    setMinSalesState(value)
  }

  return {
    items,
    total,
    skip,
    take,
    page: Math.floor(skip / take) + 1,
    totalPages: Math.max(1, Math.ceil(total / take)),
    loading,
    error,
    rfc,
    setRfc,
    regimeId,
    setRegimeId,
    minSales,
    setMinSales,
    nextPage: () => setSkip((s) => (s + take < total ? s + take : s)),
    prevPage: () => setSkip((s) => Math.max(0, s - take)),
    reload: () => setReloadKey((k) => k + 1),
    resetPage: () => setSkip(0),
  }
}

/**
 * Catálogo de regímenes para el filtro. No hay endpoint de catálogo, así que se
 * acumula con los regímenes que van apareciendo en los resultados: al filtrar
 * por uno, la opción activa no desaparece de la lista.
 */
export function useRegimenOptions(items: { regimenes?: TaxpayerRegimen[] }[]) {
  const [seen, setSeen] = useState<Map<number, TaxpayerRegimen>>(new Map())

  useEffect(() => {
    setSeen((prev) => {
      let changed = false
      const next = new Map(prev)
      for (const it of items) {
        for (const r of it.regimenes ?? []) {
          if (!next.has(r.id)) {
            next.set(r.id, r)
            changed = true
          }
        }
      }
      return changed ? next : prev
    })
  }, [items])

  return [...seen.values()].sort((a, b) => a.satCode.localeCompare(b.satCode))
}

const SELECT_STYLE = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--ink-700)',
} as const

const MIN_SALES_OPTIONS = [2, 3, 4, 5, 6]

/**
 * Filtro por mínimo de ventas pagadas. `allLabel` cambia según la pantalla:
 * en el padrón "" son todos los contribuyentes; en clientes/mi cartera el
 * endpoint ya exige al menos una venta.
 */
export function MinSalesFilter({
  value,
  onChange,
  allLabel = 'Todas las ventas',
  className = '',
}: {
  value: number | ''
  onChange: (v: number | '') => void
  allLabel?: string
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      title="Mínimo de ventas pagadas"
      className={`px-3 py-2.5 rounded-lg text-[13px] font-semibold ${className}`}
      style={SELECT_STYLE}
    >
      <option value="">{allLabel}</option>
      {MIN_SALES_OPTIONS.map((n) => (
        <option key={n} value={n}>
          {n}+ ventas pagadas{n === 2 ? ' (renovaron)' : ''}
        </option>
      ))}
    </select>
  )
}

/** Filtros compartidos del padrón: RFC + régimen + ventas pagadas. */
export function TaxpayerFilters({
  rfc,
  onRfcChange,
  regimeId,
  onRegimeChange,
  regimenes,
  placeholder,
  minSales,
  onMinSalesChange,
  minSalesAllLabel,
}: {
  rfc: string
  onRfcChange: (v: string) => void
  regimeId: number | ''
  onRegimeChange: (v: number | '') => void
  regimenes: TaxpayerRegimen[]
  placeholder?: string
  minSales?: number | ''
  onMinSalesChange?: (v: number | '') => void
  minSalesAllLabel?: string
}) {
  const hasMinSales = onMinSalesChange !== undefined
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 min-w-0">
        <SearchBar value={rfc} onChange={onRfcChange} placeholder={placeholder} />
      </div>
      <select
        value={regimeId}
        onChange={(e) => onRegimeChange(e.target.value ? Number(e.target.value) : '')}
        className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[290px]"
        style={SELECT_STYLE}
      >
        <option value="">Todos los regímenes</option>
        {regimenes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.satCode} · {r.name}
          </option>
        ))}
      </select>
      {hasMinSales && (
        <MinSalesFilter
          value={minSales ?? ''}
          onChange={onMinSalesChange}
          allLabel={minSalesAllLabel}
          className="sm:w-[215px]"
        />
      )}
      {(rfc || regimeId || (hasMinSales && minSales)) && (
        <button
          type="button"
          onClick={() => {
            onRfcChange('')
            onRegimeChange('')
            onMinSalesChange?.('')
          }}
          className="px-3.5 py-2.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--ink-700)' }}
        >
          Limpiar
        </button>
      )}
    </div>
  )
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Buscar por RFC, correo, nombre o teléfono…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const trimmed = value.trim()
  const isShort = trimmed.length > 0 && trimmed.length < 3

  return (
    <div className="relative flex flex-col gap-1">
      <div className="relative">
        <Search
          size={16}
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[13.5px]"
          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        />
      </div>
      {isShort && (
        <span className="text-[11.5px] font-semibold text-amber-500 dark:text-amber-400 flex items-center gap-1 pl-1 animate-in fade-in duration-200">
          <span>ℹ️</span> Ingresa al menos 3 caracteres para buscar
        </span>
      )}
    </div>
  )
}

/** Chips de regímenes (satCode con tooltip del nombre). */
export function RegimenesCell({ regimenes }: { regimenes: TaxpayerRegimen[] }) {
  if (!regimenes || regimenes.length === 0) {
    return <span className="text-xs" style={{ color: 'var(--ink-500)' }}>—</span>
  }
  const shown = regimenes.slice(0, 3)
  const rest = regimenes.length - shown.length
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((r) => (
        <span
          key={r.id}
          title={r.name}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          {r.satCode}
        </span>
      ))}
      {rest > 0 && (
        <span
          title={regimenes.slice(3).map((r) => `${r.satCode} · ${r.name}`).join('\n')}
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
        >
          +{rest}
        </span>
      )}
    </div>
  )
}

/** Conteo de ventas pagadas; resalta a los que renovaron (2+). */
export function VentasPagadasCell({ ventas }: { ventas: number }) {
  const recurrente = ventas >= 2
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-md text-[12px] font-extrabold"
        style={
          recurrente
            ? { background: 'var(--brand-100)', color: 'var(--brand-700)' }
            : { background: 'var(--ink-50)', color: 'var(--ink-700)' }
        }
      >
        {ventas ?? 0}
      </span>
      {recurrente && (
        <span className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>
          renovó
        </span>
      )}
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  total,
  skip,
  take,
  itemCount,
  onPrev,
  onNext,
  pageSizeOptions,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  total: number
  skip: number
  take: number
  itemCount: number
  onPrev: () => void
  onNext: () => void
  /** Si viene, muestra el selector "por página" junto al rango. */
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}) {
  const from = total === 0 ? 0 : skip + 1
  const to = skip + itemCount
  // Botones de paginación: feedback inmediato (ease-out fuerte + scale al presionar),
  // sin animar el cambio de contenido — es una acción frecuente.
  const navBtn =
    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ' +
    'transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] ' +
    'hover:bg-[var(--ink-100)] active:scale-[0.97] ' +
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--ink-50)] disabled:active:scale-100'
  return (
    <div
      className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="text-[12.5px] tabular-nums" style={{ color: 'var(--ink-500)' }}>
          {from}–{to} de {total}
        </div>
        {pageSizeOptions && onPageSizeChange && (
          <label className="inline-flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-500)' }}>
            <select
              value={take}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Resultados por página"
              className="px-2 py-1 rounded-md text-[12px] font-semibold cursor-pointer transition-colors duration-150"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            por página
          </label>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className={navBtn}
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: 'var(--ink-700)' }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className={navBtn}
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
