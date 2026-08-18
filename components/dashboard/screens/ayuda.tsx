'use client'

import { MessageCircle, UserRound, X } from 'lucide-react'
import { useState, lazy, Suspense } from 'react'
import { DISPLAY } from '../constants'
import { Btn, Card, Divider, HelpBox, VideoSlot } from '../ui'

const RemotionPlayer = lazy(() => import('@/components/video/player').then(mod => ({ default: mod.RemotionPlayer })))

export function AyudaScreen() {
  const [showVideo, setShowVideo] = useState(false)
  const faqs = [
    { q: '¿Qué es el SAT?', a: 'Es la oficina del gobierno que se encarga de los impuestos en México. Todo el que trabaja debe declarar ahí.' },
    { q: '¿Qué es una declaración mensual?', a: 'Es el reporte que entregas cada mes al SAT con lo que ganaste y lo que pagas de impuestos.' },
    { q: '¿Qué es una factura (CFDI)?', a: 'Es un comprobante digital que demuestra que cobraste o pagaste por algo. El SAT las usa para saber tus ingresos y gastos.' },
    { q: '¿Para qué sirve mi Constancia de Situación Fiscal?', a: 'Es como tu identificación ante el SAT. Te la piden cuando te contratan o cuando facturas a una empresa.' },
    { q: '¿Y si no entiendo algo?', a: 'No te preocupes. Tu contador asignado responde tus dudas en menos de 2 horas desde la sección Mi cuenta.' },
  ]

  if (showVideo) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Bienvenida: ¿qué hacemos por ti?
            </h2>
            <p className="text-[13px] mt-1" style={{ color: 'var(--ink-500)' }}>
              Conoce las principales funciones de Contabilízate
            </p>
          </div>
          <button
            onClick={() => setShowVideo(false)}
            className="p-2 rounded-lg transition hover:bg-gray-100"
          >
            <X size={20} style={{ color: 'var(--ink-500)' }} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ aspectRatio: '9/16', maxWidth: '350px', margin: '0 auto', width: '100%', background: 'linear-gradient(135deg, #120A33 0%, #1A0F47 25%, #221158 50%, #332670 75%, #1A0F47 100%)' }}>
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-black">
                <div className="text-white text-center">
                  <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-[14px]">Cargando video...</p>
                </div>
              </div>
            }
          >
            <RemotionPlayer />
          </Suspense>
        </div>
      </div>
    )
  }

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
          <button
            onClick={() => setShowVideo(true)}
            className="rounded-2xl p-4 flex items-center gap-3 w-full text-left transition hover:translate-y-[-1px]"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
            >
              <span style={{ fontSize: '24px' }}>▶</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-[14px] leading-tight">Bienvenida: ¿qué hacemos por ti?</div>
              <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>
                Video · 3 min
              </div>
            </div>
            <span style={{ color: 'var(--ink-300)' }}>›</span>
          </button>
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
            style={{ background: 'var(--hero-amber-icon-bg)', color: 'var(--violet-ink)' }}
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
