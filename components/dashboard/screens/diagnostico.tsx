'use client'

import { AlertCircle, Calendar, CheckCircle2, Loader2, RefreshCw, Zap } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getIssuedInvoices, getMonthlyBills, getMonthlyIncome } from '@/features/dashboard/actions'
import { formatMoney, formatNumber } from '@/features/dashboard/tools/helpers'
import { getRegularizations } from '@/features/declarations/actions/getRegularizations.action'
import { useFiscalScore } from '@/features/declarations/hooks/useFiscalScore'
import { canRunDiagnosticoCliente } from '@/features/diagnostico/actions/canRunDiagnostico.action'
import { runDiagnosticoCliente } from '@/features/diagnostico/actions/runDiagnostico.action'
import type { CanRunDiagnostico } from '@/features/diagnostico/types'
import type { Regularizations } from '@/features/declarations/types'
import { useHasRfc, useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import { monthYear } from '../declaraciones/parts'
import { DISPLAY } from '../constants'
import { fiscalStatus } from '../fiscal-score.utils'
import type { GoFn } from '../types'
import { Badge, Btn, Card, Divider, HelpBox, Pill, SummaryStat, VideoSlot } from '../ui'
import { NeedsSatConnect } from './needs-sat-connect'

interface Props {
  go: GoFn
}

export function DiagnosticoScreen({ go }: Props) {
  const { hasRfc, loading: loadingRfc } = useHasRfc()
  const { selectedRfc, selectedRfcInfo } = useRfcStore()
  const { score, loading, step, refresh } = useFiscalScore()

  // ===== Diagnóstico bajo demanda (spec-tab-diagnostico-expediente §3.2) =====
  // El check se consulta SIEMPRE antes de pintar el botón; el POST revalida igual.
  const [canRun, setCanRun] = useState<CanRunDiagnostico | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [runNotice, setRunNotice] = useState<string | null>(null)

  const checkCanRun = useCallback(async () => {
    if (!selectedRfc) return
    const res = await canRunDiagnosticoCliente(selectedRfc)
    setCanRun(res.success ? res.value : null)
  }, [selectedRfc])

  useEffect(() => {
    void checkCanRun()
  }, [checkCanRun])

  // Mientras el diagnóstico corre (yaCorriendo detecta también la fase de re-lectura
  // de la CSF, que el isReconciling del score NO ve), sondear ambos cada 20s para
  // que la pantalla avance y cierre sola al terminar.
  useEffect(() => {
    if (!canRun?.yaCorriendo) return
    const id = setInterval(() => {
      void checkCanRun()
      void refresh()
    }, 20000)
    return () => clearInterval(id)
  }, [canRun?.yaCorriendo, checkCanRun, refresh])

  async function ejecutarDiagnostico() {
    if (!selectedRfc || running) return
    setRunning(true)
    setRunError(null)
    setRunNotice(null)
    const res = await runDiagnosticoCliente(selectedRfc)
    setRunning(false)
    if (!res.success) {
      setRunError(res.error.message)
      await checkCanRun() // el estado visible siempre refleja la verdad del servidor
      return
    }
    if (!res.value.triggered) {
      setRunNotice('Ya estás al corriente — no hay nada que diagnosticar.')
      await checkCanRun()
      return
    }
    // Disparado: el hero entra a "conectando/revisando" vía el hook y su polling.
    await refresh()
    await checkCanRun()
  }

  const [income, setIncome] = useState<number | null>(null)
  const [bills, setBills] = useState<number | null>(null)
  const [invoices, setInvoices] = useState<number | null>(null)
  const [regs, setRegs] = useState<Regularizations | null>(null)

  useEffect(() => {
    if (!selectedRfc) return
    let cancelled = false

    void (async () => {
      const [incomeRes, billsRes, invoicesRes, regsRes] = await Promise.all([
        getMonthlyIncome(selectedRfc),
        getMonthlyBills(selectedRfc),
        getIssuedInvoices(selectedRfc),
        getRegularizations(selectedRfc),
      ])
      if (cancelled) return
      setIncome(incomeRes.success ? incomeRes.value : null)
      setBills(billsRes.success ? billsRes.value : null)
      setInvoices(invoicesRes.success ? invoicesRes.value : null)
      setRegs(regsRes.success ? regsRes.value : null)
    })()

    return () => {
      cancelled = true
    }
  }, [selectedRfc])

  if (loadingRfc) return null
  if (!hasRfc) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />
  if (selectedRfcInfo?.ciecState !== 1) return <NeedsSatConnect go={go} feature="ver tu diagnóstico fiscal" />

  const status = score ? fiscalStatus(score.score) : null
  // Sin declaraciones el score llega en 100 "por vacuidad": el hero no debe
  // vestirse de "excelente" — usa el tono ámbar del estado informativo.
  const sinDeclaraciones = !!score && score.total === 0
  // Corrida en curso según el diagnóstico (cubre la fase TaxCertificate que el
  // score no reporta): manda sobre los estados "ready" del hero.
  const corriendo = canRun?.yaCorriendo === true
  const money = (v: number | null) => (loading ? '…' : v == null ? '—' : formatMoney(v))
  const num = (v: number | null) => (loading ? '…' : v == null ? '—' : formatNumber(v))
  const expensePct =
    income && income > 0 && bills != null ? `${Math.round((bills / income) * 100)}% de tus ingresos` : 'Gastos recientes'

  const months = regs?.months ?? []

  // Ventana del throttle en lenguaje humano y hora local (nunca el ISO/UTC crudo).
  const proximaVentanaLabel = (iso: string) => {
    const d = new Date(iso)
    const esOtroDia = d.toDateString() !== new Date().toDateString()
    if (esOtroDia) return 'Disponible mañana'
    return `Disponible a las ${d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })}`
  }

  /** Botón "ejecutar diagnóstico": activo solo si el servidor lo permite; apagado
   *  SIEMPRE con la razón visible. Con el diagnóstico corriendo no se pinta (el
   *  hero ya muestra el progreso). */
  const botonDiagnostico = (kind: 'brand' | 'ghost') => {
    if (!canRun || canRun.yaCorriendo) return null
    const razon = canRun.puedeEjecutar
      ? null
      : canRun.proximaVentanaUtc
        ? proximaVentanaLabel(canRun.proximaVentanaUtc)
        : !canRun.credencialValida
          ? 'Actualiza tu CIEC para poder ejecutarlo'
          : 'Estás al corriente — no hay nada que diagnosticar'
    return (
      <div className="mt-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Btn kind={kind} size="lg" onClick={() => void ejecutarDiagnostico()} disabled={!canRun.puedeEjecutar || running}>
            {running ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            {running ? 'Ejecutando…' : sinDeclaraciones ? 'Buscar mis obligaciones en el SAT' : 'Actualizar mi diagnóstico'}
          </Btn>
          {razon && (
            <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
              {razon}
            </span>
          )}
        </div>
        {runError && (
          <div className="mt-2 text-[12.5px] font-semibold" style={{ color: 'var(--violet-ink)' }}>
            {runError}
          </div>
        )}
        {runNotice && (
          <div className="mt-2 text-[12.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            {runNotice}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <HelpBox>
        <strong>¿Qué es un diagnóstico fiscal?</strong> Es un análisis de tu situación con el SAT. Te decimos qué está
        bien, qué hay que arreglar y dónde puedes ahorrar.
      </HelpBox>

      <div
        className="rounded-3xl p-7 lg:p-8"
        style={{
          background:
            step === 'ready' && status && !sinDeclaraciones && !corriendo
              ? status.positive
                ? 'var(--hero-brand-soft)'
                : 'var(--hero-coral-soft-bg)'
              : 'var(--hero-amber)',
          border: `1px solid ${
            step === 'ready' && status && !sinDeclaraciones && !corriendo
              ? status.positive
                ? 'var(--brand-200)'
                : 'var(--coral-soft)'
              : 'var(--hero-amber-border)'
          }`,
        }}
      >
        {step === 'loading' ? (
          <div className="flex items-center gap-2 text-[15px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Analizando tu situación fiscal…
          </div>
        ) : step === 'connecting' ? (
          <>
            <Pill kind="amber">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7339FD' }} /> Conectando
              con el SAT
            </Pill>
            <div
              className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Nos estamos conectando con el SAT
            </div>
            <div className="text-[13.5px] mt-2 max-w-[560px]" style={{ color: 'var(--ink-500)' }}>
              Estamos descargando tu constancia de situación fiscal. En cuanto la tengamos, calculamos qué
              declaraciones te corresponden.
            </div>
          </>
        ) : step === 'checking' ? (
          score!.total + score!.pendingVerificationCount === 0 ? (
            // Reconciliación en curso pero sin declaraciones aún: es la fase de
            // constancia/obligaciones (p. ej. tras un diagnóstico bajo demanda) —
            // "ya revisamos 0 de 0" no le dice nada a nadie.
            <>
              <Pill kind="amber">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7339FD' }} />{' '}
                Diagnóstico en curso
              </Pill>
              <div
                className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
                style={DISPLAY}
              >
                Estamos buscando tus obligaciones en el SAT
              </div>
              <div className="text-[13.5px] mt-2 max-w-[560px]" style={{ color: 'var(--ink-500)' }}>
                Releyendo tu constancia de situación fiscal y calculando qué declaraciones te corresponden. Esto
                puede tardar unos minutos — la pantalla se actualiza sola.
              </div>
            </>
          ) : (
          <>
            <Pill kind="amber">
              <Loader2 size={13} className="animate-spin" /> Comprobando con el SAT
            </Pill>
            <div
              className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Estamos comprobando tus declaraciones
            </div>
            <div className="text-[13.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Ya revisamos {score!.total} de {score!.total + score!.pendingVerificationCount} · Faltan{' '}
              {score!.pendingVerificationCount} por confirmar con el SAT.
            </div>
            {/* Barra de avance con los números reales del backend; se actualiza con el polling */}
            <div className="mt-4 max-w-[420px] h-2 rounded-full overflow-hidden" style={{ background: 'var(--ink-100)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((score!.total / Math.max(1, score!.total + score!.pendingVerificationCount)) * 100)}%`,
                  background: 'var(--brand-500)',
                  transition: 'width 600ms cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              />
            </div>
          </>
          )
        ) : corriendo ? (
          // Diagnóstico en curso en su fase de constancia (TaxCertificate): el score
          // aún no lo refleja, pero puede-ejecutar sí — sin este estado, la pantalla
          // parecería muerta justo después de disparar.
          <>
            <Pill kind="amber">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7339FD' }} /> Diagnóstico
              en curso
            </Pill>
            <div
              className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Estamos buscando tus obligaciones en el SAT
            </div>
            <div className="text-[13.5px] mt-2 max-w-[560px]" style={{ color: 'var(--ink-500)' }}>
              Releyendo tu constancia de situación fiscal y calculando qué declaraciones te corresponden. Esto puede
              tardar unos minutos — la pantalla se actualiza sola.
            </div>
          </>
        ) : score && score.total === 0 ? (
          // Sin declaraciones registradas: el backend regresa score 100 "por
          // vacuidad", pero decir "excelente" a quien no ha presentado nada
          // engaña — mismo estado honesto que el hero de Home.
          <>
            <Pill kind="amber">Sin declaraciones registradas</Pill>
            <div
              className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Aún no tienes declaraciones
            </div>
            <div className="text-[13.5px] mt-2 max-w-[560px]" style={{ color: 'var(--ink-500)' }}>
              Tu RFC ya está conectado con el SAT, pero todavía no hay declaraciones registradas. En cuanto
              presentemos la primera, aquí verás tu diagnóstico fiscal en tiempo real.
            </div>
            {botonDiagnostico('brand')}
          </>
        ) : status && score ? (
          <>
            <Pill kind={status.pill}>
              {status.positive ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />} {status.pillText}
            </Pill>
            <div
              className="text-[28px] lg:text-[34px] font-extrabold tracking-tight leading-tight mt-4 max-w-[680px]"
              style={DISPLAY}
            >
              Tu situación fiscal está <span style={{ color: status.accent }}>{status.word}</span>
            </div>
            <div className="text-[13.5px] mt-2" style={{ color: 'var(--ink-500)' }}>
              Score fiscal: <strong>{Math.round(score.score)}/100</strong> · {score.presented} de {score.total}{' '}
              declaraciones presentadas
            </div>
            {score.pending > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                <Btn kind="brand" size="lg" onClick={() => go('plan')}>
                  <Zap size={18} /> Empezar a regularizar
                </Btn>
              </div>
            )}
            {/* Refrescar el diagnóstico: acción secundaria — regularizar es la principal */}
            {botonDiagnostico(score.pending > 0 ? 'ghost' : 'brand')}
          </>
        ) : null}
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Tus números
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          Ingresos, gastos y facturación recientes.
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryStat label="Ingresos" value={money(income)} hint="Lo que has reportado" />
          <SummaryStat label="Gastos" value={money(bills)} hint={expensePct} />
          <SummaryStat label="Facturas emitidas" value={num(invoices)} hint="Facturas que has emitido" />
          <SummaryStat
            label="Pendientes"
            value={loading ? '…' : score ? String(score.pending) : '—'}
            hint="Declaraciones por presentar"
            tone={score && score.pending > 0 ? 'warn' : undefined}
          />
        </div>
      </div>

      <div>
        <div className="text-[18px] font-bold mb-1" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Lo que debes al SAT
        </div>
        <div className="text-[13.5px] mb-4" style={{ color: 'var(--ink-500)' }}>
          {loading
            ? 'Revisando tus declaraciones…'
            : months.length === 0
              ? 'No tienes meses pendientes por regularizar.'
              : `${months.length} ${months.length === 1 ? 'mes pendiente' : 'meses pendientes'} por regularizar. Te ayudamos mes por mes.`}
        </div>
        {months.length > 0 && (
          <Card>
            <div>
              {months.map((m, i) => (
                <div key={m.declarationId}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}
                    >
                      <Calendar size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-[14.5px]">{monthYear(m.fiscalYear, m.month)}</div>
                      <div className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--ink-500)' }}>
                        {m.statusLabel}
                      </div>
                    </div>
                    <Badge kind="amber">Pendiente</Badge>
                  </div>
                  {i < months.length - 1 && <Divider />}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <VideoSlot title="¿Cómo se calcula mi diagnóstico fiscal?" duration="3 min" />
    </div>
  )
}
