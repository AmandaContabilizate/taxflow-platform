'use client'

import { Check, Clock, Coins, Copy, Gift, Loader2, Lock, Minus, Plus, Share2, Sparkles, Users } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getMyReferrals } from '@/features/referrals/actions/getMyReferrals.action'
import type { ReferralItem, ReferralRewardState, ReferralsSummary } from '@/features/referrals/types'
import { DISPLAY, MONO } from '../constants'
import { REFERIDOS_VISTO_KEY } from '../FloatingReferidosButton'
import type { GoFn } from '../types'
import { Btn, Card, ErrorState, Pill } from '../ui'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const MXN2 = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fecha = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const porcentaje = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} %`

const REWARD_LABEL: Record<ReferralRewardState, { label: string; kind: 'brand' | 'default' | 'amber' | 'coral' }> = {
  available: { label: 'Créditos disponibles', kind: 'brand' },
  used: { label: 'Créditos canjeados', kind: 'default' },
  expired: { label: 'Créditos vencidos', kind: 'amber' },
  cancelled: { label: 'Créditos anulados', kind: 'coral' },
}

/** Opciones rápidas del simulador "si refieres N clientes". */
const SIM_OPCIONES = [1, 3, 5, 10]

/**
 * Entrada escalonada (solo al montar; la pantalla se ve pocas veces al día, así que vale la pena).
 * Solo transform + opacity, ease-out fuerte, 50 ms entre bloques; con reduced-motion solo opacidad.
 */
const ENTRADA_CSS = `
@keyframes ref-entrar { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ref-brillo { from { transform: translate(-30%, -30%) scale(0.9); opacity: 0; } to { transform: translate(0, 0) scale(1); opacity: 1; } }
.ref-in { opacity: 0; animation: ref-entrar 360ms cubic-bezier(0.23, 1, 0.32, 1) forwards; animation-delay: var(--d, 0ms); }
.ref-glow { animation: ref-brillo 900ms cubic-bezier(0.23, 1, 0.32, 1) forwards; }
@media (prefers-reduced-motion: reduce) {
  .ref-in { animation: ref-entrar 200ms ease forwards; transform: none; }
  .ref-glow { animation: none; opacity: 1; }
}
`

/**
 * Programa de referidos del cliente: su saldo en créditos, cuánto puede ganar (simulador), su código y
 * liga para compartir, y la lista de cuentas referidas. Un referido se "activa" cuando la cuenta nueva
 * paga su primer plan; ahí el referidor gana el % configurado de esa compra en créditos, que se
 * descuentan solos en su siguiente compra o renovación (Mi plan).
 */
export function ReferidosScreen({ go }: { go: GoFn }) {
  const [data, setData] = useState<ReferralsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [copiado, setCopiado] = useState<'codigo' | 'liga' | null>(null)
  const [simN, setSimN] = useState(3)

  useEffect(() => {
    setOrigin(window.location.origin)
    // Ya conoció la pantalla: el botón flotante deja de marcar "NUEVO".
    try {
      localStorage.setItem(REFERIDOS_VISTO_KEY, '1')
    } catch {
      /* sin storage */
    }
    let cancelled = false
    void (async () => {
      try {
        const res = await getMyReferrals()
        if (cancelled) return
        if (res.success) setData(res.value)
        else setError(res.error.message)
      } catch (e) {
        // Si la server action falla al invocarse (dev server desactualizado, red), que no se quede cargando.
        if (cancelled) return
        console.error('[Referidos] no se pudo cargar:', e)
        setError('No pudimos cargar tus referidos. Recarga la página e intenta de nuevo.')
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const liga = data?.code ? `${origin}/auth/login?ref=${encodeURIComponent(data.code)}` : ''

  const copiar = (que: 'codigo' | 'liga') => {
    const texto = que === 'codigo' ? data?.code ?? '' : liga
    if (!texto) return
    void navigator.clipboard.writeText(texto).then(() => {
      setCopiado(que)
      window.setTimeout(() => setCopiado((v) => (v === que ? null : v)), 1600)
    })
  }

  const compartirWhatsApp = () => {
    if (!data || !liga) return
    const msg =
      `Te recomiendo Contabilízate para tus declaraciones del SAT. ` +
      `Regístrate con mi código ${data.code} aquí: ${liga}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
  }

  if (loading) {
    return (
      <Card>
        <div className="px-5 py-14 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={18} className="animate-spin" /> Cargando tu programa de referidos…
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <ErrorState message={error ?? 'No pudimos cargar tus referidos.'} />
      </Card>
    )
  }

  const porReferido = data.estimatedRewardAmount
  const simTotal = porReferido != null ? porReferido * simN : null
  const pct = porcentaje(data.rewardPercent)

  return (
    <div className="flex flex-col gap-5 max-w-[1100px]">
      <style>{ENTRADA_CSS}</style>

      {/* Hero: saldo + cuánto puedes ganar */}
      <section
        className="ref-in relative overflow-hidden rounded-3xl"
        style={{ ['--d' as string]: '0ms', background: 'linear-gradient(135deg, var(--ink-900) 0%, #2E1F7A 55%, #3A2A8C 100%)', color: '#fff', boxShadow: 'var(--sh-1)' }}
      >
        <div
          aria-hidden
          className="ref-glow pointer-events-none absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,211,161,0.45) 0%, rgba(0,211,161,0.08) 45%, transparent 70%)' }}
        />
        <div className="relative px-6 py-6 md:px-8 md:py-8 grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-6 lg:gap-8">
          {/* Izquierda: saldo + simulador */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Tu saldo en créditos
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-[44px] md:text-[52px] leading-none font-extrabold tracking-tight tabular-nums" style={DISPLAY}>
                    <ContadorAnimado valor={data.creditBalance} formato={(v) => MXN.format(v)} />
                  </span>
                  <span className="text-[16px] font-bold" style={{ color: 'rgba(255,255,255,0.7)' }}>MXN</span>
                </div>
                <div className="mt-2 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                  Canjeados: {MXN.format(data.creditsRedeemed)}
                  {data.creditsExpired > 0 && ` · Vencidos: ${MXN.format(data.creditsExpired)}`}
                  {data.nextExpiryAt && ` · Vencen: ${fecha(data.nextExpiryAt)}`}
                </div>
                {(data.creditsReserved ?? 0) > 0 && (
                  <div className="mt-1 text-[12px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    Apartados en compras pendientes: {MXN.format(data.creditsReserved ?? 0)} (ya descontados de tu saldo; vuelven si la compra se cancela o vence)
                  </div>
                )}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <Users size={13} /> Referidor
                </span>
                <div className="text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  <strong className="text-[18px] font-extrabold" style={DISPLAY}>{data.activated}</strong>{' '}
                  {data.activated === 1 ? 'referido activado' : 'referidos activados'}
                </div>
              </div>
            </div>

            <h2 className="mt-5 text-[22px] md:text-[26px] leading-tight font-extrabold tracking-tight" style={{ ...DISPLAY, textWrap: 'balance' }}>
              <Sparkles size={18} className="inline -mt-1 mr-1" style={{ color: 'var(--brand-300)' }} />
              Gana {pct} de la primera compra de cada cliente que traigas
            </h2>

            {/* Simulador */}
            <div
              className="mt-4 rounded-2xl p-4 md:p-5"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(6px)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[12.5px] font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>Si refieres</div>
                <div className="flex items-center gap-1.5">
                  {SIM_OPCIONES.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSimN(n)}
                      aria-pressed={simN === n}
                      className="cursor-pointer h-9 min-w-9 px-3 rounded-full text-[12.5px] font-bold transition-[background-color,color,transform] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                      style={{
                        background: simN === n ? '#fff' : 'rgba(255,255,255,0.12)',
                        color: simN === n ? 'var(--ink-900)' : '#fff',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <div className="ml-1 flex items-center rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <button type="button" aria-label="Menos" onClick={() => setSimN((v) => Math.max(1, v - 1))} className="cursor-pointer h-9 w-9 flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                      <Minus size={14} />
                    </button>
                    <button type="button" aria-label="Más" onClick={() => setSimN((v) => Math.min(50, v + 1))} className="cursor-pointer h-9 w-9 flex items-center justify-center transition-transform duration-150 ease-out active:scale-[0.92] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {simN === 1 ? '1 cliente que compre' : `${simN} clientes que compren`}
                  </div>
                  <div className="text-[34px] md:text-[40px] leading-none font-extrabold tracking-tight tabular-nums" style={{ ...DISPLAY, color: 'var(--brand-300)' }}>
                    {simTotal != null ? <ContadorAnimado valor={simTotal} formato={(v) => MXN.format(v)} /> : `${simN} × ${pct}`}
                  </div>
                  <div className="mt-1 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {porReferido != null && data.planNameReference
                      ? `en créditos: ${MXN.format(porReferido)} por cada uno si compra el plan ${data.planNameReference}.`
                      : 'en créditos sobre lo que pague cada uno.'}
                  </div>
                </div>
                <div className="text-right text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <div className="text-[22px] font-extrabold leading-none" style={{ ...DISPLAY, color: '#fff' }}>{pct}</div>
                  de cada primera compra
                </div>
              </div>
            </div>
          </div>

          {/* Derecha: código + liga (la acción principal) */}
          <div className="min-w-0 flex flex-col gap-3 lg:pl-2">
            {/* Tarjeta siempre blanca (vive sobre el hero morado): colores fijos, no tokens de tema,
                para que en modo oscuro no quede texto blanco sobre blanco. */}
            <div className="rounded-2xl p-4 md:p-5" style={{ background: '#fff', color: '#221158', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}>
              <div className="text-[12px] font-bold" style={{ color: '#5D50A5' }}>Tu código de referido</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="text-[28px] font-extrabold tracking-[0.16em] tabular-nums" style={MONO}>{data.code || '—'}</div>
                <BotonCopiar claro activo={copiado === 'codigo'} onClick={() => copiar('codigo')} titulo="Copiar código" />
              </div>
              <div className="mt-3 text-[12px] font-bold" style={{ color: '#5D50A5' }}>Liga personalizada</div>
              <div className="mt-1.5 flex items-center gap-2">
                <div
                  className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-[12.5px] truncate"
                  style={{ ...MONO, background: '#F7F6FB', border: '1px solid #E6E3F2', color: '#4A4470' }}
                  title={liga}
                >
                  {liga || '—'}
                </div>
                <BotonCopiar claro activo={copiado === 'liga'} onClick={() => copiar('liga')} titulo="Copiar liga" />
              </div>
              <button
                type="button"
                onClick={compartirWhatsApp}
                className="cursor-pointer mt-3 w-full h-11 rounded-xl inline-flex items-center justify-center gap-2 text-[13.5px] font-bold text-white transition-[transform,opacity] duration-150 ease-out active:scale-[0.98] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', boxShadow: 'var(--sh-brand)' }}
              >
                <Share2 size={16} /> Compartir por WhatsApp
              </button>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-1.5 text-[12.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <li className="flex items-center gap-2"><Coins size={14} style={{ color: 'var(--brand-300)' }} /> {pct} de la primera compra de cada referido, en créditos MXN</li>
              <li className="flex items-center gap-2"><Clock size={14} style={{ color: 'var(--brand-300)' }} /> Vigencia de {data.rewardMonths} meses</li>
              <li className="flex items-center gap-2"><Lock size={14} style={{ color: 'var(--brand-300)' }} /> No transferibles: se descuentan solos en tu siguiente compra</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Totales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat d={60} label="Registrados" value={String(data.registered)} hint="Aún no compran" />
        <Stat d={110} label="Activados" value={String(data.activated)} hint="Ya compraron un plan" tone="ok" />
        <Stat d={160} label="Créditos ganados" value={MXN.format(data.creditsEarned)} hint="Desde que empezaste" tone={data.creditsEarned > 0 ? 'ok' : undefined} />
        <Stat d={210} label="Créditos canjeados" value={MXN.format(data.creditsRedeemed)} hint={data.creditsExpired > 0 ? `${MXN.format(data.creditsExpired)} vencidos` : 'Descontados en compras'} />
      </div>

      {/* Cómo funciona */}
      <div className="ref-in" style={{ ['--d' as string]: '260ms' }}>
        <Card>
          <div className="p-5 md:p-6">
            <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Cómo funciona</div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <Paso n="01" titulo="Comparte tu código">
                Envía tu código o tu liga a otros negocios por WhatsApp, correo o redes.
              </Paso>
              <Paso n="02" titulo="Se registran y compran">
                Cuando alguien se registra con tu código y paga su primer plan, el referido se activa solo.
              </Paso>
              <Paso n="03" titulo="Ganas créditos">
                Recibes el {pct} de esa compra en créditos. Se descuentan automáticamente en tu siguiente compra o renovación en{' '}
                <button type="button" onClick={() => go('plan')} className="cursor-pointer font-bold underline underline-offset-2" style={{ color: 'var(--brand-700)' }}>
                  Mi plan
                </button>
                .
              </Paso>
            </div>
          </div>
        </Card>
      </div>

      {/* Cuentas referidas */}
      <div className="ref-in" style={{ ['--d' as string]: '310ms' }}>
        <Card>
          <div className="px-5 md:px-6 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
            <div>
              <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Cuentas referidas</div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Solo se muestra el nombre comercial y el correo enmascarado de cada cuenta</div>
            </div>
            <Pill kind="brand">{data.items.length} {data.items.length === 1 ? 'referido' : 'referidos'}</Pill>
          </div>

          {data.items.length === 0 ? (
            <div className="px-6 py-12 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
                <Gift size={28} />
              </div>
              <div className="text-[18px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>Comparte Contabilízate y gana créditos</div>
              <p className="max-w-[460px] text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
                Invita a otros negocios con tu código. Cuando compren su primer plan, tú recibes el {pct} en créditos.
              </p>
              <Btn kind="brand" size="sm" onClick={() => copiar('codigo')}>
                {copiado === 'codigo' ? <Check size={15} /> : <Copy size={15} />} Copiar código de referido
              </Btn>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cuenta', 'Registro', 'Estatus', 'Tus créditos'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <FilaReferido key={r.id} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

/**
 * Cuenta hasta el valor con ease-out en ~700 ms; al cambiar el valor parte del número actual, así que
 * el simulador se siente continuo. Con reduced-motion muestra el valor final de inmediato.
 */
function ContadorAnimado({ valor, formato }: { valor: number; formato: (v: number) => string }) {
  const [mostrado, setMostrado] = useState(valor)
  const desde = useRef(valor)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      desde.current = valor
      setMostrado(valor)
      return
    }
    const inicio = desde.current
    const delta = valor - inicio
    const t0 = performance.now()
    const dur = 700
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      const e = 1 - Math.pow(1 - p, 3) // ease-out cúbico
      const v = inicio + delta * e
      setMostrado(v)
      if (p < 1) raf.current = requestAnimationFrame(paso)
      else desde.current = valor
    }
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(paso)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
      desde.current = mostrado
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor])

  return <span>{formato(Math.round(mostrado))}</span>
}

function FilaReferido({ r }: { r: ReferralItem }) {
  const reward = r.rewardState ? REWARD_LABEL[r.rewardState] : null
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="px-5 py-4">
        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{r.displayName}</div>
        <div className="text-[12px]" style={{ ...MONO, color: 'var(--ink-500)' }}>{r.maskedEmail}</div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fecha(r.registeredAt)}</td>
      <td className="px-5 py-4 whitespace-nowrap">
        <Pill kind={r.statusId === 2 ? 'brand' : r.statusId === 3 ? 'coral' : 'default'}>{r.statusLabel}</Pill>
        {r.activatedAt && (
          <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>Activado el {fecha(r.activatedAt)}</div>
        )}
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        {reward && r.rewardAmount != null ? (
          <div className="flex flex-col gap-1 items-start">
            <div className="text-[15px] font-extrabold tabular-nums" style={{ ...DISPLAY, color: r.rewardState === 'available' ? 'var(--brand-700)' : 'var(--ink-700)' }}>
              +{MXN2.format(r.rewardAmount)}
            </div>
            <Pill kind={reward.kind}>{reward.label}</Pill>
            {r.rewardExpiresAt && r.rewardState === 'available' && (
              <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>Vencen el {fecha(r.rewardExpiresAt)}</div>
            )}
          </div>
        ) : (
          <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Se abonan cuando compre</span>
        )}
      </td>
    </tr>
  )
}

