'use client'

import {
  ArrowLeft,
  Calculator,
  DollarSign,
  Download,
  Loader2,
  Mail,
  MessageSquarePlus,
  RotateCcw,
  Send,
  TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { DeclarationComments } from '@/components/dashboard/declaraciones/declaration-comments'
import { useRecalculation } from '@/features/declarations/hooks/useRecalculation'
import { getDeclarationGeneral } from '@/features/operations/actions/getDeclarationGeneral.action'
import type { DeclarationGeneral, DeclarationSubject } from '@/features/operations/types'
import { num, toNumber } from './calc-read'
import { CalculosTab } from './calculos-tab'
import { ComprobantesTab } from './comprobantes-tab'
import { RecalculoTab } from './recalculo-tab'
import { ResumenDeclaracion } from './resumen-declaracion'
import { DISPLAY, MONO } from '../constants'
import { Card } from '../ui'

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

const TAB_ITEMS = [
  'Comprobantes',
  'Cálculos',
  'Recálculo',
  'Clasificación',
  'Reporte Cliente',
  'Comentarios',
] as const
const RECALCULO_TAB_INDEX = 2
const COMMENTS_TAB_INDEX = TAB_ITEMS.length - 1

// Datos dummy — el EP /general aún no entrega datos; reconectar cuando esté listo.
const DUMMY = {
  ingresosBrutos: 29000,
  gastosDeducibles: 8120,
  isrCalculado: 2610,
  ivaPorPagar: 2880,
}

interface CurrentUser {
  userId: string
  fullName: string
}

interface Props {
  declaration: DeclarationSubject
  onBack: () => void
  currentUser: CurrentUser
}

/**
 * Detalle de la declaración para el contador. El contribuyente tiene su propia
 * pantalla (`ClientDeclarationDetail`): aquí viven el recálculo y la
 * clasificación, que el cliente no debe ver.
 */
export function DeclarationDetail({ declaration: d, onBack, currentUser }: Props) {
  const [tab, setTab] = useState(0)
  const [general, setGeneral] = useState<DeclarationGeneral | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setGeneral(null)
    setGeneralError(null)
    void (async () => {
      const res = await getDeclarationGeneral(d.declarationId)
      if (cancelled) return
      if (res.success) setGeneral(res.value)
      else setGeneralError(res.error.message)
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
  // Con un link directo (`?decl=`) no hubo listado previo: el nombre y el RFC
  // salen de /general.
  const legalName = general?.legalName || d.legalName
  const rfc = general?.rfc || d.rfc

  // El recálculo vive aquí y no en la pestaña: el botón del header y la pestaña
  // "Recálculo" comparten estado, y las tarjetas de arriba se repintan con el
  // resultado.
  const recalc = useRecalculation({
    rfc,
    fiscalYear: ejercicio,
    periodValueId: general?.periodValueId,
    regimeSatCode: general?.regimeSatCode,
  })

  // Entrada por URL directa: sin el listado detrás no hay nada que pintar hasta
  // que /general responda (las tabs necesitan ejercicio y periodo reales).
  const bootstrapping = !general && !d.legalName

  if (bootstrapping) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold self-start transition hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <Card>
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-center px-5">
            {generalError ? (
              <>
                <div className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  No pudimos abrir la declaración
                </div>
                <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>{generalError}</div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
                <Loader2 size={18} className="animate-spin" /> Cargando declaración…
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }
  // Con el resultado del recálculo ya no hay que volver a pedir /general: el
  // response del EP trae los totales nuevos.
  const r = recalc.result
  const stats = {
    ingresosBrutos: r?.income ?? r?.accumulatedIncome ?? toNumber(general?.accumulatedIncome) ?? DUMMY.ingresosBrutos,
    gastosDeducibles:
      num(r?.ivaDetail ?? null, ['totalExpenses', 'expenseTotal', 'subtotalExpenses']) ??
      DUMMY.gastosDeducibles,
    isrCalculado: r?.annualTax ?? toNumber(general?.annualTax) ?? DUMMY.isrCalculado,
    ivaPorPagar: r?.ivaCargo ?? DUMMY.ivaPorPagar,
  }

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
              Declaración — {legalName}
            </h2>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
              <code style={MONO}>{rfc}</code> • {periodo} {ejercicio}
              {periodicidad ? ` • ${periodicidad}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <MetaChip label="Ejercicio" value={String(ejercicio)} />
              <MetaChip label="Régimen" value={regimen ?? 'Sin régimen asignado'} muted={!regimen} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <HeaderBtn
            icon={
              recalc.running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />
            }
            label={recalc.running ? `Calculando… ${recalc.seconds}s` : 'Recalcular'}
            kind="ghost"
            disabled={recalc.running || !recalc.ready}
            title={
              recalc.ready
                ? 'Vuelve a calcular ISR/IVA con los comprobantes del período'
                : 'La declaración no tiene período o régimen asignado'
            }
            onClick={() => {
              setTab(RECALCULO_TAB_INDEX)
              void recalc.run()
            }}
          />
          <HeaderBtn icon={<Download size={15} />} label="Exportar PDF" kind="ghost" />
          <HeaderBtn icon={<Send size={15} />} label="Enviar Predeclaración" kind="info" />
          <HeaderBtn icon={<Send size={15} />} label="Presentar Declaración" kind="brand" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos Brutos" value={money(stats.ingresosBrutos)} color="var(--brand-700)" icon={<TrendingUp size={18} />} />
        <StatCard label="Gastos Deducibles" value={money(stats.gastosDeducibles)} color="var(--danger)" icon={<DollarSign size={18} />} />
        <StatCard label="ISR Calculado" value={money(stats.isrCalculado)} color="var(--sky)" icon={<Calculator size={18} />} />
        <StatCard label="IVA Por Pagar" value={money(stats.ivaPorPagar)} color="#7339FD" icon={<DollarSign size={18} />} />
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
      {tab === RECALCULO_TAB_INDEX && (
        <RecalculoTab
          rfc={rfc}
          fiscalYear={ejercicio}
          periodValueId={general?.periodValueId ?? null}
          taxRegimeId={general?.taxRegimeId ?? null}
          periodo={`${periodo} ${ejercicio}`}
          recalc={recalc}
        />
      )}
      {tab === 3 && (
        <ClasificacionTab
          declarationId={d.declarationId}
          general={general}
          periodo={periodo}
          fiscalYear={ejercicio}
        />
      )}
      {tab === 4 && (
        <ReporteClienteTab
          d={d}
          declarationId={d.declarationId}
          general={general}
          periodo={periodo}
          fiscalYear={ejercicio}
          onGoToComments={() => setTab(COMMENTS_TAB_INDEX)}
        />
      )}
      {tab === COMMENTS_TAB_INDEX && (
        <DeclarationComments declarationId={d.declarationId} currentUser={currentUser} />
      )}
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
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode
  label: string
  kind: 'ghost' | 'info' | 'brand'
  onClick?: () => void
  disabled?: boolean
  title?: string
}) {
  const styles: Record<typeof kind, React.CSSProperties> = {
    ghost: { background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' },
    info: { background: 'var(--card)', border: '1px solid var(--hero-info-border)', color: 'var(--sky)' },
    brand: { background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
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
/*  Props compartidas por Clasificación y Reporte Cliente                      */
/* -------------------------------------------------------------------------- */

interface ResumenProps {
  declarationId: number
  general: DeclarationGeneral | null
  periodo: string
  fiscalYear: number
}

/* -------------------------------------------------------------------------- */
/*  Tab: Clasificación                                                        */
/* -------------------------------------------------------------------------- */

function ClasificacionTab({ declarationId, general, periodo, fiscalYear }: ResumenProps) {
  return (
    <ResumenDeclaracion
      declarationId={declarationId}
      general={general}
      periodo={periodo}
      fiscalYear={fiscalYear}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Reporte Cliente                                                      */
/* -------------------------------------------------------------------------- */

function ReporteClienteTab({
  d,
  declarationId,
  general,
  periodo,
  fiscalYear,
  onGoToComments,
}: ResumenProps & { d: DeclarationSubject; onGoToComments: () => void }) {
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
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}>
            <Mail size={15} /> Enviar por Email
          </button>
          <button
            onClick={onGoToComments}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <MessageSquarePlus size={15} /> Agregar Comentario
          </button>
        </div>
      </div>
      {/* Resumen y desglose del periodo, con los datos del EP de cálculos */}
      <ResumenDeclaracion
        declarationId={declarationId}
        general={general}
        periodo={periodo}
        fiscalYear={fiscalYear}
      />
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

