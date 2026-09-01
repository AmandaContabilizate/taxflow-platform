'use client'

import { Download, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { canRunDeclarationDownload } from '@/features/declarations/actions/canRunDeclarationDownload.action'
import { runDeclarationDownload } from '@/features/declarations/actions/runDeclarationDownload.action'
import type { CanRunDeclarationDownload } from '@/features/declarations/types'
import { useHasPermission } from '../permissions'

interface Props {
  declarationId: number
}

/** "30 ago 2026, 8:56 a.m." en hora local del contador. */
function fechaLocal(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "Disponible mañana a las 12:00 a.m." — mismo helper que tab-diagnostico. */
function ventanaLabel(iso: string): string {
  const d = new Date(iso)
  const esOtroDia = d.toDateString() !== new Date().toDateString()
  const hora = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' })
  return esOtroDia ? `Disponible mañana a las ${hora}` : `Disponible a las ${hora}`
}

/**
 * Botón "Descargar archivos SAT" del detalle de declaración (contador). Re-encola la descarga de
 * los 4 tipos de archivo del periodo. Reglas (todas del backend, aquí solo se pinta el estado):
 * declaración mensual, periodo ya cerrado, CIEC válida, máximo 1 corrida por día calendario (MX).
 * Sin el claim `Contador.RunDeclarationDownload` no se pinta nada.
 */
export function DescargarArchivosSatBtn({ declarationId }: Props) {
  const puede = useHasPermission('Contador.RunDeclarationDownload')
  const [canRun, setCanRun] = useState<CanRunDeclarationDownload | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const check = useCallback(async () => {
    const res = await canRunDeclarationDownload(declarationId)
    setCanRun(res.success ? res.value : null)
    if (!res.success) setError(res.error.message)
    setLoading(false)
  }, [declarationId])

  useEffect(() => {
    setLoading(true)
    setNotice(null)
    setError(null)
    void check()
  }, [check])

  if (!puede) return null

  async function ejecutar() {
    if (running || !canRun?.puedeDescargar) return
    setRunning(true)
    setNotice(null)
    setError(null)
    const res = await runDeclarationDownload(declarationId)
    setRunning(false)
    if (!res.success) {
      setError(res.error.message)
      await check()
      return
    }
    setNotice('Descarga encolada — los archivos llegan en unos minutos.')
    await check()
  }

  // Precedencia del motivo de bloqueo (espejo de tab-diagnostico.razon).
  const razon = (() => {
    if (!canRun || canRun.puedeDescargar) return null
    if (!canRun.credencialValida) return 'Actualiza la CIEC del contribuyente para descargar.'
    if (canRun.proximaVentanaUtc) return ventanaLabel(canRun.proximaVentanaUtc)
    if (!canRun.esMensual) return 'Solo declaraciones mensuales.'
    if (!canRun.periodoPasado) return 'El periodo aún no cierra.'
    return null
  })()

  const title = razon ?? 'Vuelve a encolar la descarga de los 4 archivos SAT del periodo.'

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => void ejecutar()}
        disabled={loading || running || !canRun?.puedeDescargar}
        title={title}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition hover:opacity-95 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
      >
        {running ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {running ? 'Encolando…' : 'Descargar archivos SAT'}
      </button>

      {(canRun?.ultimaDescargaUtc || notice || error) && (
        <div className="text-[11.5px] leading-tight" style={{ color: error ? 'var(--danger)' : 'var(--ink-500)' }}>
          {error ?? notice ?? `Última descarga: ${fechaLocal(canRun!.ultimaDescargaUtc as string)}`}
        </div>
      )}
    </div>
  )
}