function Stat({ d, label, value, hint, tone }: { d: number; label: string; value: string; hint: string; tone?: 'ok' }) {
  const ok = tone === 'ok'
  return (
    <div
      className="ref-in rounded-3xl p-4"
      style={{
        ['--d' as string]: `${d}ms`,
        background: ok ? 'var(--brand-50)' : 'var(--card)',
        border: `1px solid ${ok ? 'var(--brand-200)' : 'var(--border)'}`,
      }}
    >
      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: ok ? 'var(--brand-700)' : 'var(--ink-500)' }}>{label}</div>
      <div className="text-[24px] font-extrabold tracking-tight mt-1 tabular-nums truncate" style={{ ...DISPLAY, color: ok ? 'var(--brand-700)' : 'var(--ink-900)' }}>{value}</div>
      <div className="text-[12px]" style={{ color: ok ? 'var(--brand-700)' : 'var(--ink-500)' }}>{hint}</div>
    </div>
  )
}

function Paso({ n, titulo, children }: { n: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-4 overflow-hidden" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
      <div className="absolute right-4 top-2 text-[34px] font-extrabold select-none" style={{ ...DISPLAY, color: 'var(--ink-300)', opacity: 0.45 }}>{n}</div>
      <div className="font-extrabold text-[14px] pr-12" style={{ color: 'var(--ink-900)' }}>{titulo}</div>
      <div className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--ink-600)' }}>{children}</div>
    </div>
  )
}

/** `claro`: colores fijos de tema claro, para usarlo dentro de la tarjeta blanca del hero. */
function BotonCopiar({ activo, onClick, titulo, claro }: { activo: boolean; onClick: () => void; titulo: string; claro?: boolean }) {
  const estilo = claro
    ? { background: activo ? '#E6FCF6' : '#fff', border: `1px solid ${activo ? '#93F1D6' : 'rgba(34,17,88,0.12)'}`, color: activo ? '#00876B' : '#4A4470' }
    : { background: activo ? 'var(--brand-50)' : 'var(--card)', border: `1px solid ${activo ? 'var(--brand-200)' : 'var(--border-strong)'}`, color: activo ? 'var(--brand-700)' : 'var(--ink-700)' }
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      className="cursor-pointer w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-[transform,background-color,border-color] duration-150 ease-out active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
      style={estilo}
    >
      {activo ? <Check size={16} /> : <Copy size={16} />}
    </button>
  )
}
