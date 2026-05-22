'use client'

import { useState, useTransition } from 'react'
import { Check, FileText, Loader2, Lock, MessageCircle, Sparkles, Stethoscope } from 'lucide-react'
import { startPlanCheckout } from '@/app/actions/plan-checkout'
import type { PlanTestId } from '@/lib/plan-test-catalog'
import { DISPLAY, MONO } from '../constants'
import { Badge, Btn, Card, Divider, HelpBox, Pill, VideoSlot } from '../ui'

interface PlanOption {
  id: PlanTestId
  label: string
  periodHint: string
  amountMxn: number
  perMonth: string
  badge?: string
  highlight?: boolean
}

const PLAN_OPTIONS: PlanOption[] = [
  {
    id: 'platinum-mensual',
    label: 'Mensual',
    periodHint: 'Cargo cada mes',
    amountMxn: 470.25,
    perMonth: '$470 / mes',
  },
  {
    id: 'platinum-semestral',
    label: 'Semestral',
    periodHint: 'Un cargo cada 6 meses',
    amountMxn: 1495,
    perMonth: '$249 / mes',
    badge: 'Ahorras 47%',
    highlight: true,
  },
  {
    id: 'platinum-anual',
    label: 'Anual',
    periodHint: 'Un solo cargo al año',
    amountMxn: 2706,
    perMonth: '$225 / mes',
    badge: 'Ahorras 52%',
  },
]

const INCLUYE = [
  { i: Sparkles, t: '6 declaraciones al mes con apoyo de IA', s: 'Llevas 2 usadas este mes' },
  { i: FileText, t: '300 facturas (CFDI) por semestre', s: 'Has emitido 24' },
  { i: MessageCircle, t: 'Chat ilimitado con tu contador', s: 'Te responden en menos de 2 horas' },
  { i: Lock, t: 'Monitoreo de listas negras del SAT', s: 'Vigilamos tu RFC todo el día' },
  { i: Stethoscope, t: 'Diagnóstico fiscal con IA', s: 'Te avisamos cuando puedes ahorrar' },
]

export function PlanScreen() {
  const [pending, startTransition] = useTransition()
  const [activePlan, setActivePlan] = useState<PlanTestId | null>(null)
  const [error, setError] = useState<string | null>(null)

  function pay(planId: PlanTestId) {
    setActivePlan(planId)
    setError(null)
    startTransition(async () => {
      try {
        const url = await startPlanCheckout(planId)
        window.location.href = url
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al iniciar el pago')
        setActivePlan(null)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí ves tu suscripción, qué tienes incluido y cómo cambiar de plan. Si quieres cancelar o pausar, también lo
        haces desde aquí.
      </HelpBox>

      <div
        className="rounded-3xl p-7 lg:p-8 text-white"
        style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
      >
        <Pill kind="coral">Tu plan actual</Pill>
        <div className="text-[44px] lg:text-[56px] font-extrabold tracking-tight leading-none mt-4" style={DISPLAY}>
          Platinum
        </div>
        <div className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Pago mensual · se renueva el 28 de abril 2026
        </div>
        <div
          className="mt-5 pt-5 flex items-center justify-between flex-wrap gap-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div>
            <div
              className="text-[11.5px] font-extrabold uppercase tracking-wider"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Próximo cargo
            </div>
            <div className="text-[32px] font-extrabold tracking-tight mt-1" style={DISPLAY}>
              $470<span className="text-[18px]" style={{ color: 'rgba(255,255,255,0.6)' }}>.25</span>
            </div>
            <div className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Pesos · IVA incluido
            </div>
          </div>
          <Btn size="md" style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}>
            Cambiar método de pago
          </Btn>
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Lo que incluye tu plan
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Todo esto ya está cubierto sin que pagues extra.
        </div>
        <Card>
          <div>
            {INCLUYE.map((it, i, arr) => (
              <div key={it.t}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}
                  >
                    <it.i size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[14.5px]">{it.t}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {it.s}
                    </div>
                  </div>
                  <Check size={18} color="var(--brand-500)" />
                </div>
                {i < arr.length - 1 && <Divider />}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bloque Stripe: planes de prueba */}
      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Cambia o renueva tu plan
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Pagos seguros con Stripe · Modo prueba activo (usa la tarjeta 4242 4242 4242 4242).
        </div>

        {error && (
          <div
            className="text-[13px] font-semibold mb-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLAN_OPTIONS.map((p) => {
            const isLoading = pending && activePlan === p.id
            return (
              <Card
                key={p.id}
                style={
                  p.highlight
                    ? { border: '2px solid var(--brand-500)', boxShadow: 'var(--sh-brand)' }
                    : undefined
                }
              >
                <div className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-700)' }}>
                      {p.label}
                    </div>
                    {p.badge && <Badge kind={p.highlight ? 'brand' : 'coral'}>{p.badge}</Badge>}
                  </div>
                  <div>
                    <div className="text-[32px] font-extrabold tracking-tight" style={{ ...DISPLAY, ...MONO, color: 'var(--ink-900)' }}>
                      ${p.amountMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      MXN · {p.periodHint}
                    </div>
                    <div className="text-[12.5px] font-bold mt-1" style={{ color: 'var(--brand-700)' }}>
                      Equivale a {p.perMonth}
                    </div>
                  </div>
                  <Btn
                    block
                    kind={p.highlight ? 'brand' : 'primary'}
                    size="md"
                    onClick={() => pay(p.id)}
                    disabled={pending}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Redirigiendo…
                      </>
                    ) : (
                      'Pagar con Stripe'
                    )}
                  </Btn>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <Btn block kind="ghost" style={{ color: '#B01F1F' }}>
        Cancelar mi suscripción
      </Btn>

      <VideoSlot title="¿Qué cubre cada plan?" duration="2 min" />
    </div>
  )
}
