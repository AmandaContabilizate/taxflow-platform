'use client'

import { AlertCircle, CheckCircle2, Clock, Loader2, UploadCloud, XCircle, Zap } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getClienteConstanciaEstado } from '@/features/diagnostico/actions/getClienteConstanciaEstado.action'
import type { ClienteConstanciaEstado, DiagnosticoRobotIntento } from '@/features/diagnostico/types'
import { useRfcStore } from '@/features/taxpayers/stores/rfcStore'
import type { CiecBlockStatus } from '../sat-connection.utils'
import { DISPLAY } from '../constants'
import { Btn, CiecUpdateModal, CsfUploadModal } from '../ui'
import type { GoFn } from '../types'

interface Props {
  go: GoFn
  state: CiecBlockStatus
  /**
   * Pantallas de COMPRA (Mi plan, Trámites): tras la espera configurada ofrecen "Subir mi
   * constancia" como plan B cuando el SAT no responde. Las de operación (facturas) no: ahí la
   * constancia no desbloquea nada.
   */
  allowCsfUpload?: boolean
}

const MODAL_SHOWN_KEY = 'ciec-invalid-modal-shown'
/** Sondeo de la actividad mientras se espera al SAT. Cambia poco: 10 s basta. */
const POLL_MS = 10_000

const COPY: Record<CiecBlockStatus, { icon: typeof AlertCircle; title: string; body: string }> = {
  unverified: {
    icon: Clock,
    title: 'Estamos validando tu CIEC',
    body: 'Tu contraseña CIEC (SAT) se está validando y esto puede tardar un poco. No es algo que tengas que arreglar: en cuanto termine, esta sección se desbloquea sola.',
  },
  invalid: {
    icon: AlertCircle,
    title: 'Tu CIEC es inválida',
    body: 'El SAT rechazó tu contraseña CIEC. Actualízala para poder seguir usando esta sección.',
  },
}

const TIMEOUT_COPY = {
  title: 'El SAT no respondió a tiempo',
  body: 'Seguimos intentando conectar con el SAT en segundo plano. Si no quieres esperar, sube tu constancia de situación fiscal y continúa ahora: leemos tu régimen del PDF y desbloqueamos tu plan al instante.',
}

