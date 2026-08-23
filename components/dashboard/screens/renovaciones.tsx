'use client'

import { AlertCircle, Loader2, PhoneCall, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { getUpcomingRenewals } from '@/features/operations/actions/getUpcomingRenewals.action'
import type { TipoRenovacion, VentaPorVencer } from '@/features/operations/types'
import { periodLabel } from '@/features/account/types'
import { MONO } from '../constants'
import { Card, HelpBox } from '../ui'
import { Pagination, SearchBar } from '../clientes/parts'
import { StripeDetailModal } from '../ventas/stripe-detail-modal'

const TAKE = 50
const DIAS_OPTIONS = [7, 15, 30, 60, 90]

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

const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: 'Activa',
  trialing: 'En prueba',
  past_due: 'Pago vencido',
  canceled: 'Cancelada',
  unpaid: 'Sin pagar',
  incomplete: 'Incompleta',
  incomplete_expired: 'Incompleta expirada',
  paused: 'Pausada',
}

export function RenovacionesScreen() {
  const [items, setItems] = useState<VentaPorVencer[]>([])
  const [total, setTotal] = useState(0)
  const [skip, setSkip] = useState(0)
  const [dias, setDiasState] = useState(30)
  const [tipo, setTipoState] = useState<TipoRenovacion | ''>('')
  const [rfc, setRfcState] = useState('')
  const [incluirVencidas, setIncluirVencidasState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stripeSaleId, setStripeSaleId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    const delay = rfc ? 350 : 0
    const handle = setTimeout(async () => {
      const res = await getUpcomingRenewals({
        skip,
        take: TAKE,
        dias,
        tipo: tipo || undefined,
        rfc: rfc.trim() || undefined,
        incluirVencidas,
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
  }, [skip, dias, tipo, rfc, incluirVencidas])

  const reset = <T,>(setter: (v: T) => void) => (v: T) => {
    setSkip(0)
    setter(v)
  }
  const setDias = reset(setDiasState)
  const setTipo = reset(setTipoState)
  const setRfc = reset(setRfcState)
  const setIncluirVencidas = reset(setIncluirVencidasState)

  const noRenovaran = items.filter((v) => v.renovaraAutomaticamente === false).length

  const selectStyle = {
    background: 'var(--input)',
    border: '1px solid var(--border)',
    color: 'var(--ink-700)',
  }

  return (
    <div className="flex flex-col gap-5 max-w-full h-[calc(100dvh-8.5rem)]">
      <HelpBox>
        Planes que vencen dentro de la ventana que elijas, del más cercano al más lejano. Los que
        aparecen como <b>No renovará</b> ya cancelaron la suscripción en Stripe: esos son los de
        contacto urgente.
      </HelpBox>

      <Card className="shrink-0">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <SearchBar value={rfc} onChange={setRfc} placeholder="Buscar por RFC…" />
          </div>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[185px]"
            style={selectStyle}
          >
            {DIAS_OPTIONS.map((d) => (
              <option key={d} value={d}>
                Próximos {d} días
              </option>
            ))}
          </select>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoRenovacion | '')}
            className="px-3 py-2.5 rounded-lg text-[13px] font-semibold sm:w-[190px]"
            style={selectStyle}
          >
            <option value="">Suscripción y pago único</option>
            <option value="subscription">Solo suscripciones</option>
            <option value="one_time">Solo pago único</option>
          </select>
          <label
            className="inline-flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12.5px] font-semibold cursor-pointer whitespace-nowrap"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
          >
            <input
              type="checkbox"
              checked={incluirVencidas}
              onChange={(e) => setIncluirVencidas(e.target.checked)}
            />
            Incluir vencidas
          </label>
        </div>
      </Card>

      <Card className="flex-1 min-h-0 flex flex-col">
        <div
          className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            {loading ? 'Cargando…' : `${total} por vencer`}
          </div>
          {!loading && noRenovaran > 0 && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
              style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
            >
              <PhoneCall size={13} /> {noRenovaran} sin renovación automática en esta página
            </span>
          )}
        </div>

        {error ? (
          <div className="flex-1 px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
            <AlertCircle size={20} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
              {error}
            </div>
          </div>
        ) : loading ? (
          <div className="flex-1 px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando renovaciones…
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'RFC', 'Plan', 'Vence', 'Renovación', 'Venta'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left font-extrabold"
                        style={{ color: 'var(--ink-700)', background: 'var(--card)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((v) => (
                    <tr key={`${v.saleId}-${v.planId}`} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {v.fullName}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {v.email}
                        </div>
                        {v.phoneNumber && (
                          <div className="text-xs mt-0.5" style={{ ...MONO, color: 'var(--ink-500)' }}>
                            {v.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 align-top">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{v.rfc}</code>
                        <div className="text-[11px] mt-0.5 truncate max-w-[160px]" style={{ color: 'var(--ink-500)' }}>
                          {v.legalName}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-[13px]" style={{ color: 'var(--ink-900)' }}>
                          {v.planNombre}
                        </div>
                        <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {periodLabel(v.billingPeriod)} · {money.format(v.planPrecio)}
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <VenceCell venta={v} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <RenovacionCell venta={v} />
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="font-semibold text-[13px]" style={{ color: 'var(--ink-900)' }}>
                          #{v.saleId}
                        </div>
                        <div className="text-[11.5px] mt-0.5" style={{ ...MONO, color: 'var(--ink-500)' }}>
                          {money.format(v.amount)} · {formatDate(v.saleDate)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setStripeSaleId(v.saleId)}
                          title="Ver datos de Stripe"
                          className="mt-1.5 inline-flex items-center px-2 py-1 rounded-lg border transition hover:bg-[var(--ink-50)]"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          <Image src="/stripe-logo.png" alt="Stripe" width={38} height={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 shrink-0">
                <div style={{ color: 'var(--ink-500)' }}>No hay planes por vencer en esta ventana</div>
              </div>
            ) : (
              <Pagination
                page={Math.floor(skip / TAKE) + 1}
                totalPages={Math.max(1, Math.ceil(total / TAKE))}
                total={total}
                skip={skip}
                take={TAKE}
                itemCount={items.length}
                onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
                onNext={() => setSkip((s) => (s + TAKE < total ? s + TAKE : s))}
              />
            )}
          </>
        )}
      </Card>

      <StripeDetailModal saleId={stripeSaleId} onClose={() => setStripeSaleId(null)} />
    </div>
  )
}

function VenceCell({ venta }: { venta: VentaPorVencer }) {
  const { diasParaVencer, fechaVencimiento, fechaEstimada } = venta
  const vencida = diasParaVencer < 0
  const urgente = diasParaVencer >= 0 && diasParaVencer <= 7

  const chip = vencida
    ? { background: 'var(--coral-soft)', color: 'var(--violet-ink)' }
    : urgente
      ? { background: 'var(--amber-soft)', color: 'var(--violet-ink)' }
      : { background: 'var(--ink-50)', color: 'var(--ink-700)' }

  return (
    <div className="flex flex-col gap-1 items-start">
      <span
        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11.5px] font-bold"
        style={chip}
      >
        {vencida
          ? `Vencido hace ${Math.abs(diasParaVencer)} d`
          : diasParaVencer === 0
            ? 'Vence hoy'
            : `En ${diasParaVencer} d`}
      </span>
      <span className="text-[12px]" style={{ color: 'var(--ink-700)' }}>
        {formatDate(fechaVencimiento)}
      </span>
      {fechaEstimada && (
        <span
          className="text-[10.5px] font-semibold"
          title="Calculada a partir de la fecha de venta y el periodo del plan; no viene de Stripe"
          style={{ color: 'var(--ink-500)' }}
        >
          fecha estimada
        </span>
      )}
    </div>
  )
}

function RenovacionCell({ venta }: { venta: VentaPorVencer }) {
  if (venta.tipo === 'one_time') {
    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
        >
          Pago único
        </span>
        <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
          No se renueva solo
        </span>
      </div>
    )
  }

  const estatus = venta.estatusSuscripcion
    ? SUBSCRIPTION_STATUS[venta.estatusSuscripcion] ?? venta.estatusSuscripcion
    : null

  return (
    <div className="flex flex-col gap-1 items-start">
      {venta.renovaraAutomaticamente === false ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold"
          style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
        >
          <PhoneCall size={12} /> No renovará
        </span>
      ) : venta.renovaraAutomaticamente ? (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold"
          style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
        >
          <RefreshCw size={12} /> Renovará
        </span>
      ) : (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
          title="Sin datos de Stripe para esta suscripción"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
        >
          Sin datos de Stripe
        </span>
      )}
      {estatus && (
        <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
          {estatus}
        </span>
      )}
      {venta.montoProximoCobro !== null && (
        <span className="text-[11px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
          Próximo: {money.format(venta.montoProximoCobro)}
        </span>
      )}
    </div>
  )
}
