'use client'

import { Activity, ArrowUpRight, BarChart3, CheckCircle2, DollarSign, TrendingUp, Users } from 'lucide-react'
import { Card } from '../ui'
import { DISPLAY } from '../constants'

interface KpisSummaryGridProps {
  year: number
  month: number
}

/**
 * Grid de KPIs ejecutivos para consolidación de métricas de negocio,
 * avance operativo de declaraciones y cumplimiento tributario.
 */
export function KpisSummaryGrid({ year, month }: KpisSummaryGridProps) {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]
  const currentMonthName = monthNames[month - 1] ?? 'Periodo actual'

  const kpis = [
    {
      title: 'Cumplimiento de Declaraciones',
      value: '94.2%',
      delta: '+2.8% vs mes anterior',
      deltaType: 'positive',
      hint: `${currentMonthName} ${year} · Cartera global`,
      icon: CheckCircle2,
      accent: 'var(--brand-500)',
      bg: 'rgba(57, 193, 110, 0.08)',
    },
    {
      title: 'Padrón de Contribuyentes Activos',
      value: '1,420',
      delta: '+48 nuevas altas',
      deltaType: 'positive',
      hint: 'Contribuyentes con declaraciones al corriente',
      icon: Users,
      accent: 'var(--violet-ink)',
      bg: 'rgba(115, 57, 253, 0.08)',
    },
    {
      title: 'Efectividad Operativa de Contadores',
      value: '98.5%',
      delta: 'Tiempo prom. de entrega: 2.1 días',
      deltaType: 'neutral',
      hint: 'Pool de operaciones contables',
      icon: Activity,
      accent: 'oklch(0.65 0.18 240)',
      bg: 'rgba(59, 130, 246, 0.08)',
    },
    {
      title: 'Volumen Facturado Estimado',
      value: '$4.85M',
      delta: '+12.4% vs promedio anual',
      deltaType: 'positive',
      hint: `CFDIs clasificados en ${year}`,
      icon: DollarSign,
      accent: 'oklch(0.7 0.15 150)',
      bg: 'rgba(16, 185, 129, 0.08)',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div
              key={kpi.title}
              className="rounded-3xl p-5 relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                  {kpi.title}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: kpi.bg, color: kpi.accent }}
                >
                  <Icon size={17} />
                </div>
              </div>

              <div className="text-[28px] font-black tracking-tight mt-3" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                {kpi.value}
              </div>

              <div className="flex items-center gap-1.5 mt-2 text-[12px] font-semibold text-emerald-600">
                <ArrowUpRight size={14} />
                <span>{kpi.delta}</span>
              </div>

              <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                {kpi.hint}
              </div>
            </div>
          )
        })}
      </div>

      {/* Banner de Estado de Cumplimiento General */}
      <Card
        className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        style={{
          background: 'linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: 'var(--brand-500)', color: '#fff' }}
          >
            <TrendingUp size={24} />
          </div>
          <div>
            <h4 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Índice de Salud Tributaria Consolidado
            </h4>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              El 94.2% de los contribuyentes asignados cuentan con CIEC válida y declaraciones presentadas en regla.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className="px-3.5 py-1.5 rounded-full text-[12px] font-extrabold uppercase tracking-wide"
            style={{
              background: 'rgba(57, 193, 110, 0.15)',
              color: 'var(--brand-700)',
              border: '1px solid var(--brand-200)',
            }}
          >
            Salud Óptima
          </span>
        </div>
      </Card>
    </div>
  )
}
