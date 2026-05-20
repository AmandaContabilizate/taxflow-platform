import { FilePlus, FileText } from 'lucide-react'
import { useHasRfc } from '@/features/taxpayers/stores/rfcStore'
import { DISPLAY, MONO } from '../constants'
import type { GoFn } from '../types'
import { Btn, Card, Divider, HelpBox, SummaryStat, Tabs, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

export function FacturasScreen({ go }: Props) {
  const { hasRfc, loading } = useHasRfc()
  if (loading) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="emitir facturas" />

  const facturas = [
    { t: 'Empresa ABC S.A.', s: '15 abr · Servicios profesionales', a: '$35,000', paid: true },
    { t: 'Juan Pérez López', s: '12 abr · Honorarios', a: '$15,000', paid: false },
    { t: 'Tech Solutions MX', s: '10 abr · Consultoría', a: '$25,000', paid: true },
    { t: 'Clínica del Norte', s: '5 abr · Asesoría', a: '$45,000', paid: false },
    { t: 'María González', s: '1 abr · Servicios', a: '$8,000', paid: true },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-[960px]">
      <HelpBox>
        <strong>¿Qué es una factura?</strong> Es un comprobante (CFDI) que le das a tus clientes cuando te pagan. El SAT
        la usa para saber cuánto ganaste.
      </HelpBox>

      <Tabs items={['Emitidas', 'Recibidas']} active={0} />

      <div
        className="rounded-3xl p-6 lg:p-7"
        style={{ background: 'var(--hero-brand-soft)', border: '1px solid var(--brand-200)' }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[24px] font-extrabold tracking-tight" style={DISPLAY}>
              ¿Le diste un servicio a alguien?
            </div>
            <div className="text-[14px] mt-2 max-w-[460px]" style={{ color: 'var(--ink-700)' }}>
              Crea tu factura en un par de clics. Te guiamos paso a paso.
            </div>
          </div>
          <Btn kind="brand" size="lg">
            <FilePlus size={20} /> Crear nueva factura
          </Btn>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryStat label="Este mes" value="5 facturas" hint="Todas las que has emitido" />
        <SummaryStat label="Ya te pagaron" value="3" hint="$68,000 cobrados" tone="ok" />
        <SummaryStat label="Te deben" value="2" hint="$60,000 pendientes" tone="warn" />
      </div>

      <div>
        <div className="text-[16px] font-bold mb-3" style={{ color: 'var(--ink-700)' }}>
          Tus facturas de abril
        </div>
        <Card>
          <div>
            {facturas.map((r, i, arr) => (
              <div key={r.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: r.paid ? 'var(--brand-50)' : 'var(--amber-soft)',
                      color: r.paid ? 'var(--brand-700)' : '#7B5312',
                    }}
                  >
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px] truncate">{r.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {r.s}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[14.5px] font-extrabold" style={MONO}>
                      {r.a}
                    </div>
                    <div
                      className="text-[11.5px] font-bold mt-0.5"
                      style={{ color: r.paid ? 'var(--brand-700)' : '#7B5312' }}
                    >
                      {r.paid ? '✓ Pagada' : 'Pendiente'}
                    </div>
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <VideoSlot title="Cómo crear tu primera factura" duration="4 min" />
    </div>
  )
}
