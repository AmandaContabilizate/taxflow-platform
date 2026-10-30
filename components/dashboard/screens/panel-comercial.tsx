'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Loader2, TrendingUp, UserPlus, Users, Wallet } from 'lucide-react'
import { getSellerDashboard } from '@/features/users/actions/getSellerDashboard.action'
import { getMyCommissionSummary } from '@/features/commissions/actions/getCommissions.action'
import type { SellerDashboard } from '@/features/users/types'
import type { GoFn } from '../types'
import { MONO } from '../constants'
import { Card, ErrorState } from '../ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function periodoActual(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function initials(name: string | null): string {
  const parts = (name ?? '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Sin compras'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Sin compras'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Tarjeta de indicador. `highlight` la pinta en oscuro (el KPI protagonista). */
function Kpi({
  label,
  value,
  hint,
  Icon,
  highlight,
  delay,
}: {
  label: string
  value: string
  hint: string
  Icon: typeof Users
  highlight?: boolean
  delay: number
}) {
  return (
    <div className="pc-rise" style={{ animationDelay: `${delay}ms` }}>
      <Card>
        <div
          className="p-5 rounded-[inherit]"
          style={highlight ? { background: 'var(--nav-active-bg)', color: 'var(--nav-active-fg)' } : undefined}
        >
          <div className="flex items-start justify-between gap-2">
            <div
              className="text-[10.5px] font-extrabold uppercase tracking-wider"
              style={{ color: highlight ? 'var(--nav-active-fg)' : 'var(--ink-400)', opacity: highlight ? 0.75 : 1 }}
            >
              {label}
            </div>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: highlight ? 'rgba(255,255,255,0.16)' : 'var(--ink-50)',
                color: highlight ? 'var(--nav-active-fg)' : 'var(--ink-500)',
              }}
            >
              <Icon size={15} />
            </div>
          </div>
          <div
            className="text-[28px] font-bold mt-2 leading-none"
            style={{ ...MONO, color: highlight ? 'var(--nav-active-fg)' : 'var(--ink-900)' }}
          >
            {value}
          </div>
          <div
            className="text-[12px] mt-1.5"
            style={{ color: highlight ? 'var(--nav-active-fg)' : 'var(--ink-500)', opacity: highlight ? 0.75 : 1 }}
          >
            {hint}
          </div>
        </div>
      </Card>
    </div>
  )
}

interface PanelComercialProps {
  go: GoFn
  /** true cuando el rol solo ve su propio embudo (vendedor). */
  scopedToSeller: boolean
  /** El token trae Comercial.ReadOwnCommissions. */
  canReadCommissions: boolean
}

/**
 * Panel del ejecutivo comercial: embudo de onboarding, altas recientes y sus
 * clientes con RFC. Las cifras de comisión salen del módulo de comisiones y solo
 * se consultan si el token trae el claim correspondiente.
 */
