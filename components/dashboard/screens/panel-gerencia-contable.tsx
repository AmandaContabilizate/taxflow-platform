'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Filter,
  Hourglass,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { getGerenciaContableDashboard } from '@/features/operations/actions/getGerenciaContableDashboard.action'
import type { ContadorDesglose, GerenciaContableDashboard } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'
import { Card, ErrorState } from '../ui'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

function Kpi({
  label,
  value,
  hint,
  Icon,
  highlight,
  alert,
  delay,
}: {
  label: string
  value: string
  hint: string
  Icon: typeof Users
  highlight?: boolean
  alert?: boolean
  delay: number
}) {
  return (
    <div className="pgc-rise" style={{ animationDelay: `${delay}ms` }}>
      <Card>
        <div
          className="p-5 rounded-[inherit]"
          style={highlight ? { background: 'var(--hero-brand-soft)' } : undefined}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
              {label}
            </div>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: highlight ? 'var(--brand-100)' : alert ? 'var(--coral-soft)' : 'var(--ink-50)',
                color: highlight ? 'var(--brand-700)' : alert ? 'var(--violet-ink)' : 'var(--ink-500)',
              }}
            >
              <Icon size={15} />
            </div>
          </div>
          <div
            className="text-[28px] font-bold mt-2 leading-none"
            style={{ ...MONO, color: alert ? 'var(--violet-ink)' : 'var(--ink-900)' }}
          >
            {value}
          </div>
          <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-500)' }}>
            {hint}
          </div>
        </div>
      </Card>
    </div>
  )
}

/** Barra de avance del desglose (scaleX, sin re-layout). */
function AvanceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 justify-end">
      <div className="h-1.5 w-[90px] rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}>
        <div
          className="h-full w-full rounded-full pgc-bar"
          style={{
            transform: `scaleX(${Math.min(value, 100) / 100})`,
            background: value >= 100 ? 'var(--brand-500)' : 'var(--primary)',
          }}
        />
      </div>
      <span className="text-[12.5px] font-bold w-[44px] text-right" style={{ ...MONO, color: 'var(--ink-900)' }}>
        {value}%
      </span>
    </div>
  )
}

/**
 * Panel de gerencia de contabilidad (permiso Dashboard.GerenciaContable):
 * totales del área para el periodo, filtro por contador y desglose de carga
 * y avance del equipo.
 */
export function PanelGerenciaContableScreen() {
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth() + 1)
  const [contador, setContador] = useState('')
  const [data, setData] = useState<GerenciaContableDashboard | null>(null)
  // El desglose completo se conserva para el dropdown aunque se filtre un contador.
  const [equipo, setEquipo] = useState<ContadorDesglose[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await getGerenciaContableDashboard(year, month, contador || undefined)
      if (cancelled) return
      if (res.success) {
        setData(res.value)
        if (!contador) setEquipo(res.value.desglose)
      } else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [year, month, contador])

  const anios = [hoy.getFullYear() - 2, hoy.getFullYear() - 1, hoy.getFullYear()]
  const selectStyle = {
    background: 'var(--input)',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <style>{`
        @keyframes pgcRise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pgc-rise { animation: pgcRise 300ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        .pgc-bar { transform-origin: left; transition: transform 500ms cubic-bezier(0.23, 1, 0.32, 1); }
        @media (prefers-reduced-motion: reduce) {
          .pgc-rise { animation: pgcRise 200ms ease both; transform: none; }
          .pgc-bar { transition: none; }
        }
      `}</style>

      {/* El saludo lo pone el shell del dashboard; aquí solo el contexto. */}
      <p className="pgc-rise text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
        Vista del área contable · carga y avance del equipo en el periodo seleccionado.
      </p>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Card>
          <div className="p-4 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
              <CalendarDays size={15} /> Periodo:
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              aria-label="Mes"
              className="px-3 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer"
              style={selectStyle}
            >
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              aria-label="Ejercicio"
              className="px-3 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer"
              style={selectStyle}
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </Card>
        <Card>
          <div className="p-4 flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: 'var(--ink-700)' }}>
              <Filter size={15} /> Contador:
            </span>
            <select
              value={contador}
              onChange={(e) => setContador(e.target.value)}
              aria-label="Filtrar por contador"
              className="px-3 py-2 rounded-xl text-[13px] font-semibold outline-none cursor-pointer min-w-[190px]"
              style={selectStyle}
            >
              <option value="">Todos los contadores</option>
              {equipo.map((c) => (
                <option key={c.accountantUserId} value={c.accountantUserId}>{c.nombre}</option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="p-5 animate-pulse">
                <div className="h-3 w-24 rounded" style={{ background: 'var(--ink-100)' }} />
                <div className="h-7 w-16 rounded mt-3" style={{ background: 'var(--ink-100)' }} />
                <div className="h-3 w-28 rounded mt-2" style={{ background: 'var(--ink-50)' }} />
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState message={error} />
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Kpi
              label="Cartera asignada"
              value={String(data.carteraTotal)}
              hint="Total de clientes del área"
              Icon={Users}
              delay={0}
            />
            <Kpi
              label="Por presentar"
              value={String(data.porPresentar)}
              hint="Validadas, listas para enviar al SAT"
              Icon={FileText}
              delay={40}
            />
            <Kpi
              label="En proceso"
              value={String(data.enProceso)}
              hint="Compradas, aún sin trabajar"
              Icon={Hourglass}
              delay={80}
            />
            <Kpi
              label="Presentadas"
              value={String(data.presentadas)}
              hint="Ya enviadas al SAT en el periodo"
              Icon={CheckCircle2}
              highlight
              delay={120}
            />
            <Kpi
              label="CIEC inválidas"
              value={String(data.ciecInvalidas)}
              hint="Clientes con credencial bloqueada"
              Icon={ShieldAlert}
              alert={data.ciecInvalidas > 0}
              delay={160}
            />
          </div>

          {/* Desglose por contador */}
          <div className="pgc-rise" style={{ animationDelay: '160ms' }}>
            <Card>
              <div className="px-5 pt-5 pb-3">
                <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  Desglose por contador
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                  Carga de trabajo y avance del equipo en el periodo seleccionado.
                </p>
              </div>

              {data.desglose.length === 0 ? (
                <div className="px-5 pb-10 pt-4 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                  No hay carteras asignadas todavía — asígnalas desde la pantalla Clientes.
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Contador', 'Cartera', 'Por presentar', 'Presentadas', 'CIEC bloq.', '% avance'].map((h, i) => (
                          <th
                            key={h}
                            className={`px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}
                            style={{ color: 'var(--ink-500)' }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.desglose.map((c) => (
                        <tr key={c.accountantUserId} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td className="px-5 py-3.5">
                            <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                              {c.nombre}
                            </div>
                            <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{c.email}</div>
                          </td>
                          <td className="px-5 py-3.5 text-right text-[13.5px] font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                            {c.cartera}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[13.5px]" style={{ ...MONO, color: c.porPresentar > 0 ? 'var(--violet-ink)' : 'var(--ink-700)' }}>
                            {c.porPresentar}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[13.5px]" style={{ ...MONO, color: 'var(--ink-700)' }}>
                            {c.presentadas}
                          </td>
                          <td className="px-5 py-3.5 text-right text-[13.5px]" style={{ ...MONO, color: c.ciecBloqueadas > 0 ? 'var(--violet-ink)' : 'var(--ink-700)' }}>
                            {c.ciecBloqueadas}
                          </td>
                          <td className="px-5 py-3.5">
                            <AvanceBar value={c.avancePorcentaje} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}
