import { MessageCircle, UserRound } from 'lucide-react'
import { DISPLAY } from '../constants'
import { Btn, Card, Divider, HelpBox, VideoSlot } from '../ui'

export function AyudaScreen() {
  const faqs = [
    { q: '¿Qué es el SAT?', a: 'Es la oficina del gobierno que se encarga de los impuestos en México. Todo el que trabaja debe declarar ahí.' },
    { q: '¿Qué es una declaración mensual?', a: 'Es el reporte que entregas cada mes al SAT con lo que ganaste y lo que pagas de impuestos.' },
    { q: '¿Qué es una factura (CFDI)?', a: 'Es un comprobante digital que demuestra que cobraste o pagaste por algo. El SAT las usa para saber tus ingresos y gastos.' },
    { q: '¿Para qué sirve mi Constancia de Situación Fiscal?', a: 'Es como tu identificación ante el SAT. Te la piden cuando te contratan o cuando facturas a una empresa.' },
    { q: '¿Y si no entiendo algo?', a: 'No te preocupes. Tu contador asignado responde tus dudas en menos de 2 horas desde la sección Mi cuenta.' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <HelpBox>
        Aquí encuentras videos cortos y respuestas a las dudas más comunes. Si algo no entiendes, escríbele a tu
        contador desde tu cuenta.
      </HelpBox>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          🎬 Videos para empezar
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Empieza por aquí si es tu primera vez en Contabilízate.
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <VideoSlot title="Bienvenida: ¿qué hacemos por ti?" duration="2 min" />
          <VideoSlot title="Tour rápido por tu panel" duration="3 min" />
          <VideoSlot title="Cómo conectarte al SAT" duration="2 min" />
          <VideoSlot title="Cómo emitir tu primera factura" duration="4 min" />
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          ❓ Preguntas frecuentes
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Las dudas más comunes, explicadas en palabras simples.
        </div>
        <Card>
          <div>
            {faqs.map((it, i, arr) => (
              <div key={it.q}>
                <div className="px-5 py-4">
                  <div className="font-bold text-[15px]" style={{ color: 'var(--ink-900)' }}>
                    {it.q}
                  </div>
                  <div className="text-[13.5px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-500)' }}>
                    {it.a}
                  </div>
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: 'var(--hero-amber)', border: '1px solid var(--hero-amber-border)' }}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--hero-amber-icon-bg)', color: '#7B5312' }}
          >
            <UserRound size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-extrabold tracking-tight" style={DISPLAY}>
              ¿Sigues con dudas?
            </div>
            <div className="text-[14px] mt-1.5 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
              Tu contador asignado puede ayudarte por chat. Te responde rápido y en palabras claras.
            </div>
            <div className="mt-4">
              <Btn kind="primary">
                <MessageCircle size={18} /> Escribirle a mi contador
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
