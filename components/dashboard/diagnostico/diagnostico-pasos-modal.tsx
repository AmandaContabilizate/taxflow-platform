'use client'

import { ArrowRight, CheckCircle2, Hourglass, Loader2, ShoppingBag, XCircle } from 'lucide-react'
import type { FiscalScore } from '@/features/declarations/types'
import type { DiagnosticoPaso, DiagnosticoPasos, PasoEstatusId } from '@/features/diagnostico/types'
import { DISPLAY } from '../constants'
import { Modal } from '../modal'
import { Btn } from '../ui'

interface Props {
  isOpen: boolean
  onClose: () => void
  pasos: DiagnosticoPasos | null
  loading: boolean
  error: string | null
  /** Para "Revisando N de TD declaraciones" (mismos números que el hero). */
  score: FiscalScore | null
  onIrAMiPlan: () => void
}

/** 1 Completado · 2 En espera · 3 Ejecutando · 4 Falló (ya no se reintenta). */
function PasoIcon({ estatusId }: { estatusId: PasoEstatusId }) {
  if (estatusId === 1) return <CheckCircle2 size={20} style={{ color: 'var(--brand-600)' }} aria-label="Completado" />
  if (estatusId === 3) return <Loader2 size={20} className="animate-spin" style={{ color: 'var(--brand-500)' }} aria-label="Ejecutando" />
  if (estatusId === 4) return <XCircle size={20} style={{ color: 'var(--danger)' }} aria-label="Falló" />
  return <Hourglass size={20} style={{ color: 'var(--ink-400)' }} aria-label="En espera" />
}

function detalle(paso: DiagnosticoPaso, score: FiscalScore | null): string | null {
  if (paso.clave === 'declaraciones' && score && paso.estatusId !== 4) {
    const total = score.total + score.pendingVerificationCount
    if (total > 0 && paso.estatusId !== 1) return `Revisando ${score.total} de ${total} declaraciones`
    if (total > 0) return `${total} declaraciones revisadas`
  }
  return paso.detalle
}

/** Modal "i" de la pantalla Diagnóstico: los pasos del diagnóstico con su estado. */
export function DiagnosticoPasosModal({ isOpen, onClose, pasos, loading, error, score, onIrAMiPlan }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pasos de tu diagnóstico" maxWidth={520}>
      {loading && !pasos ? (
        <div className="flex items-center gap-2 text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
          <Loader2 size={16} className="animate-spin" /> Consultando tu diagnóstico…
        </div>
      ) : error && !pasos ? (
        <div className="text-[13.5px]" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      ) : pasos ? (
        <ol className="flex flex-col gap-2">
          {pasos.pasos.map((paso, i) =>
            paso.clave === 'compra' && pasos.soloFaltaCompra ? (
              <li
                key={paso.clave}
                className="rounded-2xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--hero-brand-soft)', border: '1px solid var(--brand-200)' }}
              >
                <div className="flex items-start gap-3">
                  <ShoppingBag size={22} style={{ color: 'var(--brand-600)' }} className="shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[15.5px] font-extrabold" style={{ ...DISPLAY, color: 'var(--ink-900)' }}>
                      ¡Tu diagnóstico está listo!
                    </div>
                    <div className="text-[13px] mt-0.5" style={{ color: 'var(--ink-600)' }}>
                      Solo falta elegir tu plan para que nos encarguemos de todo.
                    </div>
                  </div>
                </div>
                <Btn kind="brand" size="md" block onClick={onIrAMiPlan}>
                  Ir a Mi plan <ArrowRight size={16} />
                </Btn>
              </li>
            ) : (
              <li
                key={paso.clave}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5"
                style={{ background: paso.estatusId === 3 ? 'var(--ink-50)' : undefined }}
              >
                <span className="shrink-0 mt-0.5">
                  <PasoIcon estatusId={paso.estatusId} />
                </span>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                    {i + 1}. {paso.titulo}
                  </div>
                  <div className="text-[12.5px]" style={{ color: paso.estatusId === 4 ? 'var(--danger)' : 'var(--ink-500)' }}>
                    {detalle(paso, score) ?? paso.estatus}
                  </div>
                </div>
              </li>
            ),
          )}
        </ol>
      ) : null}
    </Modal>
  )
}
