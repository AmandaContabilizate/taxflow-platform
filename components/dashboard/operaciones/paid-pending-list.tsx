'use client'

import { Eye, Loader2, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getPaidPendingDeclarations } from '@/features/operations/actions/getPaidPendingDeclarations.action'
import type { DeclarationKind, PaidPendingDeclaration } from '@/features/operations/types'
import { MONO } from '../constants'
import { Card, ErrorState, HelpBox } from '../ui'
import { DeclarationDetail } from './declaration-detail'

function fmtDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Etiqueta + colores por statusCode (tokens del tema). Fallback neutro. */
function statusStyle(code: string): { label: string; bg: string; color: string } {
  switch (code) {
    case 'PendientePago':
      return { label: 'Pendiente de pago', bg: 'var(--coral-soft)', color: '#9E3A15' }
    case 'Pendiente':
      return { label: 'Por presentar', bg: 'var(--coral-soft)', color: '#9E3A15' }
    case 'EnProceso':
      return { label: 'En proceso', bg: 'var(--amber-soft)', color: '#7B5312' }
    case 'Presentada':
      return { label: 'Presentada', bg: 'var(--brand-100)', color: '#00A068' }
    case 'PresentadaManual':
      return { label: 'Presentada (manual)', bg: 'var(--brand-100)', color: '#00A068' }
    case 'PresentadaPrevio':
      return { label: 'Presentada previamente', bg: 'var(--brand-100)', color: '#00A068' }
    case 'PresentadaExterno':
      return { label: 'Presentada (SAT)', bg: 'var(--brand-100)', color: '#00A068' }
    case 'Completada':
      return { label: 'Completada', bg: 'var(--brand-100)', color: '#00A068' }
    default:
      return { label: code || '—', bg: 'var(--ink-50)', color: 'var(--ink-700)' }
  }
}

interface Props {
  kind: DeclarationKind
  help: string
  searchPlaceholder?: string
  emptyText?: string
}

export function PaidPendingList({ kind, help, searchPlaceholder, emptyText }: Props) {
  const [rows, setRows] = useState<PaidPendingDeclaration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [onlyMine, setOnlyMine] = useState(false)
  const [selected, setSelected] = useState<PaidPendingDeclaration | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      const res = await getPaidPendingDeclarations(kind, 0, 500, onlyMine)
      if (cancelled) return
      if (res.success) setRows(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [kind, onlyMine])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.legalName.toLowerCase().includes(q) ||
        r.rfc.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.periodo.toLowerCase().includes(q),
    )
  }, [rows, search])

  // Vista detalle — se abre al pulsar "Ver".
  if (selected) {
    return <DeclarationDetail declaration={selected} onBack={() => setSelected(null)} />
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <HelpBox>{help}</HelpBox>

      {/* Buscador */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search
              size={16}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }}
            />
            <input
              type="text"
              placeholder={searchPlaceholder ?? 'Buscar por nombre, RFC, correo o periodo…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>
      </Card>

      {/* Encabezado / contador + filtro por contador */}
      <div className="flex items-center justify-between gap-3 px-1 flex-wrap">
        <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          {loading ? 'Cargando…' : `${filtered.length} ${filtered.length === 1 ? 'declaración' : 'declaraciones'}`}
        </div>
        <div
          className="inline-flex rounded-xl p-0.5"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          <ScopeButton active={!onlyMine} onClick={() => setOnlyMine(false)}>
            Todas
          </ScopeButton>
          <ScopeButton active={onlyMine} onClick={() => setOnlyMine(true)}>
            Mis declaraciones
          </ScopeButton>
        </div>
      </div>

      {error ? (
        <Card>
          <ErrorState message={error} />
        </Card>
      ) : loading ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando declaraciones…
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <div style={{ color: 'var(--ink-500)' }}>{emptyText ?? 'No hay declaraciones pendientes'}</div>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => {
            const st = statusStyle(r.statusCode)
            return (
              <Card key={r.declarationId}>
                <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    {/* Nombre + RFC + estado */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[16px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                        {r.legalName}
                      </span>
                      <code
                        className="px-2 py-0.5 rounded-md"
                        style={{ ...MONO, fontSize: '11px', background: 'var(--muted)', color: 'var(--ink-700)' }}
                      >
                        {r.rfc}
                      </code>
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-bold"
                        style={{ background: st.bg, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>

                    {/* Datos en grid */}
                    <div className="grid gap-x-8 gap-y-2 mt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      <Field label="Ejercicio" value={String(r.fiscalYear)} />
                      <Field label="Período" value={r.periodo} />
                      <Field label="Tipo" value={r.periodicity ?? '—'} />
                      <Field label="Fecha de activación" value={fmtDate(r.assignedAt)} />
                      <Field label="Correo" value={r.email} />
                      <Field label="Teléfono" value={r.phone ?? '—'} />
                      <Field label="Venta" value={`#${r.saleId} · ${fmtDate(r.saleDate)}`} />
                      <Field label="Contador asignado" value={r.accountantName ?? 'Sin asignar'} />
                    </div>
                  </div>

                  {/* Acción */}
                  <button
                    onClick={() => setSelected(r)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-90 active:scale-[0.98] flex-shrink-0"
                    style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
                  >
                    <Eye size={16} /> Ver
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ScopeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="px-3.5 py-1.5 rounded-lg text-[13px] font-bold transition"
      style={
        active
          ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
          : { background: 'transparent', color: 'var(--ink-500)' }
      }
    >
      {children}
    </button>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>
        {label}:{' '}
      </span>
      <span className="text-[13px] font-semibold break-words" style={{ color: 'var(--ink-900)' }}>
        {value}
      </span>
    </div>
  )
}
