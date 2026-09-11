'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, History, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { canRunDiagnosticoVendedor } from '@/features/diagnostico/actions/canRunDiagnostico.action'
import { getDiagnosticoHistorial } from '@/features/diagnostico/actions/getDiagnosticoHistorial.action'
import { getDiagnosticoResultado } from '@/features/diagnostico/actions/getDiagnosticoResultado.action'
import { runDiagnosticoVendedor } from '@/features/diagnostico/actions/runDiagnostico.action'
import type { CanRunDiagnostico, DiagnosticoCorrida, DiagnosticoResultado } from '@/features/diagnostico/types'
import { Badge, Btn } from '../ui'
import { DISPLAY, MONO } from '../constants'
import { ActividadRobots } from './actividad-robots'
import { TabDocumentos } from './expediente-cliente'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Contribuyente a consultar; null cuando el modal está cerrado. */
  taxpayerId: number | null
  legalName?: string | null
  rfc?: string | null
  /** Claims del usuario: habilitan la pestaña Documentos (CSF / opinión). */
  permissions?: string[]
}

/** "5 sep 2026, 10:22 a.m." en hora local. */
function fechaCorrida(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function duracion(startedAt: string, finishedAt: string | null): string | null {
  if (!finishedAt) return null
  const min = Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  return min < 1 ? '<1 min' : `${min} min`
}

/** Punto de estado: el estatus se lee por color/forma antes que por texto. */
function EstadoDot({ estatusId }: { estatusId: number }) {
  // 1 = En curso (violeta, pulsa) · 2 = Completada (verde) · 3 = Abortada (gris)
  if (estatusId === 1) {
    return (
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
        <span
          className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping"
          style={{ background: 'var(--violet-ink)' }}
        />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: 'var(--violet-ink)' }} />
      </span>
    )
  }
  return (
    <span
      className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
      style={{ background: estatusId === 2 ? 'var(--accent-500, #10b981)' : 'var(--ink-300, var(--border))' }}
    />
  )
}

/**
 * Diagnóstico de un contribuyente como modal (lista de Contribuyentes): estado en
 * vivo, EJECUTAR bajo demanda (mismas reglas del flujo vendedor: cooldown 6h,
 * credencial vigente), las declaraciones pendientes que encontró y el historial
 * de corridas. Reusa los endpoints del tab Diagnóstico del expediente.
 */
