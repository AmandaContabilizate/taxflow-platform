import { CheckCircle2, ChevronLeft, MessageCircle } from 'lucide-react'
import { DISPLAY } from '../constants'
import type { GoFn } from '../types'
import { Badge, Btn, Card, VideoSlot } from '../ui'

interface Props {
  go: GoFn
}

export function TipDetailScreen({ go }: Props) {
  const deducibles = ['Gasolina y diesel', 'Refacciones y mantenimiento', 'Seguro de auto', 'Verificación y tenencia']

  return (
    <div className="flex flex-col gap-5 max-w-[820px]">
      <button
        onClick={() => go('aprende')}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold w-fit"
        style={{ color: 'var(--ink-500)' }}
      >
        <ChevronLeft size={16} /> Volver a lecciones
      </button>

      <div className="flex gap-2 flex-wrap">
        <Badge kind="brand">Fiscal</Badge>
        <Badge>4 min de lectura</Badge>
      </div>

      <div className="text-[32px] lg:text-[42px] font-extrabold tracking-tight leading-tight" style={DISPLAY}>
        Deduce gasolina, mantenimiento y seguro
      </div>
      <div className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-700)' }}>
        Si usas tu auto para trabajar (por ejemplo en Uber, Didi, Rappi o repartos), estos gastos pueden bajar lo que
        pagas de impuestos. Te lo explicamos paso a paso.
      </div>

      <VideoSlot title="Mira esta lección en video" duration="4 min" />

      <Card>
        <div className="p-5 lg:p-6">
          <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>
            Paso 1
          </div>
          <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
            Qué cosas puedes deducir
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
            {deducibles.map(x => (
              <div key={x} className="flex items-center gap-2.5">
                <CheckCircle2 size={18} color="var(--brand-500)" />
                <span className="text-[14px]">{x}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-5 lg:p-6">
          <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--brand-700)' }}>
            Paso 2
          </div>
          <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
            Qué necesitas conservar
          </div>
          <div className="text-[14px] mt-3 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            Pide siempre <strong>factura a tu nombre</strong>. Si el gasto pasa de $2,000 MXN, paga con tarjeta o
            transferencia (no en efectivo, porque entonces no cuenta).
          </div>
        </div>
      </Card>

      <div
        className="rounded-3xl p-5 lg:p-6"
        style={{ background: 'var(--coral-soft)', border: '1px solid rgba(255,136,98,0.35)' }}
      >
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: '#9E3A15' }}>
          Error común
        </div>
        <div className="text-[18px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
          Pagar gasolina en efectivo
        </div>
        <div className="text-[14px] mt-2 leading-relaxed" style={{ color: '#6B2512' }}>
          Si pagas con efectivo, el SAT no te lo acepta como deducible. Usa tarjeta o monedero electrónico de
          gasolinera.
        </div>
      </div>

      <div
        className="rounded-3xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', boxShadow: 'var(--sh-brand)' }}
      >
        <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Lo que esto significa para ti
        </div>
        <div className="text-[40px] lg:text-[48px] font-extrabold tracking-tight leading-none mt-2" style={DISPLAY}>
          $4,100
        </div>
        <div className="text-[13.5px] mt-1.5" style={{ color: 'rgba(255,255,255,0.9)' }}>
          de ahorro estimado al año, según tus ingresos actuales
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Btn kind="ghost" size="lg" block>
          <CheckCircle2 size={18} /> Me sirvió
        </Btn>
        <Btn kind="primary" size="lg" block>
          <MessageCircle size={18} /> Tengo una duda
        </Btn>
      </div>
    </div>
  )
}
