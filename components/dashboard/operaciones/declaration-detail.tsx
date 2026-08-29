'use client'

import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  Construction,
  Copy,
  DollarSign,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MessageSquarePlus,
  RotateCcw,
  Send,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { DeclarationComments } from '@/components/dashboard/declaraciones/declaration-comments'
import { DECLARATION_STATUS } from '@/features/declaration-report/types'
import { useRecalculation } from '@/features/declarations/hooks/useRecalculation'
import { getDeclarationGeneral } from '@/features/operations/actions/getDeclarationGeneral.action'
import { getDeclarationLogs } from '@/features/operations/actions/getDeclarationLogs.action'
import { resendDeclarationToClient } from '@/features/operations/actions/resendDeclarationToClient.action'
import type { DeclarationGeneral, DeclarationLog, DeclarationSubject } from '@/features/operations/types'
import { getSatPassword } from '@/features/taxpayers/actions/getSatPassword.action'
import { num, toNumber } from './calc-read'
import { CalculosTab } from './calculos-tab'
import { ComprobantesTab } from './comprobantes-tab'
import { RecalculoTab } from './recalculo-tab'
import { ResumenDeclaracion } from './resumen-declaracion'
import { declarationStatusBadge, fmtDate } from '../declaraciones/parts'
import { DISPLAY, MONO } from '../constants'
import { useHasPermission } from '../permissions'
import { Modal } from '../modal'
import { Badge, Card } from '../ui'

/** Estatus que habilitan "Enviar Predeclaración" (10|15 → 9; 9 reintenta el correo). */
const RESENDABLE_STATUSES = new Set<number>([
  DECLARATION_STATUS.CLIENT_REVIEW,
  DECLARATION_STATUS.CLIENT_REJECTED,
  15, // InProcess
])

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

/** `null` = no determinable — nunca se inventa una cifra. */
const moneyOrDash = (n: number | null | undefined) => (n == null ? '—' : money(n))


/* -------------------------------------------------------------------------- */
/*  CIEC del contribuyente                                                     */
/* -------------------------------------------------------------------------- */

/**
 * CIEC bajo demanda para el contador que está trabajando la declaración.
 *
 * Reglas de seguridad de este bloque (no las relajes):
 * - La petición sale SOLO al pulsar "Ver"; montar la pantalla no pide nada.
 * - La contraseña vive en el estado local de este componente: no se loguea, no
 *   se sube por props ni se guarda en storage.
 * - "Ocultar" la borra del estado; el siguiente "Ver" vuelve a pedirla.
 * - Sin el claim `Contador.GetSatPassword` el control no se pinta.
 */
function CiecInline({ rfc }: { rfc: string }) {
  const puedeVerCiec = useHasPermission('Contador.GetSatPassword')
  const [ciec, setCiec] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setCiec(null)
    setAviso(null)
    setCopiado(false)
  }, [rfc])

  if (!puedeVerCiec || !rfc) return null

  const ocultar = () => {
    setCiec(null)
    setAviso(null)
    setCopiado(false)
  }

  const ver = async () => {
    setLoading(true)
    setAviso(null)
    const res = await getSatPassword(rfc)
    setLoading(false)
    if (res.success && res.value.satPassword) {
      setCiec(res.value.satPassword)
      return
    }
    setCiec(null)
    setAviso(res.success || res.error.statusCode === 404 ? 'Sin CIEC registrada' : 'No disponible')
  }

  const copiar = async () => {
    if (!ciec) return
    try {
      await navigator.clipboard.writeText(ciec)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1600)
    } catch {
      setAviso('No se pudo copiar')
    }
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <span
        className="text-[10.5px] font-extrabold uppercase tracking-wide"
        style={{ color: 'var(--ink-500)' }}
      >
        CIEC
      </span>
      <code style={{ ...MONO, fontSize: '13px', color: 'var(--ink-900)' }}>
        {ciec ?? '••••••••'}
      </code>
      {aviso && (
        <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
          {aviso}
        </span>
      )}
      <button
        type="button"
        onClick={() => (ciec ? ocultar() : void ver())}
        disabled={loading}
        title={ciec ? 'Ocultar la CIEC' : 'Consultar y mostrar la CIEC'}
        className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80 disabled:opacity-60"
        style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : ciec ? (
          <EyeOff size={12} />
        ) : (
          <Eye size={12} />
        )}
        {ciec ? 'Ocultar' : 'Ver'}
      </button>
      {ciec && (
        <button
          type="button"
          onClick={() => void copiar()}
          title="Copiar la CIEC al portapapeles"
          className="inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-1 rounded-lg transition hover:opacity-80"
          style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          {copiado ? <Check size={12} /> : <Copy size={12} />}
          {copiado ? 'Copiada' : 'Copiar'}
        </button>
      )}
    </div>
  )
}

