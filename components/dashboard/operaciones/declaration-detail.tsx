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
  FileCheck2,
  Loader2,
  LockOpen,
  RotateCcw,
  Send,
  TrendingUp,
  XCircle,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DECLARATION_STATUS } from '@/features/declaration-report/types'
import { useDeclaration, useInvalidateDownloadStatus } from '@/features/declarations/hooks/useDeclarationQueries'
import { useRecalculation } from '@/features/declarations/hooks/useRecalculation'
import type { DeclarationActivity, DeclarationGeneral, DeclarationSubject } from '@/features/operations/types'
import { getSatPassword } from '@/features/taxpayers/actions/getSatPassword.action'
import { toNumber } from './calc-read'
import { ComprobantesTab } from './comprobantes-tab'
import { DeclarationHistory } from './declaration-history'
import type { ResendMessage } from './declaration-modals'
import { DescargarArchivosSatBtn } from './descargar-archivos-sat-btn'
import { DescargasSatStatus } from './descargas-sat-status'
import { REGIMEN_612 } from './parts-612'
import { RecalcSeconds } from './recalc-seconds'
import { declarationStatusBadge, fmtDate } from '../declaraciones/parts'
import { DISPLAY, MONO } from '../constants'
import { useHasPermission } from '../permissions'
import { Badge, Card, CiecUpdateModal, CiecValidationBadge } from '../ui'

/* -------------------------------------------------------------------------- */
/*  Carga diferida                                                            */
/* -------------------------------------------------------------------------- */

// El dashboard es un solo bundle cliente: las pestañas pesadas (Recálculo con su
// universo completo, Cálculos, Resumen) y los modales salen a su propio chunk y se
// bajan la primera vez que se pintan. Comprobantes queda estático: es la pestaña
// inicial y además exporta las celdas que Recálculo reutiliza.
const CalculosTab = dynamic(() => import('./calculos-tab').then((m) => m.CalculosTab), {
  loading: () => <TabLoading />,
})
const RecalculoTab = dynamic(() => import('./recalculo-tab').then((m) => m.RecalculoTab), {
  loading: () => <TabLoading />,
})
// Clasificación y Reporte Cliente comparten `ResumenDeclaracion`: viaja en este chunk.
const ClasificacionTab = dynamic(() => import('./resumen-tabs').then((m) => m.ClasificacionTab), {
  loading: () => <TabLoading />,
})
const ReporteClienteTab = dynamic(() => import('./resumen-tabs').then((m) => m.ReporteClienteTab), {
  loading: () => <TabLoading />,
})
const Gastos612Tab = dynamic(() => import('./gastos-612-tab').then((m) => m.Gastos612Tab), {
  loading: () => <TabLoading />,
})
const SaldosFavorIvaTab = dynamic(() => import('./saldos-favor-iva-tab').then((m) => m.SaldosFavorIvaTab), {
  loading: () => <TabLoading />,
})
const DeclarationComments = dynamic(
  () => import('@/components/dashboard/declaraciones/declaration-comments').then((m) => m.DeclarationComments),
  { loading: () => <TabLoading /> },
)
// Los modales pintan null cerrados: mientras baja el chunk no hay nada que mostrar.
const DeclarationDocumentsModal = dynamic(
  () => import('./declaration-documents-modal').then((m) => m.DeclarationDocumentsModal),
  { loading: () => null },
)
const ReopenModal = dynamic(() => import('./declaration-modals').then((m) => m.ReopenModal), {
  loading: () => null,
})
const ResendModal = dynamic(() => import('./declaration-modals').then((m) => m.ResendModal), {
  loading: () => null,
})

/**
 * Estatus que se pueden reabrir: Presentada, Por autorizar y Por presentar. Pasan a
 * Reabierta (17), que se trabaja igual que En proceso.
 *
 * "Enviar Predeclaración" ya NO tiene lista de estatus en el front: el botón siempre
 * está activo y el back decide (9|10|11|15|17). Antes el front solo lo habilitaba en
 * 9, 10 y 15 aunque el back aceptaba el 11, y por eso a veces aparecía gris.
 */
