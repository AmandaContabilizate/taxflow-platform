'use client'

import { Check, FileText, Loader2, Lock, MessageCircle, Sparkles, Stethoscope } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { cancelSubscription } from '@/features/account/actions/cancelSubscription.action'
import { getCurrentSubscription } from '@/features/account/actions/getCurrentSubscription.action'
import { getPlans } from '@/features/account/actions/getPlans.action'
import { EMPTY_PLANS_CATALOG, formatMXN, periodLabel, type CurrentSubscription, type PlansCatalog } from '@/features/account/types'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { PlanPickerModal } from '../plan/plan-picker-modal'
import { DISPLAY } from '../constants'
import { Badge, Btn, Card, Divider, HelpBox, Pill, VideoSlot } from '../ui'

const INCLUYE = [
  { i: Sparkles, t: '6 declaraciones al mes con apoyo de IA', s: 'Llevas 2 usadas este mes' },
  { i: FileText, t: '300 facturas (CFDI) por semestre', s: 'Has emitido 24' },
  { i: MessageCircle, t: 'Chat ilimitado con tu contador', s: 'Te responden en menos de 2 horas' },
  { i: Lock, t: 'Monitoreo de listas negras del SAT', s: 'Vigilamos tu RFC todo el día' },
  { i: Stethoscope, t: 'Diagnóstico fiscal con IA', s: 'Te avisamos cuando puedes ahorrar' },
]

function formatRenewDate(value?: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function PlanScreen() {
  const { selectedRfc } = useRfcStore()

  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null)
  const [loadingSub, setLoadingSub] = useState(true)
  const [catalog, setCatalog] = useState<PlansCatalog>(EMPTY_PLANS_CATALOG)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSubscription = useCallback(async () => {
    if (!selectedRfc) return
    setLoadingSub(true)
    const res = await getCurrentSubscription(selectedRfc)
    setLoadingSub(false)
    if (res.success) {
      setSubscription(res.value)
    } else {
      setSubscription({ hasSubscription: false })
    }
  }, [selectedRfc])

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false
    void loadSubscription()
    void (async () => {
      const res = await getPlans(selectedRfc)
      if (!cancelled && res.success) setCatalog(res.value)
    })()
    return () => {
      cancelled = true
    }
  }, [selectedRfc, loadSubscription])

  const handleCancel = useCallback(async () => {
    if (!subscription?.subscriptionId) return
    if (!window.confirm('¿Cancelar tu suscripción? Conservarás el acceso hasta el final del periodo.')) {
      return
    }
    setCanceling(true)
    setError(null)
    const res = await cancelSubscription(subscription.subscriptionId)
    setCanceling(false)
    if (res.success) {
      void loadSubscription()
    } else {
      setError(res.error.message)
    }
  }, [subscription, loadSubscription])

  const hasSub = subscription?.hasSubscription === true
  const renewDate = formatRenewDate(subscription?.renewDate)
  const planCount = catalog.futurePlans.length
  const hasPlans = planCount > 0

  return (
    <div className="flex flex-col gap-6 max-w-[1040px]">
      <HelpBox>
        Aquí ves tu suscripción, qué tienes incluido y cómo cambiar de plan. Si quieres cancelar o pausar, también lo
        haces desde aquí.
      </HelpBox>

      {/* Hero: plan actual */}
      <div
        className="rounded-3xl p-7 lg:p-8 text-white"
        style={{ background: 'linear-gradient(155deg,#1E1952 0%,#15113F 100%)', boxShadow: 'var(--sh-ink)' }}
      >
        <Pill kind="coral">{hasSub ? 'Tu plan actual' : 'Sin plan activo'}</Pill>

        {loadingSub ? (
          <div className="flex items-center gap-2 mt-5 text-[15px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando tu suscripción…
          </div>
        ) : hasSub ? (
          <>
            <div className="text-[44px] lg:text-[56px] font-extrabold tracking-tight leading-none mt-4" style={DISPLAY}>
              {subscription?.planName ?? 'Tu plan'}
            </div>
            <div className="text-[14px] mt-2" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {periodLabel(subscription?.billingPeriod)}
              {renewDate ? ` · se renueva el ${renewDate}` : ''}
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
                  {subscription?.nextChargeAmount != null
                    ? formatMXN(subscription.nextChargeAmount)
                    : '—'}
                </div>
                <div className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {subscription?.currency ?? 'MXN'} · IVA incluido
                </div>
              </div>
              <Btn
                size="md"
                onClick={() => setPickerOpen(true)}
                style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}
              >
                Cambiar plan
              </Btn>
            </div>
          </>
        ) : (
          <>
            <div className="text-[28px] lg:text-[36px] font-extrabold tracking-tight leading-tight mt-4" style={DISPLAY}>
              Aún no tienes un plan
            </div>
            <div className="text-[14px] mt-2 mb-5" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Elige un plan para desbloquear declaraciones, facturación y asesoría.
            </div>
            <Btn
              size="md"
              onClick={() => setPickerOpen(true)}
              style={{ background: '#fff', color: 'var(--ink-900)', boxShadow: 'none' }}
            >
              Ver planes
            </Btn>
          </>
        )}
      </div>

      {/* Lo que incluye */}
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

      {/* Cambiar / renovar */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="text-[18px] font-bold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
            Cambia o renueva tu plan
          </div>
          {hasPlans && <Badge kind="brand">{planCount} planes</Badge>}
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Pagos seguros con Stripe. Elige plan, agrega trámites y paga sin salir de aquí.
        </div>

        {error && (
          <div
            className="text-[13px] font-semibold mb-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}
          >
            {error}
          </div>
        )}

        <Btn kind="brand" size="md" onClick={() => setPickerOpen(true)} disabled={!selectedRfc || !hasPlans}>
          {!hasPlans ? 'Cargando planes…' : 'Ver planes y pagar'}
        </Btn>
      </div>

      {hasSub && (
        <Btn block kind="ghost" style={{ color: '#B01F1F' }} disabled={canceling} onClick={handleCancel}>
          {canceling ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Cancelando…
            </>
          ) : (
            'Cancelar mi suscripción'
          )}
        </Btn>
      )}

      <VideoSlot title="¿Qué cubre cada plan?" duration="2 min" />

      {selectedRfc && (
        <PlanPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          rfc={selectedRfc}
          catalog={catalog}
          onPaid={loadSubscription}
        />
      )}
    </div>
  )
}
