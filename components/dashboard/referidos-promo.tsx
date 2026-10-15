'use client'

import { ArrowRight, Coins, Copy, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMyReferrals } from '@/features/referrals/actions/getMyReferrals.action'
import type { ReferralsSummary } from '@/features/referrals/types'
import { DISPLAY, MONO } from './constants'
import type { GoFn } from './types'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const DISMISS_KEY = 'referidos-promo-oculta-hasta'
const DISMISS_DAYS = 7
const SESSION_KEY = 'referidos-promo-animada'

/*
 * Entrada: una sola vez por sesión (el inicio se abre varias veces al día; animarlo cada vez
 * cansa). Solo transform + opacity con ease-out fuerte. El icono "flota" con un giro de 6 ms
 * de amplitud mínima, también solo al entrar, y nada se mueve en bucle. Hover gated a puntero
 * fino. Con reduced-motion queda solo el fade.
 */
const PROMO_CSS = `
@keyframes rp-entrar { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
@keyframes rp-moneda { 0% { transform: translateY(6px) rotate(-8deg) scale(0.92); opacity: 0; } 100% { transform: translateY(0) rotate(0) scale(1); opacity: 1; } }
@keyframes rp-brillo { from { transform: translateX(-120%) skewX(-18deg); } to { transform: translateX(220%) skewX(-18deg); } }
.rp-card[data-animar="1"] { animation: rp-entrar 280ms cubic-bezier(0.23, 1, 0.32, 1) both; }
.rp-card[data-animar="1"] .rp-moneda { animation: rp-moneda 420ms cubic-bezier(0.23, 1, 0.32, 1) 120ms both; }
.rp-card[data-animar="1"] .rp-brillo { animation: rp-brillo 900ms cubic-bezier(0.23, 1, 0.32, 1) 260ms both; }
.rp-card { transition: transform 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms ease; }
@media (hover: hover) and (pointer: fine) {
  .rp-card:hover { transform: translateY(-2px); box-shadow: 0 18px 40px -18px rgba(34,17,88,0.45); }
}
.rp-card:active { transform: scale(0.995); }
@media (prefers-reduced-motion: reduce) {
  .rp-card[data-animar="1"] { animation: rp-entrar 200ms ease both; transform: none; }
  .rp-card[data-animar="1"] .rp-moneda, .rp-card[data-animar="1"] .rp-brillo { animation: none; opacity: 1; transform: none; }
  .rp-card:hover { transform: none; }
}
`

/**
 * Nota del programa de referidos en el inicio del cliente. Lleva a Mi cuenta → Referidos. Si el
 * cliente ya tiene saldo, lo muestra en vez del gancho genérico. Se puede ocultar 7 días.
 */
export function ReferidosPromo({ go }: { go: GoFn }) {
  const [data, setData] = useState<ReferralsSummary | null>(null)
  const [oculta, setOculta] = useState(true)
  const [animar, setAnimar] = useState(false)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    try {
      const hasta = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
      if (hasta > Date.now()) return
      setOculta(false)
      if (!sessionStorage.getItem(SESSION_KEY)) {
        setAnimar(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }
    } catch {
      setOculta(false)
    }
    let cancelled = false
    void getMyReferrals()
      .then((res) => {
        if (!cancelled && res.success) setData(res.value)
      })
      .catch((e) => console.error('[ReferidosPromo] no se pudo cargar:', e))
    return () => {
      cancelled = true
    }
  }, [])

  if (oculta) return null

  const pct = data ? `${Number.isInteger(data.rewardPercent) ? data.rewardPercent : data.rewardPercent.toFixed(1)} %` : '5 %'
  const saldo = data?.creditBalance ?? 0
  const porReferido = data?.estimatedRewardAmount ?? null

  const ocultar = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DAYS * 86_400_000))
    } catch {
      /* sin storage: solo se oculta en esta vista */
    }
    setOculta(true)
  }

  const copiarCodigo = () => {
    if (!data?.code) return
    void navigator.clipboard.writeText(data.code).then(() => {
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 1600)
    })
  }

  return (
    <>
      <style>{PROMO_CSS}</style>
      <section
        className="rp-card relative overflow-hidden rounded-3xl p-5 lg:p-6"
        data-animar={animar ? '1' : '0'}
        style={{ background: 'linear-gradient(120deg, var(--ink-900) 0%, #2E1F7A 60%, #3A2A8C 100%)', color: '#fff', boxShadow: 'var(--sh-1)' }}
        aria-label="Programa de referidos"
      >
        {/* Brillo que cruza una sola vez al entrar */}
        <div
          aria-hidden
          className="rp-brillo pointer-events-none absolute inset-y-0 left-0 w-1/3"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)', opacity: animar ? 1 : 0 }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,211,161,0.40) 0%, rgba(0,211,161,0.06) 50%, transparent 70%)' }}
        />

        <button
          type="button"
          onClick={ocultar}
          aria-label="Ocultar por ahora"
          title="Ocultar por 7 días"
          className="cursor-pointer absolute right-3 top-3 w-8 h-8 rounded-full flex items-center justify-center transition-[background-color,transform] duration-150 ease-out active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.8)' }}
        >
          <X size={15} />
        </button>

        <div className="relative flex items-center gap-4 lg:gap-6 flex-wrap">
          <div
            className="rp-moneda w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' }}
          >
            <Coins size={26} />
          </div>

          <div className="flex-1 min-w-[220px]">
            {saldo > 0 ? (
              <>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>Tus créditos de referidos</div>
                <div className="mt-0.5 text-[22px] lg:text-[24px] font-extrabold tracking-tight leading-tight" style={{ ...DISPLAY, textWrap: 'balance' }}>
                  Tienes {MXN.format(saldo)} listos para tu siguiente compra
                </div>
                <div className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  Se descuentan solos en Mi plan. Sigue compartiendo tu código y gana {pct} de cada cliente nuevo.
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--brand-300)' }}>Nuevo · Programa de referidos</div>
                <div className="mt-0.5 text-[22px] lg:text-[24px] font-extrabold tracking-tight leading-tight" style={{ ...DISPLAY, textWrap: 'balance' }}>
                  Recomienda Contabilízate y gana {pct} en créditos por cada cliente
                </div>
                <div className="mt-1 text-[13px]" style={{ color: 'rgba(255,255,255,0.78)' }}>
                  {porReferido != null
                    ? `Unos ${MXN.format(porReferido)} por cada negocio que compre con tu código. Los usas en tu siguiente compra o renovación.`
                    : 'Un porcentaje de la primera compra de cada negocio que compre con tu código, para tu siguiente compra o renovación.'}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {data?.code && (
              <button
                type="button"
                onClick={copiarCodigo}
                title="Copiar tu código"
                className="cursor-pointer inline-flex items-center gap-2 h-11 px-4 rounded-full text-[13px] font-bold transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff' }}
              >
                <span style={{ ...MONO, letterSpacing: '0.12em' }}>{data.code}</span>
                {copiado ? <Check size={15} style={{ color: 'var(--brand-300)' }} /> : <Copy size={15} />}
              </button>
            )}
            <button
              type="button"
              onClick={() => go('referidos')}
              className="cursor-pointer inline-flex items-center gap-2 h-11 px-5 rounded-full text-[13.5px] font-bold transition-[transform,opacity] duration-150 ease-out active:scale-[0.97] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              style={{ background: '#fff', color: 'var(--ink-900)' }}
            >
              {saldo > 0 ? 'Ver mis referidos' : 'Empezar a referir'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  )
}