export function PanelComercialScreen({
  go,
  scopedToSeller,
  canReadCommissions,
}: PanelComercialProps) {
  const [data, setData] = useState<SellerDashboard | null>(null)
  const [comision, setComision] = useState<number | null>(null)
  const [operaciones, setOperaciones] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const [panel, resumen] = await Promise.all([
        getSellerDashboard(),
        canReadCommissions ? getMyCommissionSummary(periodoActual()) : Promise.resolve(null),
      ])
      if (cancelled) return
      if (panel.success) setData(panel.value)
      else setError(panel.error.message)

      if (resumen?.success) {
        setComision(resumen.value.totalCommission)
        setOperaciones(resumen.value.buckets.reduce((n, b) => n + b.operationsCount, 0))
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [canReadCommissions])

  if (loading) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <div className="p-5 animate-pulse">
                <div className="h-3 w-24 rounded" style={{ background: 'var(--ink-100)' }} />
                <div className="h-7 w-20 rounded mt-3" style={{ background: 'var(--ink-100)' }} />
                <div className="h-3 w-28 rounded mt-2" style={{ background: 'var(--ink-50)' }} />
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <div className="p-5 flex items-center justify-center gap-2 py-12" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando tu panel…
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <ErrorState message={error} />
      </Card>
    )
  }

  if (!data) return null

  const maxEtapa = Math.max(1, ...data.embudo.map((e) => e.total))

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <style>{`
        @keyframes pcRise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pc-rise { animation: pcRise 300ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        .pc-bar { transform-origin: left; transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1); }
        @media (prefers-reduced-motion: reduce) {
          .pc-rise { animation: pcRise 200ms ease both; transform: none; }
          .pc-bar { transition: none; }
        }
      `}</style>

      {/* El saludo lo pone el shell; aquí el código propio y el resumen del día. */}
      <div className="pc-rise">
        {data.vendorCode && (
          <span
            className="inline-block px-2.5 py-1 rounded-full text-[11.5px] font-bold mb-2"
            style={{ ...MONO, background: 'var(--brand-100)', color: 'var(--brand-900)' }}
          >
            Código {data.vendorCode}
          </span>
        )}
        <p className="text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
          {scopedToSeller ? (
            <>
              Tienes <b>{data.leadsActivos}</b> {data.leadsActivos === 1 ? 'lead activo' : 'leads activos'} y{' '}
              <b>{data.nuevosRegistros7d}</b>{' '}
              {data.nuevosRegistros7d === 1 ? 'nuevo registro' : 'nuevos registros'} esta semana — no olvides
              contactarlos.
            </>
          ) : (
            <>
              Embudo global de onboarding: <b>{data.totalUsuarios}</b> cuentas registradas,{' '}
              <b>{data.clientesConRfc}</b> ya con RFC.
            </>
          )}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          label="Leads activos"
          value={String(data.leadsActivos)}
          hint="Usuarios sin RFC registrado"
          Icon={Users}
          delay={0}
        />
        <Kpi
          label="Clientes con RFC"
          value={String(data.clientesConRfc)}
          hint={`De ${data.totalUsuarios} cuentas en tu embudo`}
          Icon={TrendingUp}
          delay={40}
        />
        {canReadCommissions && (
          <Kpi
            label="Comisión del mes"
            value={comision == null ? '—' : money.format(comision)}
            hint={
              operaciones == null
                ? 'Sin perfil comercial'
                : `${operaciones} ${operaciones === 1 ? 'operación' : 'operaciones'}`
            }
            Icon={Wallet}
            delay={80}
          />
        )}
        <Kpi
          label="Nuevos registros"
          value={String(data.nuevosRegistros7d)}
          hint="Últimos 7 días"
          Icon={UserPlus}
          highlight
          delay={120}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Embudo */}
        <div className="pc-rise" style={{ animationDelay: '160ms' }}>
          <Card>
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  Embudo de usuarios
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Progreso de tus leads en el registro
                </p>
              </div>
              <button
                type="button"
                onClick={() => go('usuarios')}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                style={{ color: 'var(--brand-700)', transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
              >
                Ver usuarios <ArrowRight size={14} />
              </button>
            </div>

            {data.embudo.length === 0 ? (
              <div className="px-5 pb-8 pt-4 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                Todavía no hay registros en tu embudo.
              </div>
            ) : (
              <div className="px-5 pb-5 flex flex-col gap-3">
                {data.embudo.map((e) => (
                  <div key={e.key}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                        {e.label}
                      </span>
                      <span className="text-[12.5px] font-bold" style={{ ...MONO, color: 'var(--ink-700)' }}>
                        {e.total} · {e.porcentaje}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}>
                      <div
                        className="h-full w-full rounded-full pc-bar"
                        style={{
                          transform: `scaleX(${e.total / maxEtapa})`,
                          background: e.key === 'rfc' ? 'var(--brand-500)' : 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Clientes */}
        <div className="pc-rise" style={{ animationDelay: '200ms' }}>
          <Card>
            <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  Mis clientes
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Cuentas con RFC, por compra más reciente
                </p>
              </div>
              <button
                type="button"
                onClick={() => go('clientes')}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                style={{ color: 'var(--brand-700)', transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
              >
                Ver todos <ArrowRight size={14} />
              </button>
            </div>

            {data.clientes.length === 0 ? (
              <div className="px-5 pb-8 pt-4 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                Aún no tienes clientes con RFC registrado.
              </div>
            ) : (
              <div className="pb-2">
                {data.clientes.map((c) => (
                  <div
                    key={c.userId}
                    className="px-5 py-3 flex items-center gap-3"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[11.5px] font-extrabold flex-shrink-0"
                      style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
                    >
                      {initials(c.legalName || c.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                        {c.legalName || c.fullName || 'Sin nombre'}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{c.rfc}</code>
                        <span className="text-[11px]" style={{ color: 'var(--ink-400)' }}>
                          {formatDate(c.ultimaCompra)}
                        </span>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                      style={
                        c.conPlanPagado
                          ? { background: 'var(--brand-100)', color: 'var(--brand-900)' }
                          : { background: 'var(--amber-soft)', color: 'var(--violet-ink)' }
                      }
                    >
                      {c.conPlanPagado ? 'Con plan' : 'Sin compra'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
