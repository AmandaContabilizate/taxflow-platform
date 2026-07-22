'use client'

import {
  ArrowLeft,
  Calculator,
  ChevronRight,
  DollarSign,
  Download,
  FileText,
  Mail,
  MessageSquarePlus,
  Search,
  Send,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import type { PaidPendingDeclaration } from '@/features/operations/types'
import { DISPLAY, MONO } from '../constants'
import { Card } from '../ui'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

const TAB_ITEMS = ['Comprobantes', 'Cálculos', 'Clasificación', 'Reporte Cliente'] as const

// Datos dummy — el backend aún no entrega el detalle fiscal de la declaración.
const DUMMY = {
  ingresosBrutos: 29000,
  gastosDeducibles: 8120,
  isrCalculado: 2610,
  ivaPorPagar: 2880,
}

interface Props {
  declaration: PaidPendingDeclaration
  onBack: () => void
}

export function DeclarationDetail({ declaration: d, onBack }: Props) {
  const [tab, setTab] = useState(0)

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition hover:opacity-90"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h2
              className="text-[24px] lg:text-[28px] font-extrabold tracking-tight leading-tight"
              style={{ ...DISPLAY, color: 'var(--ink-900)' }}
            >
              Declaración — {d.legalName}
            </h2>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
              <code style={MONO}>{d.rfc}</code> • {d.periodo}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <HeaderBtn icon={<Download size={15} />} label="Exportar PDF" kind="ghost" />
          <HeaderBtn icon={<Send size={15} />} label="Enviar Predeclaración" kind="info" />
          <HeaderBtn icon={<Send size={15} />} label="Presentar Declaración" kind="brand" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos Brutos" value={money(DUMMY.ingresosBrutos)} color="var(--brand-700)" icon={<TrendingUp size={18} />} />
        <StatCard label="Gastos Deducibles" value={money(DUMMY.gastosDeducibles)} color="var(--danger)" icon={<DollarSign size={18} />} />
        <StatCard label="ISR Calculado" value={money(DUMMY.isrCalculado)} color="var(--sky)" icon={<Calculator size={18} />} />
        <StatCard label="IVA Por Pagar" value={money(DUMMY.ivaPorPagar)} color="#E8730F" icon={<DollarSign size={18} />} />
      </div>

      {/* Tabs */}
      <div
        className="flex p-1 rounded-2xl overflow-x-auto"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {TAB_ITEMS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl text-[13.5px] font-bold transition"
            style={
              i === tab
                ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                : { background: 'transparent', color: 'var(--ink-500)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && <ComprobantesTab d={d} />}
      {tab === 1 && <CalculosTab />}
      {tab === 2 && <ClasificacionTab />}
      {tab === 3 && <ReporteClienteTab d={d} />}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header button                                                             */
/* -------------------------------------------------------------------------- */

function HeaderBtn({
  icon,
  label,
  kind,
}: {
  icon: React.ReactNode
  label: string
  kind: 'ghost' | 'info' | 'brand'
}) {
  const styles: Record<typeof kind, React.CSSProperties> = {
    ghost: { background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' },
    info: { background: 'var(--card)', border: '1px solid var(--hero-info-border)', color: 'var(--sky)' },
    brand: { background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
  }
  return (
    <button
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-95 active:scale-[0.98]"
      style={styles[kind]}
    >
      {icon} {label}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            {label}
          </div>
          <div className="text-[24px] font-extrabold tracking-tight mt-1.5" style={{ ...DISPLAY, color }}>
            {value}
          </div>
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Comprobantes                                                         */
/* -------------------------------------------------------------------------- */

interface Cfdi {
  folio: string
  fecha: string
  tipo: 'Emitido' | 'Recibido'
  tipoComprobante: 'Ingreso' | 'Egreso'
  rfcEmisor: string
  rfcReceptor: string
  subtotal: number
  iva: number
  tasaIva: string
  total: number
  status: string
  clasificacion: 'Considerado' | 'No considerado'
}

const DUMMY_CFDIS: Cfdi[] = [
  { folio: 'A001', fecha: '2024-01-15', tipo: 'Emitido', tipoComprobante: 'Ingreso', rfcEmisor: 'PEGJ850101ABC', rfcReceptor: 'EAB123456789', subtotal: 10000, iva: 1600, tasaIva: '16%', total: 11600, status: 'Vigente', clasificacion: 'Considerado' },
  { folio: 'A002', fecha: '2024-01-20', tipo: 'Emitido', tipoComprobante: 'Ingreso', rfcEmisor: 'PEGJ850101ABC', rfcReceptor: 'CXY987654321', subtotal: 15000, iva: 2400, tasaIva: '16%', total: 17400, status: 'Vigente', clasificacion: 'No considerado' },
  { folio: 'B001', fecha: '2024-01-10', tipo: 'Recibido', tipoComprobante: 'Egreso', rfcEmisor: 'PDF456789123', rfcReceptor: 'PEGJ850101ABC', subtotal: 2000, iva: 320, tasaIva: '16%', total: 2320, status: 'Vigente', clasificacion: 'Considerado' },
  { folio: 'B002', fecha: '2024-01-25', tipo: 'Recibido', tipoComprobante: 'Egreso', rfcEmisor: 'SGH789123456', rfcReceptor: 'PEGJ850101ABC', subtotal: 5000, iva: 800, tasaIva: '16%', total: 5800, status: 'Vigente', clasificacion: 'Considerado' },
]

function ComprobantesTab({ d }: { d: PaidPendingDeclaration }) {
  const [subTab, setSubTab] = useState(0)

  return (
    <Card>
      <div className="p-5 flex flex-col gap-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              CFDIs Emitidos y Recibidos
            </h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Comprobantes fiscales para el período {d.periodo}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              + Agregar Comprobante sin XML
            </button>
            <button
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              + Agregar CFDI
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-500)' }} />
          <input
            type="text"
            placeholder="Buscar CFDI…"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-[13px]"
            style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
          />
        </div>

        {/* Sub-tabs */}
        <div className="flex p-1 rounded-xl" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
          {['CFDIs Normales', 'CFDIs de Retenciones'].map((t, i) => (
            <button
              key={t}
              onClick={() => setSubTab(i)}
              className="flex-1 px-4 py-2 rounded-lg text-[13px] font-bold transition"
              style={
                i === subTab
                  ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                  : { background: 'transparent', color: 'var(--ink-500)' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
          >
            <SlidersHorizontal size={15} />
          </button>
          {['Todos', 'Todos los tipos', 'Todos'].map((f, i) => (
            <select
              key={`${f}-${i}`}
              className="px-3 py-2 rounded-lg text-[12.5px] font-semibold"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--ink-700)' }}
              defaultValue=""
            >
              <option value="">{f}</option>
            </select>
          ))}
        </div>

        {/* Table */}
        {subTab === 0 ? (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Conceptos', 'Folio', 'Fecha', 'Tipo', 'Tipo Comprobante', 'RFC Emisor', 'RFC Receptor', 'Subtotal', 'IVA', 'Tasa IVA', 'Total', 'Status', 'Estatus Clasificación', 'Acciones'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DUMMY_CFDIS.map((c) => (
                  <tr key={c.folio} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="px-3 py-3">
                      <ChevronRight size={15} style={{ color: 'var(--ink-500)' }} />
                    </td>
                    <td className="px-3 py-3 font-semibold" style={{ color: 'var(--ink-900)' }}>{c.folio}</td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{c.fecha}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ background: 'var(--ink-900)', color: 'var(--card)' }}>
                        {c.tipo}
                      </span>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--ink-700)' }}>{c.tipoComprobante}</td>
                    <td className="px-3 py-3 whitespace-nowrap"><code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{c.rfcEmisor}</code></td>
                    <td className="px-3 py-3 whitespace-nowrap"><code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-700)' }}>{c.rfcReceptor}</code></td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{money(c.subtotal)}</td>
                    <td className="px-3 py-3 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{money(c.iva)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold" style={{ background: 'var(--sky-soft)', color: 'var(--sky)' }}>
                        {c.tasaIva}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap font-semibold" style={{ color: 'var(--ink-900)' }}>{money(c.total)}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ background: 'var(--ink-900)', color: 'var(--card)' }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {c.clasificacion === 'Considerado' ? (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ background: 'var(--ink-900)', color: 'var(--card)' }}>
                          Considerado
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold" style={{ background: 'var(--muted)', color: 'var(--ink-500)' }}>
                          No considerado
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-bold" style={{ color: 'var(--ink-500)' }}>⋯</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            No hay CFDIs de retenciones en este período.
          </div>
        )}
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Cálculos                                                             */
/* -------------------------------------------------------------------------- */

type CellTone = 'red' | 'green' | 'blue' | 'violet' | 'amber' | 'neutral'

const CELL_BG: Record<CellTone, string> = {
  red: 'var(--coral-soft)',
  green: 'var(--brand-50)',
  blue: 'var(--sky-soft)',
  violet: 'var(--violet-soft)',
  amber: 'var(--amber-soft)',
  neutral: 'var(--muted)',
}

function CalcCell({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: CellTone }) {
  return (
    <div className="flex-1 min-w-[150px] rounded-xl p-3" style={{ background: CELL_BG[tone], border: '1px solid var(--border)' }}>
      <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[14px] font-extrabold mt-1" style={{ color: 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}

function CalcSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>{title}</h4>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function CalculosTab() {
  return (
    <Card>
      <div className="p-5 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Cálculos Fiscales</h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Determinación de impuestos para RESICO</p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12.5px] font-bold"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            Editar Cálculos
          </button>
        </div>

        <CalcSection title="Detalles Generales">
          <CalcCell label="Deducciones Autorizadas" value={money(8120)} tone="red" />
          <CalcCell label="Deducciones No Autorizadas" value={money(0)} />
          <CalcCell label="Deducción Ciega" value={money(0)} />
          <CalcCell label="Ingresos" value={money(29000)} tone="green" />
          <CalcCell label="Ingresos por Enajenación" value={money(23200)} tone="blue" />
          <CalcCell label="Ingresos por Hospedaje" value={money(0)} />
          <CalcCell label="Ingresos por Inmuebles" value={money(0)} />
          <CalcCell label="Deducciones Personales" value={money(2500)} tone="violet" />
          <CalcCell label="Total ISR" value={money(2610)} tone="blue" />
        </CalcSection>

        <CalcSection title="Enajenación y Prestación de Servicios">
          <CalcCell label="Ingresos intermediarios por enajenación" value={money(8700)} />
          <CalcCell label="Ingresos intermediarios por servicios" value={money(5800)} />
          <CalcCell label="Ingresos directos por enajenación" value={money(7250)} />
          <CalcCell label="Ingresos directos por servicios" value={money(7250)} />
          <CalcCell label="Ingresos totales del mes" value={money(29000)} tone="blue" />
          <CalcCell label="Tasa %" value="1.25%" tone="amber" />
          <CalcCell label="ISR causado" value={money(261)} tone="green" />
          <CalcCell label="Retenciones por plataformas" value={money(0)} />
        </CalcSection>

        <CalcSection title="Servicio Hospedaje">
          <CalcCell label="Ingresos mediante intermediarios" value={money(0)} />
          <CalcCell label="Ingresos directos del usuario" value={money(0)} />
          <CalcCell label="Ingresos totales del mes" value={money(0)} />
          <CalcCell label="Tasa %" value="4%" tone="amber" />
          <CalcCell label="ISR causado" value={money(0)} tone="green" />
          <CalcCell label="Retenciones por plataformas tecnológicas" value={money(0)} />
        </CalcSection>

        <CalcSection title="Servicio Terrestre">
          <CalcCell label="Ingresos intermediarios servicios terrestres" value={money(0)} />
          <CalcCell label="Ingresos intermediarios entrega bienes" value={money(0)} />
          <CalcCell label="Ingresos directos servicios terrestres" value={money(0)} />
          <CalcCell label="Ingresos directos entrega bienes" value={money(0)} />
          <CalcCell label="Ingresos totales del mes" value={money(0)} />
          <CalcCell label="Tasa %" value="2.1%" tone="amber" />
          <CalcCell label="ISR causado" value={money(0)} tone="green" />
          <CalcCell label="Retenciones por plataformas" value={money(0)} />
        </CalcSection>

        <CalcSection title="IVA">
          <CalcCell label="Ingresos mediante intermediarios" value={money(11600)} />
          <CalcCell label="Ingresos directos del usuario" value={money(17400)} />
          <CalcCell label="Ingresos totales del mes" value={money(29000)} tone="violet" />
          <CalcCell label="Tasa %" value="16%" tone="amber" />
          <CalcCell label="IVA causado" value={money(4000)} tone="green" />
          <CalcCell label="Retenciones IVA plataforma" value={money(0)} />
          <CalcCell label="IVA gastos (acreditable)" value={money(1120)} tone="red" />
          <CalcCell label="IVA periodo a declarar" value={money(2880)} tone="violet" />
          <CalcCell label="IVA acreditar periodos anteriores" value={money(0)} />
          <CalcCell label="IVA a favor" value={money(0)} tone="green" />
        </CalcSection>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Clasificación                                                        */
/* -------------------------------------------------------------------------- */

function ClasificacionTab() {
  return (
    <Card>
      <div className="p-5 flex flex-col gap-5">
        <div>
          <h3 className="text-[17px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Clasificación de Comprobantes</h3>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>Categorización de CFDIs por tipo y concepto</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h4 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Ingresos por Clasificación</h4>
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-200)' }}>
              <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>Servicios Profesionales</span>
              <span className="text-[15px] font-extrabold" style={{ color: 'var(--brand-700)' }}>{money(29000)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Gastos por Clasificación</h4>
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--coral-soft)', border: '1px solid var(--border)' }}>
              <span className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>Gastos Deducibles</span>
              <span className="text-[15px] font-extrabold" style={{ color: 'var(--danger)' }}>{money(8120)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Reporte Cliente                                                      */
/* -------------------------------------------------------------------------- */

function ReporteClienteTab({ d }: { d: PaidPendingDeclaration }) {
  const initials =
    d.legalName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'C'

  return (
    <div className="flex flex-col gap-5">
      {/* Report header card */}
      <div className="rounded-3xl p-5" style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
              style={{ background: 'var(--violet)', color: '#fff' }}
            >
              {initials}
            </div>
            <div>
              <h3 className="text-[18px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Reporte Fiscal — {d.periodo}
              </h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <MiniField label="Cliente" value={d.legalName} />
                <MiniField label="RFC" value={d.rfc} mono />
                <MiniField label="Ejercicio" value={String(d.fiscalYear)} />
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
              ✓ Declaración Lista
            </span>
            <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
              {d.accountantName ? `Revisado por ${d.accountantName}` : 'Revisado por contador certificado'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'var(--sky)', color: '#fff' }}>
            <Download size={15} /> Descargar Reporte PDF
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff' }}>
            <Mail size={15} /> Enviar por Email
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}>
            <MessageSquarePlus size={15} /> Agregar Comentario
          </button>
        </div>
      </div>

      {/* Resumen ejecutivo */}
      <Card>
        <div className="p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-[16px] font-extrabold flex items-center gap-2" style={{ color: 'var(--sky)' }}>
              <FileText size={17} /> Resumen Ejecutivo de su Declaración
            </h3>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Estimado cliente, aquí encontrará un resumen claro de su situación fiscal para el período {d.periodo}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ResumenCard value={money(29000)} label="Ingresos Totales" hint="Sus ingresos del periodo" tone="green" />
            <ResumenCard value={money(8120)} label="Gastos Deducibles" hint="Gastos que reducen sus impuestos" tone="red" />
            <ResumenCard value={money(2610)} label="ISR a Pagar" hint="Impuesto sobre la renta" tone="blue" />
            <ResumenCard value={money(2880)} label="IVA a Pagar" hint="Impuesto al valor agregado" tone="violet" />
          </div>
        </div>
      </Card>

      {/* Cálculos detallados y recomendaciones */}
      <Card>
        <div className="p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-[16px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Cálculos Detallados y Recomendaciones</h3>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Desglose completo de sus cálculos fiscales con recomendaciones de nuestros contadores expertos
            </p>
          </div>

          <RecomBlock
            tone="blue"
            title="Enajenación y Prestación de Servicios"
            subtitle="Ingresos por venta de bienes y servicios a través de plataformas"
            cells={[
              ['Ingresos por Intermediarios (Bienes)', money(0)],
              ['Ingresos por Intermediarios (Servicios)', money(0)],
              ['Ingresos Directos (Bienes)', money(0)],
              ['Ingresos Directos (Servicios)', money(0)],
              ['Total del Mes', money(29000)],
              ['Tasa de ISR Aplicable', '1.25%'],
              ['ISR Causado', money(261)],
              ['Retenciones por Plataformas', money(0)],
            ]}
            recomendacion="Sus ingresos por plataformas tecnológicas están sujetos a una tasa preferencial del 1.25% de ISR. Le recomendamos mantener un registro detallado de todos sus ingresos por plataforma."
          />

          <RecomBlock
            tone="green"
            title="Servicio de Hospedaje"
            subtitle="Ingresos por servicios de alojamiento temporal"
            cells={[
              ['Ingresos por Intermediarios', money(0)],
              ['Ingresos Directos', money(0)],
              ['Total del Mes', money(0)],
              ['Tasa ISR', '4%'],
              ['ISR Causado', money(0)],
            ]}
            recomendacion="Los servicios de hospedaje tienen una tasa del 4% de ISR. Si planea incursionar en este sector, asegúrese de cumplir con todos los requisitos locales de hospedaje."
          />

          <RecomBlock
            tone="violet"
            title="Impuesto al Valor Agregado (IVA)"
            subtitle="Cálculo del IVA causado y acreditable"
            cells={[
              ['Ingresos por Intermediarios', money(0)],
              ['Ingresos Directos', money(0)],
              ['Total Ingresos', money(29000)],
              ['Tasa IVA', '16%'],
              ['IVA Causado', money(4000)],
              ['Retenciones IVA', money(0)],
              ['IVA de Gastos (Acreditable)', money(1120)],
              ['IVA a Pagar', money(2880)],
              ['IVA Periodos Anteriores', money(0)],
              ['IVA a Favor', money(0)],
            ]}
            recomendacion="Tiene IVA por pagar de $2,880.00. Asegúrese de realizar el pago antes del día 17 del mes siguiente para evitar recargos."
          />
        </div>
      </Card>
    </div>
  )
}

function MiniField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[12.5px] font-bold" style={{ ...(mono ? MONO : {}), color: 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}

function ResumenCard({ value, label, hint, tone }: { value: string; label: string; hint: string; tone: CellTone }) {
  const colorMap: Record<string, string> = { green: 'var(--brand-700)', red: 'var(--danger)', blue: 'var(--sky)', violet: 'var(--violet)' }
  return (
    <div className="rounded-2xl p-4" style={{ background: CELL_BG[tone], border: '1px solid var(--border)' }}>
      <div className="text-[22px] font-extrabold tracking-tight" style={{ ...DISPLAY, color: colorMap[tone] }}>{value}</div>
      <div className="text-[13px] font-bold mt-1" style={{ color: 'var(--ink-900)' }}>{label}</div>
      <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{hint}</div>
    </div>
  )
}

function RecomBlock({
  tone,
  title,
  subtitle,
  cells,
  recomendacion,
}: {
  tone: CellTone
  title: string
  subtitle: string
  cells: [string, string][]
  recomendacion: string
}) {
  const accent: Record<string, string> = { green: 'var(--brand-700)', blue: 'var(--sky)', violet: 'var(--violet)' }
  return (
    <div className="rounded-2xl p-4" style={{ background: CELL_BG[tone], border: '1px solid var(--border)' }}>
      <h4 className="text-[15px] font-extrabold" style={{ color: accent[tone] ?? 'var(--ink-900)' }}>{title}</h4>
      <p className="text-[12px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{subtitle}</p>
      <div className="grid gap-2 mt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cells.map(([label, value]) => (
          <div key={label} className="rounded-xl p-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-[11px] font-semibold" style={{ color: 'var(--ink-500)' }}>{label}</div>
            <div className="text-[14px] font-extrabold mt-1" style={{ color: 'var(--ink-900)' }}>{value}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl p-3 mt-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="text-[12px] font-extrabold" style={{ color: accent[tone] ?? 'var(--ink-900)' }}>💡 Recomendación de su Contador:</div>
        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: 'var(--ink-700)' }}>{recomendacion}</p>
      </div>
    </div>
  )
}
