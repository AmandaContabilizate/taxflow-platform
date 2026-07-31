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
  nextPage: () => void
  prevPage: () => void
  reload: () => void
}

/** Lista paginada server-side con filtros por RFC (debounced) y régimen. */
export function usePagedList<T>(fetcher: Fetcher<T>, take = 50): PagedListState<T> {
  const [items, setItems] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [rfc, setRfcState] = useState('')
  const [regimeId, setRegimeIdState] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const delay = rfc ? 350 : 0
    const handle = setTimeout(async () => {
      const res = await fetcher({
        skip,
        take,
        rfc: rfc.trim() || undefined,
        regimeId: regimeId || undefined,
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
  }, [fetcher, skip, take, rfc, regimeId, reloadKey])

  const setRfc = (value: string) => {
    setSkip(0)
    setRfcState(value)
  }

  const setRegimeId = (value: number | '') => {
    setSkip(0)
    setRegimeIdState(value)
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
    nextPage: () => setSkip((s) => (s + take < total ? s + take : s)),
    prevPage: () => setSkip((s) => Math.max(0, s - take)),
    reload: () => setReloadKey((k) => k + 1),
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

/** Filtros compartidos del padrón: RFC + régimen. */
export function TaxpayerFilters({
  rfc,
  onRfcChange,
  regimeId,
  onRegimeChange,
  regimenes,
  placeholder,
}: {
  rfc: string
  onRfcChange: (v: string) => void
  regimeId: number | ''
  onRegimeChange: (v: number | '') => void
  regimenes: TaxpayerRegimen[]
  placeholder?: string
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1 min-w-0">
        <SearchBar value={rfc} onChange={onRfcChange} placeholder={placeholder} />
      </div>
      <select
        value={regimeId}
        onChange={(e) => onRegimeChange(e.target.value ? Number(e.target.value) : '')}
        className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[290px]"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
      >
        <option value="">Todos los regímenes</option>
        {regimenes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.satCode} · {r.name}
          </option>
        ))}
      </select>
      {(rfc || regimeId) && (
        <button
          type="button"
          onClick={() => {
            onRfcChange('')
            onRegimeChange('')
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
  placeholder = 'Buscar por RFC…',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
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
        className="w-full pl-10 pr-4 py-2.5 rounded-lg"
        style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
      />
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

export function Pagination({
  page,
  totalPages,
  total,
  skip,
  take,
  itemCount,
  onPrev,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  skip: number
  take: number
  itemCount: number
  onPrev: () => void
  onNext: () => void
}) {
  const from = total === 0 ? 0 : skip + 1
  const to = skip + itemCount
  return (
    <div
      className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3 border-t"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
        {from}–{to} de {total}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={14} /> Anterior
        </button>
        <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          Siguiente <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