/** Bloqueo por CiecState 0/2 en las pantallas que exigen conexión vigente (D1). */
export function CiecBlockedScreen({ go, state, allowCsfUpload = false }: Props) {
  const { selectedRfc, refresh } = useRfcStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [estado, setEstado] = useState<ClienteConstanciaEstado | null>(null)
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const refreshedRef = useRef(false)

  // D4: el modal empuja una vez por sesión; el resto del tiempo insiste el banner fijo.
  useEffect(() => {
    if (state !== 'invalid') return
    try {
      if (sessionStorage.getItem(MODAL_SHOWN_KEY)) return
      sessionStorage.setItem(MODAL_SHOWN_KEY, '1')
    } catch {
      // almacenamiento no disponible: igual abrimos el modal esta vez
    }
    setModalOpen(true)
  }, [state])

  // Sondeo de progreso solo mientras se espera (estado 0). Si aparece la constancia (la bajó el
  // robot o la subió el cliente desde otro lado), refrescamos el store y la pantalla se
  // desbloquea sola.
  useEffect(() => {
    if (state !== 'unverified' || !selectedRfc) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const tick = async () => {
      const res = await getClienteConstanciaEstado(selectedRfc)
      if (cancelled) return
      if (res.success) {
        setEstado(res.value)
        setSecondsLeft(res.value.estado.segundosRestantes)
        if (res.value.estado.tieneConstancia && !refreshedRef.current) {
          refreshedRef.current = true
          void refresh()
        }
      }
      timer = setTimeout(tick, POLL_MS)
    }
    void tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [state, selectedRfc, refresh])

  // Cuenta regresiva local entre sondeos.
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return
    const id = setInterval(() => setSecondsLeft((s) => (s === null || s <= 0 ? 0 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [secondsLeft])

  const waitElapsed = estado?.estado.puedeSubirConstancia === true || (secondsLeft !== null && secondsLeft <= 0)
  const offerUpload = allowCsfUpload && state === 'unverified' && estado?.estado.puedeSubirConstancia === true
  const copy = state === 'unverified' && offerUpload ? TIMEOUT_COPY : COPY[state]
  const Icon = state === 'unverified' && offerUpload ? UploadCloud : COPY[state].icon

  const intentos = useMemo(() => (estado?.intentos ?? []).slice(0, 4), [estado])

  return (
    <div className="flex flex-col gap-5 w-full">
      <div
        className="rounded-3xl p-6 lg:p-8 w-full"
        style={{ background: 'var(--hero-info)', border: '1px solid var(--hero-info-border)' }}
      >
        <div className="max-w-2xl">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--hero-info-icon-bg)' }}
          >
            <Icon color="#fff" size={24} />
          </div>
          <div className="text-[26px] lg:text-[32px] font-extrabold tracking-tight leading-tight mt-3" style={DISPLAY}>
            {copy.title}
          </div>
          <div className="text-[14px] mt-2 leading-relaxed" style={{ color: 'var(--ink-700)' }}>
            {copy.body}
          </div>

          {state === 'unverified' && estado && (
            <WaitProgress
              intentos={intentos}
              secondsLeft={secondsLeft}
              maxMinutes={estado.estado.esperaMaxMinutos}
              elapsed={waitElapsed}
            />
          )}

          {state === 'invalid' && (
            <div className="mt-5">
              <Btn kind="brand" size="lg" onClick={() => setModalOpen(true)}>
                <Zap size={18} /> Actualizar mi CIEC
              </Btn>
            </div>
          )}

          {offerUpload && (
            <div className="mt-5 flex flex-col gap-2">
              <Btn kind="brand" size="lg" onClick={() => setUploadOpen(true)}>
                <UploadCloud size={18} /> Subir mi constancia
              </Btn>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                Descárgala en el portal del SAT o en la app SAT ID. Debe ser reciente.
              </div>
            </div>
          )}
        </div>
      </div>

      {state === 'invalid' && selectedRfc && (
        <CiecUpdateModal isOpen={modalOpen} onClose={() => setModalOpen(false)} rfc={selectedRfc} />
      )}
      {offerUpload && selectedRfc && (
        <CsfUploadModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} rfc={selectedRfc} />
      )}
    </div>
  )
}

interface WaitProgressProps {
  intentos: DiagnosticoRobotIntento[]
  secondsLeft: number | null
  maxMinutes: number
  elapsed: boolean
}

function WaitProgress({ intentos, secondsLeft, maxMinutes, elapsed }: WaitProgressProps) {
  const mm = secondsLeft !== null ? Math.floor(Math.max(0, secondsLeft) / 60) : 0
  const ss = secondsLeft !== null ? Math.max(0, secondsLeft) % 60 : 0

  return (
    <div
      className="mt-5 rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>
          Conectando con el SAT
        </div>
        {!elapsed && secondsLeft !== null ? (
          <div className="text-[13px] font-semibold tabular-nums" style={{ color: 'var(--ink-500)' }}>
            Esperamos hasta {maxMinutes} min · {mm}:{ss.toString().padStart(2, '0')}
          </div>
        ) : (
          <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-500)' }}>
            Seguimos reintentando en segundo plano
          </div>
        )}
      </div>

      {intentos.length === 0 ? (
        <div className="text-[13px] flex items-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={14} className="animate-spin" /> Preparando la conexión…
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {intentos.map((i) => (
            <li key={i.id} className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-700)' }}>
              <StatusIcon estatusId={i.estatusId} />
              <span className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                {i.robot}
              </span>
              <span style={{ color: 'var(--ink-500)' }}>
                · {i.estatus.toLowerCase()}
                {i.attemptCount > 0 ? ` · intento ${i.attemptCount}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** 1 Completado · 2 Fallido · 3 Corriendo · 4 Abortado · 5 En espera · 6 Encolado. */
function StatusIcon({ estatusId }: { estatusId: number }) {
  if (estatusId === 1) return <CheckCircle2 size={15} style={{ color: 'var(--brand-600)' }} />
  if (estatusId === 2 || estatusId === 4) return <XCircle size={15} style={{ color: 'var(--coral)' }} />
  if (estatusId === 3) return <Loader2 size={15} className="animate-spin" style={{ color: 'var(--ink-500)' }} />
  return <Clock size={15} style={{ color: 'var(--ink-500)' }} />
}