const REOPENABLE_STATUSES = new Set<number>([
  DECLARATION_STATUS.SUBMITTED,
  DECLARATION_STATUS.CLIENT_REVIEW,
  DECLARATION_STATUS.TO_SUBMIT,
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
 * - Sin el claim `Contador.GetSatPassword` el control no se printable.
 */
function CiecInline({ rfc, ciecState: initialCiecState }: { rfc: string; ciecState?: number | null }) {
  const puedeVerCiec = useHasPermission('Contador.GetSatPassword')
  const [ciec, setCiec] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [currentCiecState, setCurrentCiecState] = useState<number | null | undefined>(initialCiecState)
  const [updateModalOpen, setUpdateModalOpen] = useState(false)

  useEffect(() => {
    setCurrentCiecState(initialCiecState)
  }, [initialCiecState])

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
      if (res.value.ciecState !== undefined && res.value.ciecState !== null) {
        setCurrentCiecState(res.value.ciecState)
      } else {
        setCurrentCiecState(0)
      }
      return
    }
    setCiec(null)
    setCurrentCiecState(null)
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
    <div className="inline-flex items-center gap-2 flex-wrap">
      <CiecValidationBadge
        rfc={rfc}
        ciecState={currentCiecState}
        size="sm"
        onStateChange={(s) => setCurrentCiecState(s)}
        onOpenUpdateModal={() => setUpdateModalOpen(true)}
      />
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

      <CiecUpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        rfc={rfc}
        onSuccess={() => {
          setCurrentCiecState(1)
          if (ciec) void ver()
        }}
      />
    </div>
  )
}

/**
 * Códigos SAT con pantallas de cálculo propias. Los demás regímenes muestran el
 * gate de "estamos trabajando en esto" en Cálculos/Clasificación/Reporte Cliente:
 * sus JSON tienen otra forma y pintarían cifras equivocadas.
 */
const REGIMES_CON_PANTALLAS = new Set(['612', '625', '626'])

const TAB_ITEMS = [
  'Comprobantes',
  'Cálculos',
  'Recálculo',
  'Clasificación',
  'Reporte Cliente',
  'Gastos',
  'Saldos a favor',
  'Comentarios',
] as const
const RECALCULO_TAB_INDEX = 2
/** Solo 612: activos fijos y saldos a favor de IVA. */
const GASTOS_TAB_INDEX = 5
const SALDOS_TAB_INDEX = 6
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
 *
 * Los datos salen de la caché por declaración (`useDeclarationQueries`): cada
 * pestaña pide lo suyo con su propia clave, los duplicados se comparten, y cuando
 * el back escribe (recálculo, reenvío, reapertura, acuse) `refreshDeclaration`
 * invalida todo lo de esta declaración en vez de pasar un `refreshKey` a mano.
 */
