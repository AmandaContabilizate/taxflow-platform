'use client'

import { ArrowRight, Link2, Loader2, RefreshCw, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  reissuePaymentLinkOnBehalf,
  type VendorPaymentLink,
} from '@/features/account/actions/registerSaleOnBehalf.action'
import { getLigasPago } from '@/features/operations/actions/getLigasPago.action'
import type { LigaPago, LigaPagoEstado, LigasPagoPage } from '@/features/operations/types'
import { PaymentLinkPanel } from '../clientes/armar-venta-modal'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Badge, type BadgeKind, Card, ErrorState } from '../ui'

const TAKE = 50

const EMPTY: LigasPagoPage = { items: [], total: 0, skip: 0, take: TAKE, porEstado: {} }

const ESTADOS: Record<LigaPagoEstado, { label: string; kind: BadgeKind }> = {
  Vigente: { label: 'Vigente', kind: 'brand' },
  Vencida: { label: 'Vencida', kind: 'amber' },
  Pagada: { label: 'Pagada', kind: 'sky' },
  Cancelada: { label: 'Cancelada', kind: 'default' },
}
const ESTADO_ORDER: LigaPagoEstado[] = ['Vigente', 'Vencida', 'Pagada', 'Cancelada']

const money = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const chipStyle = (active: boolean) =>
  active
    ? { background: 'var(--ink-900)', color: '#fff' }
    : { background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--ink-700)' }

/**
 * Pestaña "Ligas de pago" de Ventas por activar (spec-liga-de-pago-vendedor): todas las ligas
 * emitidas desde el backoffice con su estado, sin entrar cliente por cliente. Re-emitir (vencida) o
 * ver de nuevo (vigente) usan el mismo endpoint: renuevan la vigencia sobre el mismo cobro.
 */
