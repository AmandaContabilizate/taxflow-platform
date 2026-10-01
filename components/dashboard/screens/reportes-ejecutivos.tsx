'use client'

import { BarChart3, Calendar, Download, FileText, Sparkles, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { ExportCenterTab } from '../reportes/export-center-tab'
import { KpisSummaryGrid } from '../reportes/kpis-summary-grid'
import { Card } from '../ui'

interface ReportesEjecutivosScreenProps {
  permissions?: string[]
}

const TABS = [
  { id: 'kpis', label: 'Métricas y KPIs Ejecutivos', icon: TrendingUp },
  { id: 'exports', label: 'Centro de Exportaciones', icon: Download },
]

export function ReportesEjecutivosScreen({ permissions }: ReportesEjecutivosScreenProps) {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1)
  const [activeTab, setActiveTab] = useState<'kpis' | 'exports'>('kpis')

  return (
    <div className="flex flex-col gap-6 max-w-full">
      {/* Encabezado y Selector de Contexto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-black tracking-tight" style={{ color: 'var(--ink-900)' }}>
            Reportes Ejecutivos y Business Intelligence
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
            Supervisión integral de rendimiento, avance tributario y exportaciones consolidadas para dirección.
          </p>
        </div>

        {/* Selector Rápido de Ejercicio */}
        <div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl self-start sm:self-auto"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Calendar size={15} className="text-violet-600" />
          <span className="text-[12px] font-bold" style={{ color: 'var(--ink-600)' }}>
            Ejercicio {selectedYear}
          </span>
        </div>
      </div>

      {/* Selector de Pestañas */}
      <div className="inline-flex gap-1.5 p-1.5 rounded-full self-start" style={{ background: 'var(--muted)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'kpis' | 'exports')}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all duration-150"
              style={
                isActive
                  ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                  : { background: 'transparent', color: 'var(--ink-500)' }
              }
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Renderizado Condicional por Tab */}
      {activeTab === 'kpis' && (
        <KpisSummaryGrid year={selectedYear} month={selectedMonth} />
      )}

      {activeTab === 'exports' && (
        <ExportCenterTab initialYear={selectedYear} initialMonth={selectedMonth} />
      )}
    </div>
  )
}