export function DiagnosticoHistorialModal({ open, onOpenChange, taxpayerId, legalName, rfc, permissions = [] }: Props) {
  const canDocs =
    permissions.includes('Contador.GetTaxCertificate') || permissions.includes('Contador.GetComplianceOpinion')
  const [tab, setTab] = useState<'diag' | 'docs'>('diag')
  const [canRun, setCanRun] = useState<CanRunDiagnostico | null>(null)
  const [resultado, setResultado] = useState<DiagnosticoResultado | null>(null)
  const [corridas, setCorridas] = useState<DiagnosticoCorrida[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [runNotice, setRunNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!taxpayerId) return
    const [canRes, resRes, histRes] = await Promise.all([
      canRunDiagnosticoVendedor(taxpayerId),
      getDiagnosticoResultado(taxpayerId),
      getDiagnosticoHistorial(taxpayerId),
    ])
    setCanRun(canRes.success ? canRes.value : null)
    if (resRes.success) setResultado(resRes.value)
    if (histRes.success) setCorridas(histRes.value.corridas)
    setError(histRes.success || canRes.success ? null : (histRes.success ? null : histRes.error.message))
    setLoading(false)
  }, [taxpayerId])

  useEffect(() => {
    if (!open || !taxpayerId) return
    setTab('diag')
    setLoading(true)
    setCanRun(null)
    setResultado(null)
    setCorridas(null)
    setRunError(null)
    setRunNotice(null)
    void load()
  }, [open, taxpayerId, load])

  // Mientras corre, sondear cada 20s (igual que el tab del expediente): la lista
  // de pendientes crece conforme el robot siembra y el estado cierra solo.
  const corriendo = canRun?.yaCorriendo === true
  useEffect(() => {
    if (!open || !corriendo) return
    const id = setInterval(() => void load(), 20000)
    return () => clearInterval(id)
  }, [open, corriendo, load])

  const ventanaLabel = (iso: string) => {
    const d = new Date(iso)
    const esOtroDia = d.toDateString() !== new Date().toDateString()
    const hora = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    return esOtroDia ? `Disponible mañana a las ${hora}` : `Disponible a las ${hora}`
  }

  async function ejecutar() {
    if (!taxpayerId || running || corriendo) return
    setRunning(true)
    setRunError(null)
    setRunNotice(null)
    const res = await runDiagnosticoVendedor(taxpayerId)
    setRunning(false)
    if (!res.success) {
      setRunError(res.error.message)
      await load()
      return
    }
    if (!res.value.triggered) {
      setRunNotice('El contribuyente ya está al corriente — no hay nada que diagnosticar.')
      await load()
      return
    }
    await load() // yaCorriendo=true → estado "en curso" + polling
  }

  const esNuevo = !loading && corridas !== null && corridas.length === 0
  const razon = canRun && !canRun.puedeEjecutar && !corriendo && canRun.credencialValida
    ? canRun.proximaVentanaUtc
      ? ventanaLabel(canRun.proximaVentanaUtc)
      : 'Al corriente — no hay nada que diagnosticar'
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle style={DISPLAY}>{tab === 'docs' ? 'Documentos' : 'Diagnóstico'}</DialogTitle>
          <DialogDescription>
            {legalName}{legalName && rfc ? ' · ' : ''}
            {rfc && <code style={{ ...MONO, fontSize: '12px' }}>{rfc}</code>}
          </DialogDescription>
        </DialogHeader>

        {canDocs && (
          <div className="flex gap-1 -mt-1">
            {([
              { key: 'diag', label: 'Diagnóstico' },
              { key: 'docs', label: 'Documentos' },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer active:scale-[0.97]"
                style={{
                  transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)',
                  ...(tab === t.key
                    ? { background: 'var(--accent-100, #ecfdf5)', border: '1.5px solid var(--accent-500, #10b981)', color: 'var(--ink-900)' }
                    : { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--ink-500)' }),
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {tab === 'docs' && rfc ? (
          <div className="max-h-[62vh] overflow-y-auto pr-1">
            <TabDocumentos rfc={rfc} permissions={permissions} />
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-2 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--ink-50)' }} />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center flex flex-col items-center gap-2">
            <AlertCircle size={18} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-h-[62vh] overflow-y-auto pr-1">
            {/* ===== Estado / acción ===== */}
            {corriendo ? (
              <div className="flex items-start gap-3 rounded-xl px-3.5 py-3" style={{ background: 'var(--amber-soft)' }}>
                <span className="mt-1.5"><EstadoDot estatusId={1} /></span>
                <div>
                  <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                    Diagnóstico en curso
                  </div>
                  <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-600)' }}>
                    Buscando sus obligaciones en el SAT — este modal se actualiza solo.
                  </div>
                </div>
              </div>
            ) : canRun && !canRun.credencialValida ? (
              <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-[12.5px]" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>
                <AlertCircle size={15} className="shrink-0" /> Sin CIEC ni e.firma vigente — el diagnóstico no puede
                entrar al SAT. Revisa sus credenciales en el expediente (Clientes).
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-wrap">
                <Btn
                  kind="brand"
                  onClick={() => void ejecutar()}
                  disabled={!canRun?.puedeEjecutar || running}
                >
                  {running ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  {running ? 'Ejecutando…' : 'Ejecutar diagnóstico'}
                </Btn>
                {esNuevo && !razon && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-bold"
                    style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px dashed var(--border-strong)' }}
                  >
                    <Sparkles size={12} /> Nuevo — nunca diagnosticado
                  </span>
                )}
                {razon && (
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>{razon}</span>
                )}
              </div>
            )}
            {runError && (
              <div className="text-[12.5px] font-semibold -mt-2" style={{ color: 'var(--violet-ink)' }}>{runError}</div>
            )}
            {runNotice && (
              <div className="text-[12.5px] font-semibold -mt-2" style={{ color: 'var(--ink-500)' }}>{runNotice}</div>
            )}

            {/* ===== Declaraciones encontradas ===== */}
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="text-[12.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  Declaraciones pendientes encontradas
                </div>
                {resultado && resultado.porRevisar > 0 && <Badge kind="amber">{resultado.porRevisar} por revisar</Badge>}
                {resultado && resultado.noPresentadas > 0 && <Badge kind="coral">{resultado.noPresentadas} no presentadas</Badge>}
                {corriendo && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: 'var(--ink-400)' }}>
                    <Loader2 size={11} className="animate-spin" /> actualizando…
                  </span>
                )}
              </div>
              {resultado && resultado.pendientes.length > 0 ? (
                <ul className="flex flex-col">
                  {resultado.pendientes.map((p, i) => (
                    <li
                      key={p.declarationId}
                      className="py-2 flex items-center gap-3 flex-wrap motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
                      style={{
                        borderBottom: i < resultado.pendientes.length - 1 ? '1px solid var(--border)' : 'none',
                        animationDuration: '200ms',
                        animationDelay: `${Math.min(i, 8) * 40}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <span className="text-[13px] font-semibold min-w-[120px]" style={{ color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                        {p.periodo}
                      </span>
                      <span className="text-[12px] flex-1 min-w-[140px] truncate" style={{ color: 'var(--ink-500)' }}>
                        {p.regimen ?? 'Sin régimen identificado'}
                      </span>
                      <Badge kind={p.estatusId === 13 ? 'amber' : 'coral'}>{p.estatus}</Badge>
                    </li>
                  ))}
                </ul>
              ) : corriendo ? (
                <div className="flex flex-col gap-2">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--ink-50)' }} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[12.5px] py-1.5" style={{ color: 'var(--ink-500)' }}>
                  <CheckCircle2 size={14} style={{ color: 'var(--brand-700)' }} />
                  {esNuevo
                    ? 'Aún no se le corre un diagnóstico — ejecútalo para buscar sus adeudos.'
                    : 'Sin adeudos por atender: sus obligaciones están presentadas o en proceso.'}
                </div>
              )}
            </div>

            {/* ===== Historial de corridas ===== */}
            <div className="pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  <History size={13} style={{ color: 'var(--ink-500)' }} /> Historial de corridas
                </div>
                <button
                  type="button"
                  onClick={() => void load()}
                  title="Volver a consultar"
                  aria-label="Volver a consultar"
                  className="inline-flex items-center justify-center h-7 w-7 rounded-full cursor-pointer active:scale-[0.9] hover:bg-[var(--ink-50)]"
                  style={{ color: 'var(--ink-400)', transition: 'transform 140ms cubic-bezier(0.23, 1, 0.32, 1), background-color 150ms ease' }}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
              {corridas && corridas.length > 0 ? (
                <div className="flex flex-col">
                  {corridas.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-start gap-3 py-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1"
                      style={{
                        borderBottom: i < corridas.length - 1 ? '1px solid var(--border)' : undefined,
                        animationDuration: '200ms',
                        animationDelay: `${Math.min(i, 8) * 40}ms`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <div className="pt-1"><EstadoDot estatusId={c.estatusId} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>
                            {fechaCorrida(c.startedAt)}
                          </span>
                          <span
                            className="px-1.5 py-px rounded-md text-[10.5px] font-bold"
                            style={{ background: 'var(--ink-50)', color: 'var(--ink-600)', border: '1px solid var(--border)' }}
                          >
                            {c.fuente}
                          </span>
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                          {c.estatus}
                          {duracion(c.startedAt, c.finishedAt) && <> · duró {duracion(c.startedAt, c.finishedAt)}</>}
                          {c.disparadoPor && <> · por {c.disparadoPor}</>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] py-1" style={{ color: 'var(--ink-500)' }}>
                  Sin corridas del módulo de diagnóstico.
                </div>
              )}
            </div>

            {/* ===== Actividad de robots SAT (incluye el trabajo del onboarding) ===== */}
            {taxpayerId != null && <ActividadRobots taxpayerId={taxpayerId} corriendo={corriendo} />}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