export function DeclarationDetail({ declaration: d, onBack, currentUser }: Props) {
  const [tab, setTab] = useState(0)

  // Modo solo consulta (SAC / atención a cliente): con ConsultaDeclaraciones y
  // SIN el claim completo, la pantalla queda en Comprobantes + Cálculos sin
  // acciones, contra las rutas espejo `/consulta/*`. El claim completo siempre
  // gana: con ReadDeclaraciones todo lo de abajo es inerte y la pantalla es
  // idéntica a la del contador.
  const canFull = useHasPermission('Contador.ReadDeclaraciones')
  const canConsulta = useHasPermission('Contador.ConsultaDeclaraciones')
  const soloConsulta = canConsulta && !canFull

  // /general y la bitácora van en paralelo. La bitácora alimenta el banner de rechazo y
  // el Historial (motivos de reapertura y mensajes de reenvío), así que se pide siempre,
  // no solo en estatus 10. El perfil de consulta no tiene ReadDeclaracionLogs: va por
  // la ruta espejo `/consulta/logs`.
  const { general, generalError, logs, logsLoading, refresh } = useDeclaration(d.declarationId, soloConsulta)

  // Sube cada vez que algo cambia la declaración en el back: la vista previa del
  // modal de envío recarga su iframe sin volver a pedir `report-link`.
  const [previewVersion, setPreviewVersion] = useState(0)

  /** El back escribió: se invalida general, bitácora, cálculos y comprobantes de esta declaración. */
  const refreshDeclaration = useCallback(async () => {
    setPreviewVersion((v) => v + 1)
    await refresh()
  }, [refresh])

  // Fila más reciente con NewStatusId = 10: es el rechazo vigente del cliente.
  const rejection = useMemo(
    () =>
      logs
        .filter((l) => l.newStatusId === DECLARATION_STATUS.CLIENT_REJECTED)
        .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())[0],
    [logs],
  )

  /* ------------------------------------------------------------------ */
  /*  "Documentos SAT" (Acuse y Línea de Captura)                       */
  /* ------------------------------------------------------------------ */
  const [documentsOpen, setDocumentsOpen] = useState(false)
  const closeDocuments = useCallback(() => setDocumentsOpen(false), [])
  const handleDocumentUploaded = useCallback(() => {
    void refreshDeclaration()
  }, [refreshDeclaration])

  /* ------------------------------------------------------------------ */
  /*  "Enviar Predeclaración"                                            */
  /* ------------------------------------------------------------------ */
  const [resendOpen, setResendOpen] = useState(false)
  const [resendMessage, setResendMessage] = useState<ResendMessage | null>(null)
  const closeResend = useCallback(() => setResendOpen(false), [])
  // El modal ya resolvió el texto (éxito, correo fallido, CALCULATION_CHANGED, estatus
  // inválido…); aquí solo se cierra, se pinta el aviso y se refresca si el back escribió.
  const handleResendDone = useCallback(
    (message: ResendMessage, opts: { refresh: boolean }) => {
      setResendOpen(false)
      setResendMessage(message)
      if (opts.refresh) void refreshDeclaration()
    },
    [refreshDeclaration],
  )

  // Siempre activo en cuanto carga la declaración: el back decide si el estatus lo permite y
  // el mensaje de error dice qué hacer (p. ej. reabrir una presentada).
  const resendEnabled = general != null

  /* ------------------------------------------------------------------ */
  /*  "Reabrir declaración"                                              */
  /* ------------------------------------------------------------------ */
  const [reopenOpen, setReopenOpen] = useState(false)
  const closeReopen = useCallback(() => setReopenOpen(false), [])

  const canReopen = general != null && REOPENABLE_STATUSES.has(general.statusId)
  const reopenFromSubmitted = general?.statusId === DECLARATION_STATUS.SUBMITTED

  const handleReopened = useCallback(
    (wasSubmitted: boolean) => {
      setReopenOpen(false)
      setResendMessage({
        kind: 'success',
        text: wasSubmitted
          ? 'Declaración reabierta. Como ya estaba presentada, la siguiente presentación irá como complementaria.'
          : 'Declaración reabierta: ya puedes corregirla y reenviarla al cliente.',
      })
      void refreshDeclaration()
    },
    [refreshDeclaration],
  )

  const goToComments = useCallback(() => setTab(COMMENTS_TAB_INDEX), [])
  // El botón encoló una descarga: el chip de estatus del periodo se re-consulta.
  const invalidateDownloadStatus = useInvalidateDownloadStatus(d.declarationId)

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
  // resultado. Al terminar se recarga todo: el back ya escribió los totales nuevos.
  // 612: confirmar/descartar/marcar activos o capturar saldos no cambia el cálculo hasta
  // recalcular. El aviso vive aquí para que siga visible al cambiar de pestaña.
  const [pendienteRecalculo, setPendienteRecalculo] = useState<string | null>(null)
  useEffect(() => setPendienteRecalculo(null), [d.declarationId])

  const recalc = useRecalculation(
    {
      declarationId: d.declarationId,
      rfc,
      fiscalYear: ejercicio,
      periodValueId: general?.periodValueId,
      regimeSatCode: general?.regimeSatCode,
    },
    () => {
      setPendienteRecalculo(null)
      void refreshDeclaration()
    },
  )

  const startRecalc = useCallback(() => {
    setTab(RECALCULO_TAB_INDEX)
    void recalc.run()
  }, [recalc])

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
  // El response del recálculo pinta las tarjetas mientras /general se refresca, pero
  // solo si es de ESTA declaración (con complementarias el periodo se comparte). Los
  // gastos siempre salen de /general: el clasificador no los manda en `ivaDetail`.
  // Sin dato real, el campo viaja `null` y la tarjeta pinta "—" — prohibido inventar cifras.
  const r = recalc.result?.declarationId === d.declarationId ? recalc.result : null
  const stats = {
    ingresosBrutos: r?.income ?? r?.accumulatedIncome ?? toNumber(general?.ingresosBrutos),
    gastosDeducibles: toNumber(general?.gastosDeducibles),
    isrCalculado: r?.annualTax ?? toNumber(general?.isrCalculado),
    ivaCargo: r?.ivaCargo ?? toNumber(general?.ivaCargo),
    ivaFavor: r?.ivaFavor ?? toNumber(general?.ivaFavor),
  }

  // El IVA del periodo es a cargo o a favor, nunca los dos: la tarjeta cambia de titulo en vez de
  // pintar un guion cuando el cargo es cero. Sin ninguno de los dos datos no se inventa nada.
  const ivaEsFavor = (stats.ivaCargo ?? 0) === 0 && (stats.ivaFavor ?? 0) > 0

  const regimen = general?.regimeName
    ? `${general.regimeSatCode ?? ''} ${general.regimeName}`.trim()
    : null

  // Actividades económicas del régimen de la declaración. Si no hay ninguna
  // registrada no se pinta nada (no un chip vacío).
  const actividades = (general?.activities ?? []).filter((a) => a.description?.trim())

  // El gate solo se decide con /general resuelto: mientras carga se muestra el
  // loading normal, y si /general falló se conserva el comportamiento anterior.
  const regimeResuelto = general != null
  const regimeSoportado =
    !regimeResuelto || REGIMES_CON_PANTALLAS.has(general?.regimeSatCode ?? '')
  const es612 = general?.regimeSatCode === REGIMEN_612

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
              <StatusChip general={general} />
              <MetaChip label="Ejercicio" value={String(ejercicio)} />
              <MetaChip label="Régimen" value={regimen ?? 'Sin régimen asignado'} muted={!regimen} />
              {soloConsulta ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-bold"
                  style={{ border: '1px solid var(--border-strong, var(--border))', color: 'var(--ink-500)' }}
                  title="Tu rol puede consultar comprobantes y cálculos, sin acciones sobre la declaración"
                >
                  <Eye size={12} /> Solo consulta
                </span>
              ) : (
                <CiecInline rfc={rfc} ciecState={general?.ciecState ?? d.ciecState} />
              )}
            </div>
            {actividades.length > 0 && <ActivityChips activities={actividades} />}
          </div>
        </div>

        {/* items-start: la columna de Descargar trae leyendas debajo (última descarga +
            estatus); centrar la fila empujaba ese botón hacia arriba. Los botones miden
            igual, así que alineados por arriba quedan en la misma línea. */}
        {/* En modo consulta las acciones no se pintan (ausencia, no disabled):
            la pantalla del perfil de consulta se ve completa para su rol. */}
        <div className="flex items-start gap-2 flex-wrap">
          {!soloConsulta && (
            <HeaderBtn
              icon={
                recalc.running ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />
              }
              label={
                recalc.running ? (
                  <>
                    Calculando… <RecalcSeconds startedAt={recalc.startedAt} />s
                  </>
                ) : (
                  'Recalcular'
                )
              }
              kind="ghost"
              disabled={recalc.running || !recalc.ready}
              title={
                recalc.ready
                  ? 'Vuelve a calcular ISR/IVA con los comprobantes del período'
                  : 'La declaración no tiene período o régimen asignado'
              }
              onClick={startRecalc}
            />
          )}
          {!soloConsulta && (
            <HeaderBtn
              icon={<FileCheck2 size={15} />}
              label="Comprobantes SAT"
              kind="ghost"
              title="Subir o consultar Acuse de Declaración y Línea de Captura en PDF"
              onClick={() => setDocumentsOpen(true)}
            />
          )}
          <HeaderBtn icon={<Download size={15} />} label="Exportar PDF" kind="ghost" />
          {/* Ya no espera a /general: el botón consulta `puede-ejecutar` en paralelo y el chip
              se pinta solo cuando llega el periodo y es mensual. Si /general falló, se oculta
              igual que antes. */}
          {!soloConsulta && !(general == null && generalError) && (
            <div className="flex flex-col gap-1">
              <DescargarArchivosSatBtn
                declarationId={d.declarationId}
                onEncolada={invalidateDownloadStatus}
              />
              <DescargasSatStatus
                declarationId={d.declarationId}
                periodValueId={general?.periodValueId ?? null}
              />
            </div>
          )}
          {!soloConsulta && canReopen && (
            <HeaderBtn
              icon={<LockOpen size={15} />}
              label="Reabrir declaración"
              kind="ghost"
              title="Regresa la declaración a tus manos para corregirla. Queda en estatus Reabierta."
              onClick={() => setReopenOpen(true)}
            />
          )}
          {!soloConsulta && (
            <HeaderBtn
              icon={<Send size={15} />}
              label="Enviar Predeclaración"
              kind="info"
              disabled={!resendEnabled}
              title={
                resendEnabled
                  ? 'Reenvía la declaración corregida a revisión del cliente'
                  : 'Cargando la declaración…'
              }
              onClick={() => {
                setResendMessage(null)
                setResendOpen(true)
              }}
            />
          )}
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

      {es612 && pendienteRecalculo && !soloConsulta && (
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap text-[13px]"
          style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid var(--border)' }}
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1 min-w-[220px]">
            <span className="font-semibold">{pendienteRecalculo}</span> El cálculo todavía no lo refleja:
            recalcula la declaración.
          </span>
          <button
            type="button"
            onClick={startRecalc}
            disabled={recalc.running || !recalc.ready}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            {recalc.running ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Recalcular
          </button>
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
        <StatCard
          label={ivaEsFavor ? 'IVA a Favor' : 'IVA Por Pagar'}
          value={moneyOrDash(ivaEsFavor ? stats.ivaFavor : stats.ivaCargo)}
          color="var(--violet)"
          icon={<DollarSign size={18} />}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex p-1 rounded-2xl overflow-x-auto"
        style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      >
        {/* Modo consulta (SAC): Comprobantes, Cálculos y Comentarios, sin las pantallas de
            trabajo del contador. Se conservan los índices originales de TAB_ITEMS. */}
        {TAB_ITEMS.map((t, i) => ({ t, i }))
          .filter(({ i }) => !soloConsulta || i <= 1 || i === COMMENTS_TAB_INDEX)
          .filter(({ i }) => (i !== GASTOS_TAB_INDEX && i !== SALDOS_TAB_INDEX) || (es612 && !soloConsulta))
          .map(({ t, i }) => (
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

      {/* Tab content. Las pestañas se desmontan al cambiar (su estado local se reinicia,
          como antes); sus datos viven en la caché, así que volver no vuelve a pedir nada
          mientras estén frescos. */}
      {tab === 0 && (
        <ComprobantesTab
          declarationId={d.declarationId}
          periodo={`${periodo} ${ejercicio}`}
          regimeSatCode={general?.regimeSatCode ?? null}
          consulta={soloConsulta}
        />
      )}
      {tab === 1 &&
        conPantallasDeCalculo(
          <CalculosTab
            declarationId={d.declarationId}
            rfc={rfc}
            regimeSatCode={general?.regimeSatCode ?? null}
            readOnly={soloConsulta}
            consulta={soloConsulta}
          />,
        )}
      {tab === RECALCULO_TAB_INDEX && (
        <RecalculoTab
          declarationId={d.declarationId}
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
            onGoToComments={goToComments}
          />,
        )}
      {tab === GASTOS_TAB_INDEX && es612 && !soloConsulta && (
        <Gastos612Tab declarationId={d.declarationId} rfc={rfc} onRequiereRecalculo={setPendienteRecalculo} />
      )}
      {tab === SALDOS_TAB_INDEX && es612 && !soloConsulta && (
        <SaldosFavorIvaTab declarationId={d.declarationId} rfc={rfc} onRequiereRecalculo={setPendienteRecalculo} />
      )}
      {tab === COMMENTS_TAB_INDEX && (
        <DeclarationComments declarationId={d.declarationId} currentUser={currentUser} readOnly={soloConsulta} />
      )}

      <DeclarationHistory logs={logs} loading={logsLoading} />

      <ReopenModal
        open={reopenOpen}
        onClose={closeReopen}
        declarationId={d.declarationId}
        legalName={legalName}
        periodo={periodo}
        ejercicio={ejercicio}
        fromSubmitted={reopenFromSubmitted}
        onReopened={handleReopened}
      />

      <ResendModal
        open={resendOpen}
        onClose={closeResend}
        declarationId={d.declarationId}
        legalName={legalName}
        statusId={general?.statusId ?? null}
        previewVersion={previewVersion}
        onDone={handleResendDone}
      />

      {/* Modal de Carga y Descarga de Documentos SAT (Acuse y Línea de Captura) */}
      <DeclarationDocumentsModal
        open={documentsOpen}
        onClose={closeDocuments}
        declarationId={d.declarationId}
        periodo={periodo}
        ejercicio={ejercicio}
        rfc={rfc}
        legalName={legalName}
        onDocumentUploaded={handleDocumentUploaded}
      />
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

/** Mientras baja el chunk de una pestaña diferida. Sin texto: la pestaña pone el suyo al montar. */
function TabLoading() {
  return (
    <Card>
      <div className="flex items-center justify-center px-5 py-8" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={18} className="animate-spin" />
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

/**
 * Estatus actual dentro de la declaración: antes solo se veía en el listado y el contador
 * tenía que salirse para saberlo. Mismo mapa que el listado y la vista del cliente.
 */
function StatusChip({ general }: { general: DeclarationGeneral | null }) {
  if (!general) return <MetaChip label="Estatus" value="Cargando…" muted />
  const status = declarationStatusBadge(general.statusCode ?? '', general.statusDescription ?? `Estatus ${general.statusId}`)
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px]"
      style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
      title={general.statusDescription ?? undefined}
    >
      <span className="font-semibold uppercase tracking-wide text-[10px]" style={{ color: 'var(--ink-500)' }}>
        Estatus
      </span>
      <Badge kind={status.kind}>{status.label}</Badge>
    </span>
  )
}

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
/*  Actividades económicas del régimen                                        */
/* -------------------------------------------------------------------------- */

function ActivityChips({ activities }: { activities: DeclarationActivity[] }) {
  return (
    <div className="flex items-start gap-2 mt-2 flex-wrap max-w-full lg:max-w-[720px]">
      <span
        className="font-semibold uppercase tracking-wide text-[10px] pt-1.5 shrink-0"
        style={{ color: 'var(--ink-500)' }}
      >
        {activities.length > 1 ? 'Actividades económicas' : 'Actividad económica'}
      </span>
      {activities.map((a) => (
        <span
          key={a.activityId}
          className="inline-flex px-2.5 py-1 rounded-lg text-[12px] font-bold leading-snug break-words"
          style={{ background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--ink-900)' }}
        >
          {a.description}
        </span>
      ))}
    </div>
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
  label: React.ReactNode
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