/**
 * Códigos SAT con pantallas de cálculo propias. Los demás regímenes muestran el
 * gate de "estamos trabajando en esto" en Cálculos/Clasificación/Reporte Cliente:
 * sus JSON tienen otra forma y pintarían cifras equivocadas.
 */
const REGIMES_CON_PANTALLAS = new Set(['625', '626'])

const TAB_ITEMS = [
  'Comprobantes',
  'Cálculos',
  'Recálculo',
  'Clasificación',
  'Reporte Cliente',
  'Comentarios',
] as const
const RECALCULO_TAB_INDEX = 2
const COMMENTS_TAB_INDEX = TAB_ITEMS.length - 1

interface CurrentUser {
  userId: string
  fullName: string
}

interface Props {
  declaration: DeclarationSubject
  onBack: () => void
  currentUser: CurrentUser
}

/**
 * Detalle de la declaración para el contador. El contribuyente tiene su propia
 * pantalla (`ClientDeclarationDetail`): aquí viven el recálculo y la
 * clasificación, que el cliente no debe ver.
 */
export function DeclarationDetail({ declaration: d, onBack, currentUser }: Props) {
  const [tab, setTab] = useState(0)
  const [general, setGeneral] = useState<DeclarationGeneral | null>(null)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [logs, setLogs] = useState<DeclarationLog[]>([])

  const loadGeneral = useCallback(async () => {
    const res = await getDeclarationGeneral(d.declarationId)
    if (res.success) {
      setGeneral(res.value)
      setGeneralError(null)
      return res.value
    }
    setGeneralError(res.error.message)
    return null
  }, [d.declarationId])

  useEffect(() => {
    let cancelled = false
    setGeneral(null)
    setGeneralError(null)
    setLogs([])
    void (async () => {
      const value = await loadGeneral()
      if (cancelled || !value) return
      // La bitácora solo se necesita para el banner de rechazo (estatus 10).
      if (value.statusId === DECLARATION_STATUS.CLIENT_REJECTED) {
        const logsRes = await getDeclarationLogs(d.declarationId)
        if (!cancelled && logsRes.success) setLogs(logsRes.value)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [d.declarationId, loadGeneral])

  // Fila más reciente con NewStatusId = 10: es el rechazo vigente del cliente.
  const rejection = logs
    .filter((l) => l.newStatusId === DECLARATION_STATUS.CLIENT_REJECTED)
    .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0]

  /* ------------------------------------------------------------------ */
  /*  "Enviar Predeclaración"                                            */
  /* ------------------------------------------------------------------ */
  const [resendOpen, setResendOpen] = useState(false)
  const [resendNote, setResendNote] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState<
    { kind: 'success' | 'warning' | 'error'; text: string } | null
  >(null)

  const resendEnabled = general != null && RESENDABLE_STATUSES.has(general.statusId)

  const handleResendConfirm = async () => {
    setResendLoading(true)
    const res = await resendDeclarationToClient(d.declarationId, resendNote.trim() || undefined)
    setResendLoading(false)
    if (res.success) {
      setResendOpen(false)
      setResendNote('')
      setResendMessage(
        res.value.emailSent
          ? { kind: 'success', text: 'Correo enviado al cliente, declaración en revisión.' }
          : { kind: 'warning', text: 'Estatus actualizado pero el correo falló; reintenta.' },
      )
      void loadGeneral()
    } else {
      const text =
        res.error.code === 'INVALID_STATUS_TRANSITION'
          ? 'Esta declaración ya no admite reenvío con su estatus actual.'
          : res.error.message
      setResendMessage({ kind: 'error', text })
    }
  }

  // El régimen y el ejercicio son la referencia del contador: salen de /general
  // y caen a lo que traía el listado mientras carga.
  const ejercicio = general?.fiscalYear ?? d.fiscalYear
  const periodo = general?.periodo ?? d.periodo
  const periodicidad = general?.periodicity ?? null
  // Con un link directo (`?decl=`) no hubo listado previo: el nombre y el RFC
  // salen de /general.
  const legalName = general?.legalName || d.legalName
  const rfc = general?.rfc || d.rfc

  // El recálculo vive aquí y no en la pestaña: el botón del header y la pestaña
  // "Recálculo" comparten estado, y las tarjetas de arriba se repintan con el
  // resultado.
  const recalc = useRecalculation({
    rfc,
    fiscalYear: ejercicio,
    periodValueId: general?.periodValueId,
    regimeSatCode: general?.regimeSatCode,
  })

  // Entrada por URL directa: sin el listado detrás no hay nada que pintar hasta
  // que /general responda (las tabs necesitan ejercicio y periodo reales).
  const bootstrapping = !general && !d.legalName

  if (bootstrapping) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold self-start transition hover:opacity-90"
          style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <Card>
          <div className="py-14 flex flex-col items-center justify-center gap-2 text-center px-5">
            {generalError ? (
              <>
                <div className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>
                  No pudimos abrir la declaración
                </div>
                <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>{generalError}</div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
                <Loader2 size={18} className="animate-spin" /> Cargando declaración…
              </div>
            )}
          </div>
        </Card>
      </div>
    )
  }
  // Con el resultado del recálculo ya no hay que volver a pedir /general: el
  // response del EP trae los totales nuevos. Sin recálculo ni dato real, el
  // campo viaja `null` y la tarjeta pinta "—" — prohibido inventar cifras.
  const r = recalc.result
  const stats = {
    ingresosBrutos: r?.income ?? r?.accumulatedIncome ?? toNumber(general?.ingresosBrutos),
    gastosDeducibles:
      num(r?.ivaDetail ?? null, ['totalExpenses', 'expenseTotal', 'subtotalExpenses']) ??
      toNumber(general?.gastosDeducibles),
    isrCalculado: r?.annualTax ?? toNumber(general?.isrCalculado),
    ivaPorPagar: r?.ivaCargo ?? toNumber(general?.ivaCargo),
  }

  const regimen = general?.regimeName
    ? `${general.regimeSatCode ?? ''} ${general.regimeName}`.trim()
    : null

  // El gate solo se decide con /general resuelto: mientras carga se muestra el
  // loading normal, y si /general falló se conserva el comportamiento anterior.
  const regimeResuelto = general != null
  const regimeSoportado =
    !regimeResuelto || REGIMES_CON_PANTALLAS.has(general?.regimeSatCode ?? '')

  /** Envuelve las tabs de cálculo: loading → gate → contenido. */
  const conPantallasDeCalculo = (contenido: React.ReactNode) => {
    if (!regimeResuelto && !generalError) return <LoadingCard />
    if (!regimeSoportado) {
      return (
        <RegimenSinPantallas
          satCode={general?.regimeSatCode ?? null}
          name={general?.regimeName ?? null}
        />
      )
    }
    return contenido
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-bold transition hover:opacity-90"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <h2
              className="text-[24px] lg:text-[28px] font-extrabold tracking-tight leading-tight"
              style={{ ...DISPLAY, color: 'var(--ink-900)' }}
            >
              Declaración — {legalName}
            </h2>
            <div className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--ink-500)' }}>
              <code style={MONO}>{rfc}</code> • {periodo} {ejercicio}
              {periodicidad ? ` • ${periodicidad}` : ''}
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <MetaChip label="Ejercicio" value={String(ejercicio)} />
              <MetaChip label="Régimen" value={regimen ?? 'Sin régimen asignado'} muted={!regimen} />
              <CiecInline rfc={rfc} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <HeaderBtn
            icon={
              recalc.running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />
            }
            label={recalc.running ? `Calculando… ${recalc.seconds}s` : 'Recalcular'}
            kind="ghost"
            disabled={recalc.running || !recalc.ready}
            title={
              recalc.ready
                ? 'Vuelve a calcular ISR/IVA con los comprobantes del período'
                : 'La declaración no tiene período o régimen asignado'
            }
            onClick={() => {
              setTab(RECALCULO_TAB_INDEX)
              void recalc.run()
            }}
          />
          <HeaderBtn icon={<Download size={15} />} label="Exportar PDF" kind="ghost" />
          <HeaderBtn
            icon={<Send size={15} />}
            label="Enviar Predeclaración"
            kind="info"
            disabled={!resendEnabled}
            title={
              resendEnabled
                ? 'Reenvía la declaración corregida a revisión del cliente'
                : 'Solo disponible cuando la declaración está rechazada, en proceso o en revisión del cliente'
            }
            onClick={() => {
              setResendMessage(null)
              setResendOpen(true)
            }}
          />
        </div>
      </div>

      {resendMessage && (
        <div
          className="rounded-2xl px-4 py-3 flex items-start gap-2.5 text-[13px] font-semibold"
          style={
            resendMessage.kind === 'success'
              ? { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-100)' }
              : resendMessage.kind === 'warning'
                ? { background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--hero-amber-border, var(--border))' }
                : { background: 'var(--coral-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }
          }
        >
          {resendMessage.kind === 'success' ? (
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          )}
          <span>{resendMessage.text}</span>
        </div>
      )}

      {general?.statusId === DECLARATION_STATUS.CLIENT_REJECTED && rejection && (
        <div
          className="rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{ background: 'var(--coral-soft)', border: '1px solid var(--border)' }}
        >
          <XCircle size={20} className="mt-0.5 shrink-0" style={{ color: 'var(--violet-ink)' }} />
          <div className="flex flex-col gap-1">
            <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--violet-ink)' }}>
              Rechazada por el cliente
              <span className="font-semibold ml-2 opacity-80">{fmtDate(rejection.changedAt)}</span>
            </div>
            <div className="text-[13px]" style={{ color: 'var(--violet-ink)' }}>
              {rejection.note || 'El cliente no dejó un comentario.'}
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Ingresos Brutos" value={moneyOrDash(stats.ingresosBrutos)} color="var(--brand-700)" icon={<TrendingUp size={18} />} />
        <StatCard label="Gastos Deducibles" value={moneyOrDash(stats.gastosDeducibles)} color="var(--danger)" icon={<DollarSign size={18} />} />
        <StatCard label="ISR Calculado" value={moneyOrDash(stats.isrCalculado)} color="var(--sky)" icon={<Calculator size={18} />} />
        <StatCard label="IVA Por Pagar" value={moneyOrDash(stats.ivaPorPagar)} color="var(--violet)" icon={<DollarSign size={18} />} />
      </div>

      {/* Tabs */}
      <div
        className="flex p-1 rounded-2xl overflow-x-auto"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {TAB_ITEMS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className="flex-1 whitespace-nowrap px-4 py-2.5 rounded-xl text-[13.5px] font-bold transition"
            style={
              i === tab
                ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
                : { background: 'transparent', color: 'var(--ink-500)' }
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 0 && (
        <ComprobantesTab
          declarationId={d.declarationId}
          periodo={`${periodo} ${ejercicio}`}
          regimeSatCode={general?.regimeSatCode ?? null}
        />
      )}
      {tab === 1 &&
        conPantallasDeCalculo(
          <CalculosTab declarationId={d.declarationId} regimeSatCode={general?.regimeSatCode ?? null} />,
        )}
      {tab === RECALCULO_TAB_INDEX && (
        <RecalculoTab
          rfc={rfc}
          fiscalYear={ejercicio}
          periodValueId={general?.periodValueId ?? null}
          taxRegimeId={general?.taxRegimeId ?? null}
          periodo={`${periodo} ${ejercicio}`}
          recalc={recalc}
        />
      )}
      {tab === 3 &&
        conPantallasDeCalculo(
          <ClasificacionTab
            declarationId={d.declarationId}
            general={general}
            periodo={periodo}
            fiscalYear={ejercicio}
          />,
        )}
      {tab === 4 &&
        conPantallasDeCalculo(
          <ReporteClienteTab
            d={d}
            declarationId={d.declarationId}
            general={general}
            periodo={periodo}
            fiscalYear={ejercicio}
            onGoToComments={() => setTab(COMMENTS_TAB_INDEX)}
          />,
        )}
      {tab === COMMENTS_TAB_INDEX && (
        <DeclarationComments declarationId={d.declarationId} currentUser={currentUser} />
      )}

      <Modal isOpen={resendOpen} onClose={() => !resendLoading && setResendOpen(false)} title="Enviar Predeclaración">
        <div className="flex flex-col gap-4">
          <p className="text-[13.5px]" style={{ color: 'var(--foreground)' }}>
            Se reenviará la declaración corregida a <strong>{legalName}</strong> para que la vuelva
            a revisar. No presenta nada ante el SAT.
          </p>
          <div>
            <label className="text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
              Nota interna (opcional)
            </label>
            <textarea
              value={resendNote}
              onChange={(e) => setResendNote(e.target.value.slice(0, 500))}
              rows={3}
              placeholder="Motivo de la corrección, visible solo en la bitácora…"
              className="w-full mt-1.5 px-3 py-2 rounded-lg text-[13px]"
              style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
            />
            <div className="text-[11px] text-right mt-1" style={{ color: 'var(--ink-500)' }}>
              {resendNote.length}/500
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setResendOpen(false)}
              disabled={resendLoading}
              className="px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
              style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => void handleResendConfirm()}
              disabled={resendLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}
            >
              {resendLoading && <Loader2 size={14} className="animate-spin" />}
              Confirmar envío
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Gate de régimen sin pantallas de cálculo                                  */
/* -------------------------------------------------------------------------- */

function LoadingCard() {
  return (
    <Card>
      <div className="flex items-center gap-2 px-5 py-8 text-[14px]" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={18} className="animate-spin" /> Cargando declaración…
      </div>
    </Card>
  )
}

function RegimenSinPantallas({ satCode, name }: { satCode: string | null; name: string | null }) {
  const etiqueta = [satCode, name].filter(Boolean).join(' — ') || 'sin régimen asignado'
  return (
    <Card>
      <div className="py-14 px-6 flex flex-col items-center justify-center gap-3 text-center">
        <span
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--muted)', color: 'var(--ink-500)', border: '1px solid var(--border)' }}
        >
          <Construction size={22} />
        </span>
        <div className="text-[15px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
          Estamos trabajando en las pantallas de cálculo para este régimen
        </div>
        <div className="text-[13px] max-w-[440px]" style={{ color: 'var(--ink-500)' }}>
          <span className="font-semibold">{etiqueta}</span>. Por ahora puedes revisar los comprobantes
          y los comentarios de la declaración.
        </div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Chip de metadato (ejercicio, régimen)                                     */
/* -------------------------------------------------------------------------- */

function MetaChip({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px]"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
    >
      <span className="font-semibold uppercase tracking-wide text-[10px]" style={{ color: 'var(--ink-500)' }}>
        {label}
      </span>
      <span className="font-bold" style={{ color: muted ? 'var(--ink-500)' : 'var(--ink-900)' }}>
        {value}
      </span>
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header button                                                             */
/* -------------------------------------------------------------------------- */

function HeaderBtn({
  icon,
  label,
  kind,
  onClick,
  disabled,
  title,
}: {
  icon: React.ReactNode
  label: string
  kind: 'ghost' | 'info' | 'brand'
  onClick?: () => void
  disabled?: boolean
  title?: string
}) {
  const styles: Record<typeof kind, React.CSSProperties> = {
    ghost: { background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' },
    info: { background: 'var(--card)', border: '1px solid var(--hero-info-border)', color: 'var(--sky)' },
    brand: { background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
      style={styles[kind]}
    >
      {icon} {label}
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Stat card                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <div className="p-5 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            {label}
          </div>
          <div className="text-[24px] font-extrabold tracking-tight mt-1.5" style={{ ...DISPLAY, color }}>
            {value}
          </div>
        </div>
        <div style={{ color }}>{icon}</div>
      </div>
    </Card>
  )
}

/* -------------------------------------------------------------------------- */
/*  Props compartidas por Clasificación y Reporte Cliente                      */
/* -------------------------------------------------------------------------- */

interface ResumenProps {
  declarationId: number
  general: DeclarationGeneral | null
  periodo: string
  fiscalYear: number
}

/* -------------------------------------------------------------------------- */
/*  Tab: Clasificación                                                        */
/* -------------------------------------------------------------------------- */

function ClasificacionTab({ declarationId, general, periodo, fiscalYear }: ResumenProps) {
  return (
    <ResumenDeclaracion
      declarationId={declarationId}
      general={general}
      periodo={periodo}
      fiscalYear={fiscalYear}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  Tab: Reporte Cliente                                                      */
/* -------------------------------------------------------------------------- */

function ReporteClienteTab({
  d,
  declarationId,
  general,
  periodo,
  fiscalYear,
  onGoToComments,
}: ResumenProps & { d: DeclarationSubject; onGoToComments: () => void }) {
  const initials =
    d.legalName
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') || 'C'

  return (
    <div className="flex flex-col gap-5">
      {/* Report header card */}
      <div className="rounded-3xl p-5" style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-extrabold flex-shrink-0"
              style={{ background: 'var(--violet)', color: '#fff' }}
            >
              {initials}
            </div>
            <div>
              <h3 className="text-[18px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Reporte Fiscal — {d.periodo}
              </h3>
              <div className="flex gap-2 mt-2 flex-wrap">
                <MiniField label="Cliente" value={d.legalName} />
                <MiniField label="RFC" value={d.rfc} mono />
                <MiniField label="Ejercicio" value={String(d.fiscalYear)} />
              </div>
            </div>
          </div>
          <div className="text-right">
            {general ? (
              <Badge kind={declarationStatusBadge(general.statusCode, general.statusDescription).kind}>
                {declarationStatusBadge(general.statusCode, general.statusDescription).label}
              </Badge>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
                Cargando estatus…
              </span>
            )}
            <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
              {d.accountantName ? `Revisado por ${d.accountantName}` : 'Revisado por contador certificado'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'var(--sky)', color: '#fff' }}>
            <Download size={15} /> Descargar Reporte PDF
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold" style={{ background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }}>
            <Mail size={15} /> Enviar por Email
          </button>
          <button
            onClick={onGoToComments}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12.5px] font-bold"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <MessageSquarePlus size={15} /> Agregar Comentario
          </button>
        </div>
      </div>
      {/* Resumen y desglose del periodo, con los datos del EP de cálculos */}
      <ResumenDeclaracion
        declarationId={declarationId}
        general={general}
        periodo={periodo}
        fiscalYear={fiscalYear}
      />
    </div>
  )
}

function MiniField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-lg px-3 py-1.5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[12.5px] font-bold" style={{ ...(mono ? MONO : {}), color: 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}

