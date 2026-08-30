'use client'

import { AlertCircle, CheckCircle2, History, KeyRound, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { canRunDiagnosticoVendedor } from '@/features/diagnostico/actions/canRunDiagnostico.action'
import { getDiagnosticoHistorial } from '@/features/diagnostico/actions/getDiagnosticoHistorial.action'
import { getDiagnosticoResultado } from '@/features/diagnostico/actions/getDiagnosticoResultado.action'
import { runDiagnosticoVendedor } from '@/features/diagnostico/actions/runDiagnostico.action'
import type { CanRunDiagnostico, DiagnosticoHistorial, DiagnosticoResultado } from '@/features/diagnostico/types'
import { Badge, Btn, Card } from '../ui'

interface Props {
  taxpayerId: number
  /** Liga al tab Credenciales cuando el bloqueo es la CIEC/e.firma. */
  onGoCredenciales: () => void
}

/** "30 ago 2026, 8:56 a.m." en hora local del gerente. */
function fechaCorrida(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function duracionCorrida(startedAt: string, finishedAt: string | null): string {
  if (!finishedAt) return ''
  const min = Math.round((new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 60000)
  return min < 1 ? 'duró <1 min' : `duró ${min} min`
}

/**
 * Tab "Diagnóstico" del expediente (spec-tab-diagnostico-expediente §3.3):
 * dispara el diagnóstico bajo demanda del contribuyente (flujo vendedor,
 * cooldown 6h) y muestra las declaraciones pendientes que el proceso encontró.
 * El progreso sale de puede-ejecutar (yaCorriendo) — el fiscal-score no sirve
 * aquí porque está amarrado al dueño del RFC.
 */
export function TabDiagnostico({ taxpayerId, onGoCredenciales }: Props) {
  const [canRun, setCanRun] = useState<CanRunDiagnostico | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [resultado, setResultado] = useState<DiagnosticoResultado | null>(null)
  const [historial, setHistorial] = useState<DiagnosticoHistorial | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [runNotice, setRunNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [canRes, resRes, histRes] = await Promise.all([
      canRunDiagnosticoVendedor(taxpayerId),
      getDiagnosticoResultado(taxpayerId),
      getDiagnosticoHistorial(taxpayerId),
    ])
    setCanRun(canRes.success ? canRes.value : null)
    setCheckError(canRes.success ? null : canRes.error.message)
    if (resRes.success) setResultado(resRes.value)
    if (histRes.success) setHistorial(histRes.value)
    setLoading(false)
  }, [taxpayerId])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  // Mientras el diagnóstico corre, sondear estado + resultado cada 20s: la lista
  // crece conforme el robot siembra y el tab cierra solo al terminar.
  useEffect(() => {
    if (!canRun?.yaCorriendo) return
    const id = setInterval(() => void load(), 20000)
    return () => clearInterval(id)
  }, [canRun?.yaCorriendo, load])

  const corriendo = canRun?.yaCorriendo === true

  const ventanaLabel = (iso: string) => {
    const d = new Date(iso)
    const esOtroDia = d.toDateString() !== new Date().toDateString()
    const hora = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
    return esOtroDia ? `Disponible mañana a las ${hora}` : `Disponible a las ${hora}`
  }

  async function ejecutar() {
    if (running || corriendo) return
    setRunning(true)
    setRunError(null)
    setRunNotice(null)
    const res = await runDiagnosticoVendedor(taxpayerId)
    setRunning(false)
    if (!res.success) {
      setRunError(res.error.message)
      await load() // el estado visible siempre refleja la verdad del servidor
      return
    }
    if (!res.value.triggered) {
      setRunNotice('El contribuyente ya está al corriente — no hay nada que diagnosticar.')
      await load()
      return
    }
    await load() // yaCorriendo=true → entra el estado "en curso" + polling
  }

  const razon = canRun && !canRun.puedeEjecutar && !corriendo
    ? canRun.proximaVentanaUtc
      ? ventanaLabel(canRun.proximaVentanaUtc)
      : !canRun.credencialValida
        ? null // el aviso de credencial tiene su propio bloque con liga
        : 'Al corriente — no hay nada que diagnosticar'
    : null

  return (
    <Card>
      <style>{`
        @keyframes tdx-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-[15px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
          Diagnóstico bajo demanda
        </div>
        <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
          Fuerza la relectura de su constancia y reevalúa sus declaraciones pendientes. Máximo una corrida cada 6
          horas por contribuyente.
        </div>
      </div>

      {/* ===== Estado / acción ===== */}
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', animation: 'tdx-in 150ms cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {loading ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={15} className="animate-spin" /> Consultando el estado del diagnóstico…
          </div>
        ) : corriendo ? (
          <div className="flex items-start gap-3">
            <span className="w-2 h-2 rounded-full animate-pulse mt-1.5 flex-shrink-0" style={{ background: '#7339FD' }} />
            <div>
              <div className="text-[13.5px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                Diagnóstico en curso
              </div>
              <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                Buscando sus obligaciones en el SAT — puede tardar unos minutos. Esta pantalla se actualiza sola.
              </div>
            </div>
          </div>
        ) : checkError ? (
          <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={15} /> {checkError}
          </div>
        ) : canRun && !canRun.credencialValida ? (
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
              <AlertCircle size={15} /> Sin CIEC ni e.firma vigente — el diagnóstico no puede entrar al SAT.
            </div>
            <Btn kind="ghost" size="sm" onClick={onGoCredenciales}>
              <KeyRound size={14} /> Revisar credenciales
            </Btn>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <Btn
                kind="brand"
                onClick={() => void ejecutar()}
                disabled={!canRun?.puedeEjecutar || running}
              >
                {running ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                {running ? 'Ejecutando…' : 'Ejecutar diagnóstico'}
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
        )}
      </div>

      {/* ===== Lo que encontró el diagnóstico ===== */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Declaraciones pendientes encontradas
          </div>
          {resultado && resultado.porRevisar > 0 && <Badge kind="amber">{resultado.porRevisar} por revisar</Badge>}
          {resultado && resultado.noPresentadas > 0 && <Badge kind="coral">{resultado.noPresentadas} no presentadas</Badge>}
          {corriendo && (
            <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold" style={{ color: 'var(--ink-400)' }}>
              <Loader2 size={11} className="animate-spin" /> actualizando…
            </span>
          )}
        </div>

        {loading ? (
          // Skeleton mientras carga la primera vez
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--ink-50)' }} />
            ))}
          </div>
        ) : resultado && resultado.pendientes.length > 0 ? (
          <ul className="flex flex-col">
            {resultado.pendientes.map((p, i) => (
              <li
                key={p.declarationId}
                className="py-2.5 flex items-center gap-3 flex-wrap"
                style={{
                  borderBottom: i < resultado.pendientes.length - 1 ? '1px solid var(--border)' : 'none',
                  animation: 'tdx-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              >
                <span className="text-[13.5px] font-semibold min-w-[130px]" style={{ color: 'var(--ink-900)' }}>
                  {p.periodo}
                </span>
                <span className="text-[12.5px] flex-1 min-w-[160px] truncate" style={{ color: 'var(--ink-500)' }}>
                  {p.regimen ?? 'Sin régimen identificado'}
                </span>
                <Badge kind={p.estatusId === 13 ? 'amber' : 'coral'}>{p.estatus}</Badge>
              </li>
            ))}
          </ul>
        ) : corriendo ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: 'var(--ink-50)' }} />
            ))}
            <div className="text-[12.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
              El diagnóstico sigue trabajando — lo encontrado aparecerá aquí.
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[13px] py-2" style={{ color: 'var(--ink-500)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--brand-700)' }} /> Sin adeudos por atender: sus obligaciones
            están presentadas o ya en proceso con su contador. Los periodos en curso se ven en Productos.
          </div>
        )}
      </div>

      {/* ===== Historial de corridas ===== */}
      <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <History size={14} style={{ color: 'var(--ink-500)' }} />
          <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
            Historial de corridas
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--ink-50)' }} />
            ))}
          </div>
        ) : historial && historial.corridas.length > 0 ? (
          <ul className="flex flex-col">
            {historial.corridas.map((c, i) => (
              <li
                key={c.id}
                className="py-2 flex items-center gap-3 flex-wrap"
                style={{
                  borderBottom: i < historial.corridas.length - 1 ? '1px solid var(--border)' : 'none',
                  animation: 'tdx-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both',
                  animationDelay: `${Math.min(i, 8) * 40}ms`,
                }}
              >
                <span className="text-[13px] font-semibold min-w-[170px]" style={{ color: 'var(--ink-900)' }}>
                  {fechaCorrida(c.startedAt)}
                </span>
                <span className="text-[12.5px] min-w-[90px]" style={{ color: 'var(--ink-500)' }}>
                  {c.fuente}
                </span>
                <span className="text-[12.5px] flex-1 min-w-[140px] truncate" style={{ color: 'var(--ink-500)' }}>
                  {c.disparadoPor ?? '—'}
                </span>
                <span className="text-[11.5px]" style={{ color: 'var(--ink-400)' }}>
                  {duracionCorrida(c.startedAt, c.finishedAt)}
                </span>
                <Badge kind={c.estatusId === 2 ? 'brand' : c.estatusId === 1 ? 'amber' : 'coral'}>
                  {c.estatus}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-[12.5px] py-1" style={{ color: 'var(--ink-500)' }}>
            Aún no se ha corrido ningún diagnóstico para este contribuyente.
          </div>
        )}
      </div>

      <div className="px-5 py-3 text-[11.5px]" style={{ color: 'var(--ink-400)', borderTop: '1px solid var(--border)' }}>
        "Por revisar" = encontrada por el diagnóstico, aún sin confirmar con el SAT · "No presentada" = adeudo
        confirmado (candidata a regularización).
      </div>
    </Card>
  )
}