export function LigasPagoTab({
  canEmitir,
  onOpenExpediente,
}: {
  canEmitir: boolean
  onOpenExpediente: (taxpayerId: number) => void
}) {
  const [page, setPage] = useState<LigasPagoPage>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<LigaPagoEstado | ''>('')
  const [soloMias, setSoloMias] = useState(false)
  const [skip, setSkip] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getLigasPago({ skip, take: TAKE, search: query || undefined, estado: estado || undefined, soloMias })
    if (res.success) setPage(res.value)
    else {
      setError(res.error.message)
      setPage(EMPTY)
    }
    setLoading(false)
  }, [skip, query, estado, soloMias])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = setTimeout(() => {
      setSkip(0)
      setQuery(search.trim())
    }, 350)
    return () => clearTimeout(id)
  }, [search])

  const totalPages = Math.max(1, Math.ceil(page.total / TAKE))
  const totalTodas = Object.values(page.porEstado).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex gap-2 flex-wrap items-center">
        <button type="button" onClick={() => { setEstado(''); setSkip(0) }} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={chipStyle(estado === '')}>
          Todas · {totalTodas}
        </button>
        {ESTADO_ORDER.filter((e) => (page.porEstado[e] ?? 0) > 0).map((e) => (
          <button key={e} type="button" onClick={() => { setEstado(e === estado ? '' : e); setSkip(0) }} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold" style={chipStyle(estado === e)}>
            {ESTADOS[e].label} · {page.porEstado[e]}
          </button>
        ))}
        <label className="ml-auto inline-flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer select-none" style={{ color: 'var(--ink-700)' }}>
          <input type="checkbox" checked={soloMias} onChange={(e) => { setSoloMias(e.target.checked); setSkip(0) }} className="accent-[var(--brand-600)]" />
          Solo mis ligas
        </label>
      </div>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${page.total} ${page.total === 1 ? 'liga' : 'ligas'}`}
          </div>
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-500)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por RFC, nombre, correo o vendedor…"
              className="w-full rounded-xl pl-9 pr-3 py-2 text-[13px] outline-none"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
          </div>
        </div>

        {error ? (
          <div className="flex-1 flex flex-col justify-center"><ErrorState message={error} /></div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando ligas…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Plan', 'Monto', 'Emitida', 'Vence', 'Emitida por', 'Estado', ''].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)', background: 'var(--card)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.items.map((l) => (
                    <LigaRow key={l.saleId} liga={l} canEmitir={canEmitir} onOpenExpediente={onOpenExpediente} onChanged={load} />
                  ))}
                </tbody>
              </table>
            </div>

            {page.items.length === 0 ? (
              <div className="text-center py-8 shrink-0" style={{ color: 'var(--ink-500)' }}>
                {soloMias ? 'No has emitido ligas de pago.' : 'Todavía no hay ligas de pago emitidas.'}
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={totalPages}
                total={page.total}
                skip={skip}
                take={TAKE}
                itemCount={page.items.length}
                onPrev={() => setSkip(Math.max(0, skip - TAKE))}
                onNext={() => setSkip(skip + TAKE < page.total ? skip + TAKE : skip)}
              />
            )}
          </>
        )}
      </Card>
    </div>
  )
}

function LigaRow({
  liga,
  canEmitir,
  onOpenExpediente,
  onChanged,
}: {
  liga: LigaPago
  canEmitir: boolean
  onOpenExpediente: (taxpayerId: number) => void
  onChanged: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<VendorPaymentLink | null>(null)
  const [error, setError] = useState<string | null>(null)
  const estado = ESTADOS[liga.estado] ?? { label: liga.estado, kind: 'default' as BadgeKind }
  const abierta = liga.estado === 'Vigente' || liga.estado === 'Vencida'

  async function emitir() {
    setBusy(true)
    setError(null)
    const res = await reissuePaymentLinkOnBehalf(liga.saleId)
    setBusy(false)
    if (!res.success) {
      setError(res.error.message || 'No se pudo emitir la liga.')
      // La venta ya no está abierta: que la lista lo refleje.
      if (res.error.errorCode === 'PAYMENT_SALE_NOT_OPEN') onChanged()
      return
    }
    setLink(res.value)
  }

  return (
    <>
      <tr style={{ borderBottom: link || error ? 'none' : '1px solid var(--border)' }}>
        <td className="px-4 py-3">
          <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{liga.legalName || liga.rfc}</div>
          <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
            {liga.email ?? '—'}{liga.phone ? ` · ${liga.phone}` : ''}
            {!liga.tieneConstancia && <span style={{ color: 'var(--violet-ink)' }}> · sin constancia</span>}
          </div>
        </td>
        <td className="px-4 py-3"><code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{liga.rfc}</code></td>
        <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
          <div>{liga.planes.join(' + ') || '—'}</div>
          {liga.tipo === 'Suscripción' && (
            <div className="mt-0.5 text-[11px] font-bold" style={{ color: 'var(--brand-700)' }}>Suscripción · solo tarjeta · 23 h</div>
          )}
        </td>
        <td className="px-4 py-3 tabular-nums font-semibold" style={{ color: 'var(--ink-900)' }}>{money(liga.amount)}</td>
        <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fecha(liga.saleDate)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-[12.5px]" style={{ color: liga.estado === 'Vencida' ? 'var(--violet-ink)' : 'var(--ink-700)' }}>
          {abierta && liga.ligaVenceAt ? fechaHora(liga.ligaVenceAt) : liga.estado === 'Pagada' ? `Pagada ${fecha(liga.updatedAt)}` : liga.estado === 'Cancelada' ? `Cancelada ${fecha(liga.updatedAt)}` : '—'}
        </td>
        <td className="px-4 py-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
          <div>{liga.emitidaPorNombre ?? '—'}</div>
          {liga.emitidaPorEmail && <div className="text-[11.5px] truncate max-w-[180px]" style={{ color: 'var(--ink-500)' }}>{liga.emitidaPorEmail}</div>}
        </td>
        <td className="px-4 py-3"><Badge kind={estado.kind}>{estado.label}</Badge></td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5">
            {abierta && canEmitir && !link && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void emitir()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-[background-color,transform] duration-150 active:scale-[0.97] disabled:opacity-60"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                {busy ? <Loader2 size={14} className="animate-spin" /> : liga.estado === 'Vigente' ? <Link2 size={14} /> : <RefreshCw size={14} />}
                {liga.estado === 'Vigente' ? 'Ver liga' : 'Re-emitir'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenExpediente(liga.taxpayerId)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-[background-color,transform] duration-150 active:scale-[0.97]"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              Expediente <ArrowRight size={14} />
            </button>
          </div>
        </td>
      </tr>
      {(link || error) && (
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <td colSpan={9} className="px-4 pb-4">
            {link && <PaymentLinkPanel link={link} />}
            {error && (
              <div className="text-[12.5px] font-semibold px-3 py-2 rounded-xl" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>{error}</div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
