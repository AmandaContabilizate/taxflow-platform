import { useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Lock,
  MessageCircle,
  RotateCcw,
  ShoppingCart,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, Pill, Tabs, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

type TabKey = 'regularizaciones' | 'futuro' | 'anuales'

const TAB_LABELS: Record<TabKey, string> = {
  regularizaciones: 'Regularizaciones',
  futuro: 'Plan a futuro',
  anuales: 'Anuales',
}

export function DeclaracionesScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  const [tab, setTab] = useState<TabKey>('regularizaciones')

  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tus declaraciones" />

  const order: TabKey[] = ['regularizaciones', 'futuro', 'anuales']

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        <strong>Tus declaraciones, organizadas por momento.</strong> Resuelve el pasado, ten claridad del futuro y no
        olvides la anual. Todo lo prepara tu contador, tú solo autorizas.
      </HelpBox>

      <Tabs items={order.map((k) => TAB_LABELS[k])} active={order.indexOf(tab)} onChange={(i) => setTab(order[i])} />

      {tab === 'regularizaciones' && <RegularizacionesTab />}
      {tab === 'futuro' && <FuturoTab />}
      {tab === 'anuales' && <AnualesTab />}

      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          ¿Necesitas entender mejor?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {tab === 'regularizaciones' && (
            <>
              <VideoSlot title="¿Cómo funcionan las regularizaciones?" duration="3 min" />
              <VideoSlot title="¿Qué pasa si no presento a tiempo?" duration="2 min" />
            </>
          )}
          {tab === 'futuro' && (
            <>
              <VideoSlot title="¿Qué es una declaración mensual?" duration="3 min" />
              <VideoSlot title="¿Cómo autorizo mi declaración?" duration="2 min" />
            </>
          )}
          {tab === 'anuales' && (
            <>
              <VideoSlot title="La declaración anual, explicada" duration="4 min" />
              <VideoSlot title="¿Me toca pagar o me devuelven?" duration="3 min" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* TAB 1 — Regularizaciones                                          */
/* ---------------------------------------------------------------- */

interface RegItem {
  mes: string
  estado: 'comprada' | 'comprar' | 'correccion'
  detalle: string
}

const REG_ITEMS: RegItem[] = [
  { mes: 'Diciembre 2025', estado: 'comprada', detalle: 'Tu contador la está preparando' },
  { mes: 'Noviembre 2025', estado: 'correccion', detalle: 'Falta una factura para recalcular' },
  { mes: 'Octubre 2025', estado: 'comprar', detalle: 'No se ha presentado · contrátala para regularizar' },
  { mes: 'Septiembre 2025', estado: 'comprar', detalle: 'No se ha presentado · contrátala para regularizar' },
]

function RegularizacionesTab() {
  const compradas = REG_ITEMS.filter((r) => r.estado !== 'comprar').length
  const porComprar = REG_ITEMS.filter((r) => r.estado === 'comprar').length

  return (
    <>
      {/* Hero amber: el pasado a resolver */}
      <div
        className="rounded-3xl p-6 lg:p-7"
        style={{
          background: 'linear-gradient(155deg, #FFE6B8 0%, #F5B037 95%)',
          boxShadow: 'var(--sh-1)',
          color: '#4A2E00',
        }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.55)', color: '#7B5312' }}
              >
                <RotateCcw size={20} />
              </div>
              <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: '#7B5312' }}>
                Regularizar el pasado
              </div>
            </div>
            <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-3" style={DISPLAY}>
              {REG_ITEMS.length} meses por resolver
            </div>
            <div className="text-[14px] mt-2 max-w-[460px]" style={{ color: '#5a3a08' }}>
              {compradas} ya las tienes contratadas y van en proceso. {porComprar} aún no se presentan: puedes
              regularizarlas comprándolas aquí.
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: '#7B5312' }}>
              Avance
            </div>
            <div className="text-[36px] font-extrabold tracking-tight" style={DISPLAY}>
              {Math.round((compradas / REG_ITEMS.length) * 100)}%
            </div>
            <div className="w-[140px] h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.55)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${(compradas / REG_ITEMS.length) * 100}%`, background: '#7B5312' }}
              />
            </div>
          </div>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Meses a regularizar
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Resuelve uno a la vez, sin estrés
            </div>
          </div>
          <Pill kind="amber">
            <AlertTriangle size={12} /> {porComprar} por contratar
          </Pill>
        </div>
        <Divider />
        <div>
          {REG_ITEMS.map((r, i) => (
            <div key={r.mes}>
              <div className="flex items-center gap-3 px-5 py-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: r.estado === 'comprar' ? 'var(--coral-soft)' : 'var(--amber-soft)',
                    color: r.estado === 'comprar' ? '#9E3A15' : '#7B5312',
                  }}
                >
                  {r.estado === 'comprar' ? <ShoppingCart size={18} /> : <FileText size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                      {r.mes}
                    </div>
                    {r.estado === 'comprada' && <Badge kind="brand">En proceso</Badge>}
                    {r.estado === 'correccion' && <Badge kind="amber">Necesita corrección</Badge>}
                    {r.estado === 'comprar' && <Badge kind="coral">No presentada</Badge>}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {r.detalle}
                  </div>
                </div>
                {r.estado === 'comprar' ? (
                  <Btn size="sm" kind="brand">
                    Contratar
                  </Btn>
                ) : (
                  <Btn size="sm" kind="ghost">
                    Ver detalle
                  </Btn>
                )}
              </div>
              {i < REG_ITEMS.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* TAB 2 — Plan a futuro                                             */
/* ---------------------------------------------------------------- */

interface FuturoItem {
  mes: string
  estado: 'preparando' | 'pendiente' | 'futura'
  hint: string
}

const FUTURO_ITEMS: FuturoItem[] = [
  { mes: 'Junio 2026', estado: 'pendiente', hint: 'Empezamos el día 1 del mes siguiente' },
  { mes: 'Julio 2026', estado: 'futura', hint: 'Incluida en tu plan' },
  { mes: 'Agosto 2026', estado: 'futura', hint: 'Incluida en tu plan' },
  { mes: 'Septiembre 2026', estado: 'futura', hint: 'Incluida en tu plan' },
]

function FuturoTab() {
  return (
    <>
      {/* Hero brand: la actual */}
      <div
        className="rounded-3xl p-6 lg:p-7 text-white"
        style={{
          background: 'linear-gradient(155deg,#10DA92 0%,#00A068 75%)',
          boxShadow: 'var(--sh-brand)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
              La que toca este mes
            </div>
            <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-2" style={DISPLAY}>
              Mayo 2026 · vence el 17 de junio
            </div>
            <div className="text-[14px] mt-2 max-w-[460px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Tu contador ya revisó 9 de 12 facturas. Cuando termine, recibirás un aviso para que la autorices.
            </div>
          </div>
        </div>
        <div className="mt-5 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
          <div className="h-full rounded-full" style={{ width: '78%', background: '#fff' }} />
        </div>
        <div className="text-[12.5px] mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
          78% lista
        </div>
        <div className="flex gap-3 mt-5 flex-wrap">
          <Btn size="lg" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
            Ver detalle
          </Btn>
          <Btn
            size="lg"
            kind="ghost"
            style={{
              background: 'rgba(255,255,255,0.12)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.25)',
            }}
          >
            <MessageCircle size={18} /> Hablar con mi contador
          </Btn>
        </div>
      </div>

      {/* Resumen de cobertura del plan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <MiniStat icon={<CheckCircle2 size={16} />} label="Presentadas este año" value="4" tone="brand" />
        <MiniStat icon={<CalendarClock size={16} />} label="Restantes en tu plan" value={`${FUTURO_ITEMS.length}`} tone="ink" />
        <MiniStat icon={<TrendingUp size={16} />} label="Promedio mensual" value="$3,240" tone="brand" />
      </div>

      <Card>
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
              Lo que viene en tu plan
            </div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
              Próximas declaraciones mensuales · ya contratadas
            </div>
          </div>
          <Pill kind="brand">
            <CheckCircle2 size={12} /> Plan al corriente
          </Pill>
        </div>
        <Divider />
        <div>
          {FUTURO_ITEMS.map((f, i) => (
            <div key={f.mes}>
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: f.estado === 'pendiente' ? 'var(--brand-100)' : 'var(--ink-50)',
                      color: f.estado === 'pendiente' ? 'var(--brand-700)' : 'var(--ink-500)',
                    }}
                  >
                    {f.estado === 'pendiente' ? <ClipboardCheck size={18} /> : <CalendarClock size={18} />}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                      {f.mes}
                    </div>
                    {f.estado === 'pendiente' && <Badge kind="brand">Siguiente</Badge>}
                    {f.estado === 'futura' && <Badge kind="default">Programada</Badge>}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {f.hint}
                  </div>
                </div>
                {f.estado === 'futura' && (
                  <span className="text-[12px] flex items-center gap-1" style={{ color: 'var(--ink-500)' }}>
                    <Lock size={12} /> Aún no inicia
                  </span>
                )}
              </div>
              {i < FUTURO_ITEMS.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* TAB 3 — Anuales                                                   */
/* ---------------------------------------------------------------- */

interface AnualItem {
  ejercicio: string
  estado: 'presentada' | 'preparando' | 'pendiente'
  monto?: string
  detalle: string
}

const ANUAL_ITEMS: AnualItem[] = [
  { ejercicio: '2024', estado: 'presentada', monto: 'Saldo a favor $4,820', detalle: 'Presentada el 22 de abril 2025' },
  { ejercicio: '2023', estado: 'presentada', monto: 'ISR pagado $1,310', detalle: 'Presentada el 18 de abril 2024' },
]

function AnualesTab() {
  return (
    <>
      {/* Hero violeta: el ejercicio actual */}
      <div
        className="rounded-3xl p-6 lg:p-7 text-white relative overflow-hidden"
        style={{
          background: 'linear-gradient(155deg,#5B4FE8 0%,#2A1F8F 80%)',
          boxShadow: 'var(--sh-1)',
        }}
      >
        <div
          className="absolute -top-6 -right-6 w-40 h-40 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle,#FFD66B 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.18)' }}
            >
              <Sparkles size={20} />
            </div>
            <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Ejercicio 2025
            </div>
          </div>
          <div className="text-[28px] lg:text-[32px] font-extrabold tracking-tight mt-3" style={DISPLAY}>
            Tu declaración anual
          </div>
          <div className="text-[14px] mt-2 max-w-[480px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
            La preparamos a partir de enero 2026. Resume todo el año y puede generarte un saldo a favor que el SAT te
            devuelve.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            <AnualMini label="Se prepara desde" value="01 ene 2026" />
            <AnualMini label="Se presenta antes del" value="30 abr 2026" />
            <AnualMini label="Faltan" value="247 días" highlight />
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <Btn size="lg" style={{ background: '#fff', color: '#2A1F8F', boxShadow: 'none' }}>
              Ver qué necesitamos
            </Btn>
            <Btn
              size="lg"
              kind="ghost"
              style={{
                background: 'rgba(255,255,255,0.12)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              <MessageCircle size={18} /> Hablar con mi contador
            </Btn>
          </div>
        </div>
      </div>

      <Card>
        <div className="px-5 py-4">
          <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Anuales anteriores
          </div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            Tu historial fiscal, siempre a la mano
          </div>
        </div>
        <Divider />
        <div>
          {ANUAL_ITEMS.map((a, i) => (
            <div key={a.ejercicio}>
              <div className="flex items-center gap-3 px-5 py-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}
                >
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-bold text-[14.5px]" style={{ color: 'var(--ink-900)' }}>
                      Ejercicio {a.ejercicio}
                    </div>
                    <Badge kind="brand">Presentada</Badge>
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                    {a.detalle}
                  </div>
                </div>
                {a.monto && (
                  <span
                    className="text-[12.5px] font-extrabold px-3 py-1.5 rounded-full"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', ...MONO }}
                  >
                    {a.monto}
                  </span>
                )}
                <Btn size="sm" kind="ghost">
                  Descargar
                </Btn>
              </div>
              {i < ANUAL_ITEMS.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ---------------------------------------------------------------- */
/* Helpers visuales                                                   */
/* ---------------------------------------------------------------- */

function MiniStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone: 'brand' | 'ink'
}) {
  return (
    <Card>
      <div className="p-4">
        <div
          className="inline-flex items-center justify-center w-8 h-8 rounded-xl"
          style={{
            background: tone === 'brand' ? 'var(--brand-100)' : 'var(--ink-50)',
            color: tone === 'brand' ? 'var(--brand-700)' : 'var(--ink-700)',
          }}
        >
          {icon}
        </div>
        <div className="text-[12.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
          {label}
        </div>
        <div className="text-[22px] font-extrabold tracking-tight mt-0.5" style={{ color: 'var(--ink-900)', ...DISPLAY }}>
          {value}
        </div>
      </div>
    </Card>
  )
}

function AnualMini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded-2xl p-3"
      style={{
        background: highlight ? 'rgba(255,214,107,0.18)' : 'rgba(255,255,255,0.10)',
        border: highlight ? '1px solid rgba(255,214,107,0.45)' : '1px solid rgba(255,255,255,0.18)',
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.75)' }}>
        {label}
      </div>
      <div className="text-[18px] font-extrabold mt-1" style={DISPLAY}>
        {value}
      </div>
    </div>
  )
}
