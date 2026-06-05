'use client'

import { useState } from 'react'
import {
  AlertCircle,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { DISPLAY, MONO } from '../constants'
import { Badge, Card, Divider, Tabs } from '../ui'
import { Btn } from '../ui/btn'

interface Declaration {
  id: string
  clientName: string
  rfc: string
  status: 'por-presentar' | 'en-proceso' | 'presentada' | 'rechazada'
  activity: string
  period: string
  email: string
  phone: string
  assignedTo: string
  source: string
  lastUpdate: string
}

const MOCK_DECLARATIONS: Declaration[] = [
  {
    id: '1',
    clientName: 'Juan Pérez García',
    rfc: 'PEG.850100ABC',
    status: 'por-presentar',
    activity: 'Consultoría en Tecnología',
    period: 'Enero 2024',
    email: 'juan.perez@email.com',
    phone: '55-1234-5678',
    assignedTo: 'María González',
    source: 'MKT Digital',
    lastUpdate: '2024-02-17',
  },
  {
    id: '2',
    clientName: 'Ana López Martínez',
    rfc: 'LOMA.900215XYZ',
    status: 'en-proceso',
    activity: 'Venta de Productos Artesanales',
    period: 'Enero 2024',
    email: 'ana.lopez@gmail.com',
    phone: '55-2345-6789',
    assignedTo: 'Carlos Ruiz',
    source: 'Referido',
    lastUpdate: '2024-02-17',
  },
  {
    id: '3',
    clientName: 'Roberto Silva Hernández',
    rfc: 'SHR.750320DEF',
    status: 'presentada',
    activity: 'Servicios de Plomería',
    period: 'Ene-Feb 2024',
    email: 'roberto.silva@hotmail.com',
    phone: '55-3456-7890',
    assignedTo: 'María González',
    source: 'Ventas Directas',
    lastUpdate: '2024-03-17',
  },
  {
    id: '4',
    clientName: 'Carmen Rodríguez Vega',
    rfc: 'RVC.780912GHI',
    status: 'rechazada',
    activity: 'Servicios de Transporte (Uber)',
    period: 'Enero 2024',
    email: 'carmen.r@email.com',
    phone: '55-4567-8901',
    assignedTo: 'Miguel López',
    source: 'Publicidad Online',
    lastUpdate: '2024-02-15',
  },
]

const SUMMARY_STATS = [
  { label: 'Por Presentar', count: 12, color: '#E74C3C', bgColor: 'var(--coral-soft)' },
  { label: 'En Proceso', count: 8, color: '#F39C12', bgColor: 'var(--amber-soft)' },
  { label: 'Presentadas', count: 45, color: '#10DA92', bgColor: 'var(--brand-100)' },
  { label: 'Disc. Inválida', count: 3, color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)' },
  { label: 'Total Clientes', count: 65, color: '#6366F1', bgColor: 'var(--ink-50)' },
]

type TabKey = 'declaraciones' | 'calendario' | 'auditoria' | 'reportes'

const TAB_LABELS: Record<TabKey, string> = {
  declaraciones: 'Declaraciones',
  calendario: 'Calendario',
  auditoria: 'Auditoría',
  reportes: 'Reportes',
}

const STATUS_CONFIG = {
  'por-presentar': {
    label: 'Por Presentar',
    color: '#9E3A15',
    bgColor: 'var(--coral-soft)',
    icon: AlertCircle,
  },
  'en-proceso': {
    label: 'En Proceso',
    color: '#7B5312',
    bgColor: 'var(--amber-soft)',
    icon: FileText,
  },
  presentada: {
    label: 'Presentada',
    color: '#00A068',
    bgColor: 'var(--brand-100)',
    icon: FileText,
  },
  rechazada: {
    label: 'Disc. Inválida',
    color: '#7C3AED',
    bgColor: 'rgba(124,58,237,0.1)',
    icon: AlertCircle,
  },
}

export function OperacionesScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('declaraciones')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRegimen, setSelectedRegimen] = useState<string>('Todos los regímenes')
  const [selectedStatus, setSelectedStatus] = useState<string>('Todos los estados')
  const [selectedAccountant, setSelectedAccountant] = useState<string>('Todos los contadores')
  const [selectedHistorical, setSelectedHistorical] = useState<string>('Todo el histórico')

  const filteredDeclarations = MOCK_DECLARATIONS.filter((d) => {
    const matchesSearch =
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const order: TabKey[] = ['declaraciones', 'calendario', 'auditoria', 'reportes']

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {SUMMARY_STATS.map((stat) => (
          <Card key={stat.label}>
            <div className="p-4">
              <div
                className="inline-flex items-center justify-center w-8 h-8 rounded-xl mb-2"
                style={{ background: stat.bgColor, color: stat.color }}
              >
                <Users size={16} />
              </div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                {stat.label}
              </div>
              <div
                className="text-[28px] font-extrabold tracking-tight mt-0.5"
                style={{ color: 'var(--ink-900)', ...DISPLAY }}
              >
                {stat.count}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search Bar */}
      <Card>
        <div className="p-4">
          <div className="relative">
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }} />
            <input
              type="text"
              placeholder="Buscar por cliente o RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg"
              style={{
                background: 'var(--input)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              }}
            />
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={selectedRegimen}
          onChange={(e) => setSelectedRegimen(e.target.value)}
          className="px-4 py-2.5 rounded-lg"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <option>Todos los regímenes</option>
          <option>RESICO</option>
          <option>Actividad Empresarial</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <option>Todos los estados</option>
          <option>Por Presentar</option>
          <option>En Proceso</option>
          <option>Presentada</option>
        </select>

        <select
          value={selectedAccountant}
          onChange={(e) => setSelectedAccountant(e.target.value)}
          className="px-4 py-2.5 rounded-lg"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <option>Todos los contadores</option>
          <option>María González</option>
          <option>Carlos Ruiz</option>
          <option>Miguel López</option>
        </select>

        <select
          value={selectedHistorical}
          onChange={(e) => setSelectedHistorical(e.target.value)}
          className="px-4 py-2.5 rounded-lg"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          <option>Todo el histórico</option>
          <option>Últimos 30 días</option>
          <option>Últimos 90 días</option>
          <option>Este año</option>
        </select>
      </div>

      {/* Tabs */}
      <Tabs items={order.map((k) => TAB_LABELS[k])} active={order.indexOf(activeTab)} onChange={(i) => setActiveTab(order[i])} />

      {/* Declarations List */}
      {activeTab === 'declaraciones' && (
        <Card>
          <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <div>
              <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Lista de Declaraciones
              </div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                Gestiona todas las declaraciones fiscales de tus clientes
              </div>
            </div>
            <Btn size="sm" kind="brand">
              <Plus size={16} /> Nueva declaración
            </Btn>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Cliente
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    RFC
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Estado
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Actividad
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Período
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Contador
                  </th>
                  <th className="px-5 py-3 text-left font-extrabold" style={{ color: 'var(--ink-700)' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDeclarations.map((decl) => {
                  const statusConfig = STATUS_CONFIG[decl.status]
                  return (
                    <tr key={decl.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="px-5 py-4">
                        <div>
                          <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                            {decl.clientName}
                          </div>
                          <div className="text-xs mt-1" style={{ color: 'var(--ink-500)' }}>
                            📧 {decl.email}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--ink-500)' }}>
                            📞 {decl.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>
                          {decl.rfc}
                        </code>
                      </td>
                      <td className="px-5 py-4">
                        <div
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: statusConfig.bgColor, color: statusConfig.color }}
                        >
                          <statusConfig.icon size={12} />
                          {statusConfig.label}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {decl.activity}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {decl.period}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-sm" style={{ color: 'var(--ink-700)' }}>
                          {decl.assignedTo}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                              background: 'var(--ink-50)',
                              color: 'var(--ink-700)',
                              border: '1px solid var(--border)',
                            }}
                            title="Ver detalles"
                          >
                            <Eye size={14} />
                            Ver
                          </button>
                          <button
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                              background: 'var(--brand-100)',
                              color: 'var(--brand-700)',
                              border: '1px solid var(--brand-200)',
                            }}
                            title="Editar"
                          >
                            <Pencil size={14} />
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filteredDeclarations.length === 0 && (
            <div className="text-center py-8">
              <div style={{ color: 'var(--ink-500)' }}>No se encontraron declaraciones</div>
            </div>
          )}
        </Card>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'declaraciones' && (
        <Card>
          <div className="px-5 py-8 text-center">
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              {TAB_LABELS[activeTab]}
            </div>
            <div className="text-[12.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Esta sección estará disponible pronto
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
