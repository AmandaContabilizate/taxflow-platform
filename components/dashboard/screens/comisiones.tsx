'use client'

import {
  AlertCircle,
  AlertTriangle,
  Download,
  Inbox,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  getMyCommissionOperations,
  getMyCommissionSummary,
  getTeamCommissionSummary,
  recalculateManagerGoals,
} from '@/features/commissions/actions/getCommissions.action'
import type {
  CommissionOperationRow,
  MyCommissionSummary,
  TeamCommissionSummary,
} from '@/features/commissions/types'
import { MONO } from '../constants'
import { Badge, Card, ErrorState, NoAccessState } from '../ui'

/** Claims que gobiernan esta pantalla (misma arquitectura que los endpoints). */
const CLAIM_READ_OWN = 'Comercial.ReadOwnCommissions'
const CLAIM_READ_TEAM = 'GerenciaComercial.ReadTeamCommissions'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const pct = (fraction: number | null | undefined) =>
  fraction == null ? '—' : `${(fraction * 100).toFixed(1)}%`

function lastPeriods(count: number): { value: string; label: string }[] {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
    }
  })
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?'
}

/** Barra de avance compartida (cumplimiento). Verde de marca al llegar a la meta. */
function ProgressBar({ value }: { value: number | null | undefined }) {
  const fraction = Math.min(value ?? 0, 1)
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}>
      <div
        className="h-full w-full rounded-full"
        style={{
          transform: `scaleX(${fraction})`,
          transformOrigin: 'left',
          background: (value ?? 0) >= 1 ? 'var(--brand-500)' : 'var(--primary)',
          // scaleX en lugar de width: se anima en GPU sin re-layout.
          transition: 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
      />
    </div>
  )
}

