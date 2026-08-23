'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  KeyRound,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { getContadorDashboard } from '@/features/operations/actions/getContadorDashboard.action'
import type { ContadorDashboard } from '@/features/operations/types'
import type { GoFn } from '../types'
import { MONO } from '../constants'
import { Card, ErrorState } from '../ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

function periodoLabel(periodValueId: number, year: number): string {
  const mes = MESES[(periodValueId % 100) - 1]
  return mes ? `${mes} ${year}` : `Periodo ${periodValueId} · ${year}`
}

function diasParaVencer(iso: string): string {
  const limite = new Date(iso)
  if (Number.isNaN(limite.getTime())) return ''
  const dias = Math.ceil((limite.getTime() - Date.now()) / 86_400_000)
  if (dias < 0) return `Venció hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`
  if (dias === 0) return 'Vence hoy'
  return `Vence dentro de ${dias} día${dias === 1 ? '' : 's'}`
}

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
    <div className="pcont-rise" style={{ animationDelay: `${delay}ms` }}>
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
                background: highlight ? 'rgba(255,255,255,0.16)' : alert ? 'var(--coral-soft)' : 'var(--ink-50)',
                color: highlight ? 'var(--nav-active-fg)' : alert ? 'var(--violet-ink)' : 'var(--ink-500)',
              }}
            >
              <Icon size={15} />
            </div>
          </div>
          <div
            className="text-[28px] font-bold mt-2 leading-none"
            style={{ ...MONO, color: highlight ? 'var(--nav-active-fg)' : alert ? 'var(--violet-ink)' : 'var(--ink-900)' }}
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

/**
 * Panel del contador (permiso Dashboard.Contador): su cartera asignada y el
 * trabajo del periodo — declaraciones por presentar, presentadas y estado de
 * CIEC. El backend acota todo a la cartera del token.
 */
export function PanelContadorScreen({ go }: { go: GoFn }) {
  const hoy = new Date()
  const [year, setYear] = useState(hoy.getFullYear())
  const [month, setMonth] = useState(hoy.getMonth() + 1)
  const [data, setData] = useState<ContadorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      setError(null)
      const res = await getContadorDashboard(year, month)
      if (cancelled) return
      if (res.success) setData(res.value)
      else setError(res.error.message)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [year, month])

  const anios = [hoy.getFullYear() - 2, hoy.getFullYear() - 1, hoy.getFullYear()]
  const selectStyle = {
    background: 'var(--input)',
    border: '1px solid var(--border)',
    color: 'var(--foreground)',
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <style>{`
        @keyframes pcontRise {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pcont-rise { animation: pcontRise 300ms cubic-bezier(0.23, 1, 0.32, 1) both; }
        @media (prefers-reduced-motion: reduce) {
          .pcont-rise { animation: pcontRise 200ms ease both; transform: none; }
        }
      `}</style>

      {/* El saludo lo pone el shell del dashboard; aquí solo el resumen del periodo. */}
      {data && (
        <p className="pcont-rise text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
          Datos de <b>{MESES[month - 1]} {year}</b>: <b>{data.porPresentar}</b> por presentar,{' '}
          <b>{data.presentadas}</b> ya presentadas al SAT.
        </p>
      )}

      {/* Selector de periodo */}
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi
              label="Cartera asignada"
              value={String(data.carteraAsignada)}
              hint="Personas físicas y morales"
              Icon={Users}
              delay={0}
            />
            <Kpi
              label="Por presentar"
              value={String(data.porPresentar)}
              hint={`${data.vencenEstaSemana} vencen esta semana`}
              Icon={FileText}
              delay={40}
            />
            <Kpi
              label="Presentadas"
              value={String(data.presentadas)}
              hint={`Declaraciones presentadas en ${MESES[month - 1]} ${year}`}
              Icon={CheckCircle2}
              highlight
              delay={80}
            />
            <Kpi
              label="CIEC inválidas"
              value={String(data.ciecInvalidas)}
              hint="Bloquean la presentación"
              Icon={ShieldAlert}
              alert={data.ciecInvalidas > 0}
              delay={120}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
            {/* Declaraciones por presentar */}
            <div className="pcont-rise" style={{ animationDelay: '160ms' }}>
              <Card>
                <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                      Declaraciones por presentar
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      CFDI descargados automáticamente · tu trabajo es presentar al SAT
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => go('operaciones')}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-bold cursor-pointer active:scale-[0.97]"
                    style={{ color: 'var(--brand-700)', transition: 'transform 160ms cubic-bezier(0.23, 1, 0.32, 1)' }}
                  >
                    Ver todas <ArrowRight size={14} />
                  </button>
                </div>

                {data.declaracionesPorPresentar.length === 0 ? (
                  <div className="px-5 pb-10 pt-6 text-center flex flex-col items-center gap-2.5">
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
                      Nada pendiente en este periodo
                    </div>
                    <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                      Las declaraciones de tu cartera aparecerán aquí cuando haya trabajo por hacer.
                    </p>
                  </div>
                ) : (
                  <div className="pb-2">
                    {data.declaracionesPorPresentar.map((d) => (
                      <div
                        key={d.declarationId}
                        className="px-5 py-3 flex items-center gap-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
                        >
                          <FileText size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                              {periodoLabel(d.periodValueId, d.fiscalYear)}
                            </span>
                            <span className="text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>
                              · {d.legalName || d.rfc}
                            </span>
                          </div>
                          <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                            A pagar {money.format(d.totalDeclaration ?? 0)} · {diasParaVencer(d.fechaLimite)}
                          </div>
                        </div>
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0"
                          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
                        >
                          {d.estatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* CIEC actualizadas */}
            <div className="pcont-rise" style={{ animationDelay: '200ms' }}>
              <Card>
                <div className="px-5 pt-5 pb-3">
                  <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
                    CIEC actualizadas
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    Clientes que reactivaron su contraseña
                  </p>
                </div>

                {data.ciecActualizadas.length === 0 ? (
                  <div className="px-5 pb-10 pt-6 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>
                    Sin actualizaciones recientes.
                  </div>
                ) : (
                  <div className="pb-2">
                    {data.ciecActualizadas.map((c, i) => (
                      <div
                        key={`${c.rfc}-${i}`}
                        className="px-5 py-3 flex items-center gap-3"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                        >
                          <KeyRound size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>
                            {c.legalName || c.rfc}
                          </div>
                          <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                            {new Date(c.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
