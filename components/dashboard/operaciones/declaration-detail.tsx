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
import { useEffect, useState } from 'react'
import { getDeclarationGeneral } from '@/features/operations/actions/getDeclarationGeneral.action'
import type { DeclarationGeneral, DeclarationSubject } from '@/features/operations/types'
import { CalculosTab } from './calculos-tab'
import { ComprobantesTab } from './comprobantes-tab'
import { DISPLAY, MONO } from '../constants'
import { Card } from '../ui'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

const TAB_ITEMS = ['Comprobantes', 'Cálculos', 'Clasificación', 'Reporte Cliente'] as const

// Datos dummy — el EP /general aún no entrega datos; reconectar cuando esté listo.
const DUMMY = {
  ingresosBrutos: 29000,
  gastosDeducibles: 8120,
  isrCalculado: 2610,
  ivaPorPagar: 2880,
}

interface Props {
  declaration: DeclarationSubject
  onBack: () => void
}

export function DeclarationDetail({ declaration: d, onBack }: Props) {
  const [tab, setTab] = useState(0)
  const [general, setGeneral] = useState<DeclarationGeneral | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const res = await getDeclarationGeneral(d.declarationId)
      if (!cancelled && res.success) setGeneral(res.value)
    })()
    return () => {
      cancelled = true
    }
  }, [d.declarationId])

  // El régimen y el ejercicio son la referencia del contador: salen de /general
  // y caen a lo que traía el listado mientras carga.
  const ejercicio = general?.fiscalYear ?? d.fiscalYear
  const periodo = general?.periodo ?? d.periodo
  const periodicidad = general?.periodicity ?? null
  const regimen = general?.regimeName
    ? `${general.regimeSatCode ?? ''} ${general.regimeName}`.trim()
    : null

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
              <code style={MONO}>{d.rfc}</code> • {periodo} {ejercicio}
              {periodicidad ? ` • ${periodicidad}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <MetaChip label="Ejercicio" value={String(ejercicio)} />
              <MetaChip label="Régimen" value={regimen ?? 'Sin régimen asignado'} muted={!regimen} />
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
      {tab === 0 && <ComprobantesTab declarationId={d.declarationId} periodo={`${periodo} ${ejercicio}`} />}
      {tab === 1 && <CalculosTab declarationId={d.declarationId} />}
      {tab === 2 && <ClasificacionTab />}
      {tab === 3 && <ReporteClienteTab d={d} />}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Chip de metadato (ejercicio, régimen)                                     */
/* -------------------------------------------------------------------------- */

function MetaChip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px]"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <span className="font-semibold uppercase tracking-wide text-[10px]" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      <span className="font-bold" style={{ color: muted ? 'var(--ink-500)' : 'var(--ink-900)' }}>
        {value}
      </span>
    </span>
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
/*  Tokens de color compartidos por Clasificación y Reporte Cliente            */
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

function ReporteClienteTab({ d }: { d: DeclarationSubject }) {
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