export function ComisionesScreen({
  permissions = [],
  go,
}: {
  permissions?: string[]
  /** Navegación del dashboard — habilita el CTA hacia Asignaciones. */
  go?: (screen: 'asignaciones') => void
}) {
  // Qué se ve lo deciden los permisos del token (no el rol): mismo modelo que
  // los endpoints. ReadOwn → resumen/operaciones propias; ReadTeam → panel de
  // equipo (aunque el usuario no tenga perfil comercial propio).
  const canReadOwn = permissions.includes(CLAIM_READ_OWN)
  const canReadTeam = permissions.includes(CLAIM_READ_TEAM)

  const periods = useMemo(() => lastPeriods(12), [])
  const [period, setPeriod] = useState(periods[0].value)
  const [summary, setSummary] = useState<MyCommissionSummary | null>(null)
  const [operations, setOperations] = useState<CommissionOperationRow[]>([])
  const [team, setTeam] = useState<TeamCommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [noProfile, setNoProfile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Recálculo de metas dinámicas (Regla 10) — solo con Admin.RunCommissionClose.
  const canRecalcGoals = permissions.includes('Admin.RunCommissionClose')
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null)
  // Incrementarlo re-dispara la carga (tras recalcular metas).
  const [refreshKey, setRefreshKey] = useState(0)

  const recalcGoals = async () => {
    if (recalcLoading) return
    setRecalcLoading(true)
    setRecalcMsg(null)
    const res = await recalculateManagerGoals(period)
    setRecalcLoading(false)
    if (res.success) {
      setRecalcMsg(`Metas recalculadas (${res.value} ${res.value === 1 ? 'gerente' : 'gerentes'}).`)
      setRefreshKey((k) => k + 1)
    } else {
      setRecalcMsg(`No se pudieron recalcular: ${res.error.message}`)
    }
  }

  useEffect(() => {
    if (!canReadOwn && !canReadTeam) {
      setLoading(false)
      return
    }
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      setNoProfile(false)
      setTeam(null)

      const [summaryRes, opsRes, teamRes] = await Promise.all([
        canReadOwn ? getMyCommissionSummary(period) : Promise.resolve(null),
        canReadOwn ? getMyCommissionOperations(period) : Promise.resolve(null),
        canReadTeam ? getTeamCommissionSummary(period) : Promise.resolve(null),
      ])
      if (cancelled) return

      if (teamRes?.success) setTeam(teamRes.value)

      if (summaryRes) {
        if (summaryRes.success) {
          setSummary(summaryRes.value)
          setOperations(opsRes?.success ? opsRes.value : [])
        } else {
          if (summaryRes.error.statusCode === 404) setNoProfile(true)
          else setError(summaryRes.error.message)
          setSummary(null)
          setOperations([])
        }
      } else {
        setSummary(null)
        setOperations([])
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [period, canReadOwn, canReadTeam, refreshKey])

  const exportCsv = () => {
    const header = 'Fecha,Cliente,RFC,Tipo,Origen,Cobrado,Comisiona,Estatus'
    const rows = operations.map((o) =>
      [
        o.saleDate.slice(0, 10),
        `"${(o.clientName ?? '').replaceAll('"', '""')}"`,
        o.rfc,
        o.operationType,
        o.assignmentSource,
        o.amountCharged.toFixed(2),
        o.amountNet.toFixed(2),
        o.status,
      ].join(','),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comisiones-operaciones-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const opsCount = summary?.buckets.reduce((acc, b) => acc + b.operationsCount, 0) ?? 0

  // Sin ninguno de los dos permisos no hay nada que consultar: sin acceso.
  if (!canReadOwn && !canReadTeam) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <Card>
          <NoAccessState />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Entrada en cascada: sutil, solo transform+opacity, respeta reduced-motion. */}
      <style>{`
        @keyframes commRise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .comm-rise { animation: commRise 300ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .comm-rise { animation: commRise 200ms ease both; transform: none; }
        }
      `}</style>

      {/* Periodo + estatus del cálculo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3.5 py-2 rounded-xl text-[13.5px] font-semibold outline-none focus:ring-2 cursor-pointer capitalize"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--ink-900)',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
          }}
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value} className="capitalize">{p.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 flex-wrap">
          {canRecalcGoals && (
            <button
              type="button"
              onClick={() => void recalcGoals()}
              disabled={recalcLoading}
              title="Vuelve a calcular la meta dinámica de cada gerente con su plantilla elegible actual (Regla 10). El cierre mensual también lo hace solo."
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold cursor-pointer disabled:opacity-60"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--ink-700)',
                transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ink-50)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--card)' }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
            >
              {recalcLoading ? 'Recalculando…' : 'Recalcular metas'}
            </button>
          )}
          {summary && (
            <Badge kind={summary.closed ? 'brand' : 'amber'}>
              {summary.closed ? 'Cierre definitivo' : 'Proyección en vivo'}
            </Badge>
          )}
        </div>
      </div>
      {recalcMsg && (
        <div
          className="px-4 py-3 rounded-2xl text-[13px] font-semibold"
          style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          {recalcMsg}
        </div>
      )}

      {loading ? (
        /* Skeleton: misma silueta que el contenido para evitar saltos de layout. */
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}>
                <div className="p-5 animate-pulse">
                  <div className="h-3 w-24 rounded" style={{ background: 'var(--ink-100)' }} />
                  <div className="h-7 w-32 rounded mt-3" style={{ background: 'var(--ink-100)' }} />
                  <div className="h-3 w-20 rounded mt-2" style={{ background: 'var(--ink-50)' }} />
                </div>
              </Card>
            ))}
          </div>
          <Card>
            <div className="p-5 animate-pulse flex flex-col gap-3">
              <div className="h-4 w-40 rounded" style={{ background: 'var(--ink-100)' }} />
              <div className="h-10 rounded" style={{ background: 'var(--ink-50)' }} />
              <div className="h-10 rounded" style={{ background: 'var(--ink-50)' }} />
            </div>
          </Card>
        </>
      ) : noProfile && !team ? (
        <Card>
          <div className="py-14 text-center flex flex-col items-center gap-3 comm-rise">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}
            >
              <AlertCircle size={22} />
            </div>
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Sin perfil comercial configurado
            </div>
            <p className="text-[13px] max-w-[400px]" style={{ color: 'var(--ink-500)' }}>
              Pide a tu gerente o a administración que configure tu perfil (segmento y canal)
              para empezar a medir tus comisiones.
            </p>
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="comm-rise">
            <ErrorState message={error} />
          </div>
        </Card>
      ) : (
        <>
          {summary?.isNewHire && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl text-[13px] comm-rise"
              style={{ background: 'var(--hero-brand-soft)', color: 'var(--ink-700)' }}
            >
              <Sparkles size={16} style={{ color: 'var(--brand-700)' }} />
              Estás en tu periodo de incorporación: este mes comisionas <b>15% plano</b> sobre
              todas tus ventas, sin tabulador ni meta.
            </div>
          )}

          {/* ===== Fila de resumen: total + contexto (gerente: su equipo · ejecutivo: sus buckets) ===== */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summary && (
            <div className="comm-rise" style={{ animationDelay: '0ms' }}>
              <Card>
                <div className="p-5">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                    <Wallet size={12} />
                    {summary.closed ? 'Comisión del periodo' : 'Comisión proyectada'}
                  </div>
                  <div className="text-[28px] font-bold mt-1.5 leading-none" style={{ ...MONO, color: 'var(--brand-700)' }}>
                    {money.format(summary.totalCommission)}
                  </div>
                  <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
                    {opsCount === 0 ? 'Sin operaciones propias aún' : `${opsCount} operación${opsCount === 1 ? '' : 'es'}`}
                  </div>
                </div>
              </Card>
            </div>
            )}

            {team && (
              <>
                <div className="comm-rise" style={{ animationDelay: '40ms' }}>
                  <Card>
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                        <Target size={12} /> Meta dinámica del equipo
                      </div>
                      <div className="text-[22px] font-bold mt-1.5 leading-none" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {team.teamGoal != null ? money.format(team.teamGoal) : '—'}
                      </div>
                      <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
                        Σ metas de ejecutivos elegibles
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="comm-rise" style={{ animationDelay: '80ms' }}>
                  <Card>
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                        <TrendingUp size={12} /> Cumplimiento
                      </div>
                      <div className="text-[22px] font-bold mt-1.5 leading-none" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {pct(team.teamCompliance)}
                      </div>
                      <div className="mt-2.5">
                        <ProgressBar value={team.teamCompliance} />
                      </div>
                      <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
                        {money.format(team.teamAmountNet)} vendido (elegibles)
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="comm-rise" style={{ animationDelay: '120ms' }}>
                  <Card>
                    <div className="p-5">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                        <Users size={12} /> Plantilla
                      </div>
                      <div className="text-[22px] font-bold mt-1.5 leading-none" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {team.members.length}
                      </div>
                      <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
                        {team.eligibleCount} elegible{team.eligibleCount === 1 ? '' : 's'} · {team.incorporationCount} en incorporación
                      </div>
                    </div>
                  </Card>
                </div>
              </>
            )}

            {summary?.buckets.map((b, i) => (
              <div key={b.schemeKey} className="comm-rise" style={{ animationDelay: `${(i + 1) * 40}ms` }}>
                <Card>
                  <div className="p-5">
                    <div className="text-[12px] font-bold" style={{ color: 'var(--ink-700)' }}>{b.schemeName}</div>
                    {b.goal != null ? (
                      <>
                        <div className="flex items-baseline justify-between mt-2">
                          <span className="text-[18px] font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                            {pct(b.compliance)}
                          </span>
                          <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                            {money.format(b.amountNet)} / {money.format(b.goal)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <ProgressBar value={b.compliance} />
                        </div>
                      </>
                    ) : (
                      <div className="text-[18px] font-bold mt-2" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {money.format(b.amountNet)}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2.5">
                      <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                        {b.levelName ? `Nivel: ${b.levelName} · ${pct(b.percent)}` : b.percent > 0 ? `Tasa: ${pct(b.percent)}` : 'Debajo del mínimo'}
                      </span>
                      <span className="text-[13px] font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {money.format(b.commission)}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Con permiso de equipo pero sin perfil comercial propio: aviso compacto */}
          {noProfile && team && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl text-[13px] comm-rise"
              style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              No tienes perfil comercial propio configurado, así que no hay comisiones
              personales que mostrar — abajo está el panel de tu equipo.
            </div>
          )}

          {/* ===== Panel de equipo (permiso ReadTeamCommissions) ===== */}
          {team && (
            <div className="comm-rise" style={{ animationDelay: '160ms' }}>
              <Card>
                <div className="flex items-center justify-between px-5 pt-5 flex-wrap gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                      <Users size={17} /> Mi equipo
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      Avance individual del periodo · la Regla 10 solo suma elegibles a tu meta
                    </p>
                  </div>
                </div>

                {team.unassignedOperations > 0 && (
                  <div
                    className="mx-5 mt-3 rounded-xl px-4 py-3.5 flex items-center gap-3.5 flex-wrap comm-rise"
                    style={{
                      background: 'var(--amber-soft)',
                      border: '1px solid rgba(180, 83, 9, 0.25)',
                      borderLeft: '4px solid #b45309',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(180, 83, 9, 0.14)', color: '#92400e' }}
                    >
                      <AlertTriangle size={18} />
                    </div>
                    <div className="flex-1 min-w-[230px]">
                      <div className="text-[14.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                        {team.unassignedOperations}{' '}
                        {team.unassignedOperations === 1
                          ? 'operación sin vendedor asignado'
                          : 'operaciones sin vendedor asignado'}
                      </div>
                      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                        Nadie está comisionando por estas ventas — asígnalas para que cuenten en el periodo.
                      </div>
                    </div>
                    {go && (
                      <button
                        type="button"
                        onClick={() => go('asignaciones')}
                        className="px-4 py-2 rounded-lg text-[13px] font-bold flex items-center gap-1.5 flex-shrink-0"
                        style={{
                          background: '#b45309',
                          color: '#fff',
                          transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#92400e' }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#b45309' }}
                        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)' }}
                        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
                      >
                        Revisar asignaciones
                      </button>
                    )}
                  </div>
                )}

                {team.members.length === 0 ? (
                  <div className="py-10 text-center flex flex-col items-center gap-2.5">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}
                    >
                      <Users size={20} />
                    </div>
                    <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                      Aún no tienes ejecutivos en tu plantilla
                    </div>
                    <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                      Invítalos desde la pantalla <b>Equipo</b> y su avance aparecerá aquí.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto mt-3 px-2 pb-2">
                    <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          {['Ejecutivo', 'Segmento', 'Elegible', 'Ventas netas', 'Cumplimiento', 'Ops'].map((h) => (
                            <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {team.members.map((m) => (
                          <tr key={m.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                                  style={{ background: 'var(--ink-100)', color: 'var(--ink-700)' }}
                                >
                                  {initials(m.name)}
                                </div>
                                <div>
                                  <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                                    {m.name}
                                  </div>
                                  {m.isNewHire && (
                                    <div className="text-[11px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
                                      15% de ingreso
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                              {m.segment ?? '—'}
                              {m.channel && (
                                <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{m.channel}</div>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              <Badge kind={m.isEligible ? 'brand' : 'amber'}>
                                {m.isEligible ? 'Elegible' : 'Incorporación'}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-[13px] font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                              {money.format(m.amountNet)}
                            </td>
                            <td className="py-3 px-3 min-w-[150px]">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[12.5px] font-bold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                                  {pct(m.compliance)}
                                </span>
                                <span className="text-[11px]" style={{ ...MONO, color: 'var(--ink-400)' }}>
                                  meta {m.goal != null ? money.format(m.goal) : '—'}
                                </span>
                              </div>
                              <ProgressBar value={m.compliance} />
                            </td>
                            <td className="py-3 px-3 text-[13px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                              {m.operationsCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ===== Operaciones propias (permiso ReadOwnCommissions) ===== */}
          {summary && (
          <div className="comm-rise" style={{ animationDelay: '200ms' }}>
            <Card>
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-wrap gap-2">
                <div>
                  <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                    Mis operaciones del periodo
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    Ventas donde tú eres el propietario (tu código o asignadas a ti)
                  </p>
                </div>
                {operations.length > 0 && (
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                    style={{
                      border: '1px solid var(--border)',
                      color: 'var(--ink-700)',
                      transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--ink-50)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Download size={13} /> Exportar CSV
                  </button>
                )}
              </div>
              {operations.length === 0 ? (
                <div className="py-10 text-center flex flex-col items-center gap-2.5">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-400)' }}
                  >
                    <Inbox size={20} />
                  </div>
                  <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                    Sin operaciones propias este periodo
                  </div>
                  <p className="text-[12.5px] max-w-[420px]" style={{ color: 'var(--ink-500)' }}>
                    {summary.isManager
                      ? 'Las ventas de tu equipo viven en cada ejecutivo (arriba). Aquí aparecerán las que te pertenezcan directamente, como renovaciones de tu esquema.'
                      : 'Cuando un cliente compre con tu código de vendedor o de descuento, la operación aparecerá aquí.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto px-2 pb-2">
                  <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Fecha', 'Cliente', 'Tipo', 'Origen', 'Cobrado', 'Comisiona', 'Estatus'].map((h) => (
                          <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {operations.map((o) => (
                        <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="py-2.5 px-3 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                            {new Date(o.saleDate).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                              {o.clientName ?? '—'}
                            </div>
                            <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{o.rfc}</code>
                          </td>
                          <td className="py-2.5 px-3"><Badge kind="default">{o.operationType}</Badge></td>
                          <td className="py-2.5 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                            {o.assignmentSource}
                            {o.vendorCodeUsed && (
                              <div><code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{o.vendorCodeUsed}</code></div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[13px] font-semibold" style={{ ...MONO, color: 'var(--ink-500)' }}>
                            {money.format(o.amountCharged)}
                          </td>
                          <td
                            className="py-2.5 px-3 text-[13px] font-semibold"
                            style={{
                              ...MONO,
                              // Violeta cuando comisiona más de lo cobrado (venta regalo a precio de lista).
                              color: o.amountNet > o.amountCharged ? 'var(--violet-ink)' : 'var(--ink-900)',
                            }}
                            title={o.amountNet > o.amountCharged ? 'Venta regalo — comisiona a precio de lista' : undefined}
                          >
                            {money.format(o.amountNet)}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge kind={o.status === 'Cerrada' ? 'brand' : 'default'}>{o.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
          )}
        </>
      )}
    </div>
  )
}
