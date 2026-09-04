'use client'

import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getPeriodDownloadStatus } from '@/features/declarations/actions/getPeriodDownloadStatus.action'
import type { PeriodDownloadStatus } from '@/features/declarations/types'

interface Props {
  rfc: string
  fiscalYear: number
  /** PeriodValueId del catálogo Period; el chip solo se pinta si es mensual (101..112). */
  periodValueId: number | null
  /** Cambia cuando el contador encola una descarga: fuerza re-consulta. */
  refreshKey?: number
}

const COMBOS: { key: keyof PeriodDownloadStatus; label: string }[] = [
  { key: 'issuedInvoices', label: 'Facturas emitidas' },
  { key: 'receivedInvoices', label: 'Facturas recibidas' },
  { key: 'issuedRetentions', label: 'Retenciones emitidas' },
  { key: 'receivedRetentions', label: 'Retenciones recibidas' },
]

/**
 * Chip "Descargas del periodo: N/4" junto al botón Descargar archivos SAT.
 * Dice si los 4 combos de descarga del mes ya quedaron completos, con el
 * detalle de cuál falta en el tooltip. Lee la copia sincronizada: tras encolar
 * una descarga puede tardar unos minutos en reflejarse.
 */
export function DescargasSatStatus({ rfc, fiscalYear, periodValueId, refreshKey = 0 }: Props) {
  const [status, setStatus] = useState<PeriodDownloadStatus | null>(null)
  const [loading, setLoading] = useState(false)

  const esMensual = periodValueId !== null && periodValueId >= 101 && periodValueId <= 112

  const consultar = useCallback(async () => {
    if (!esMensual || !rfc) return
    setLoading(true)
    const res = await getPeriodDownloadStatus(rfc, fiscalYear, periodValueId as number)
    setStatus(res.success ? res.value : null)
    setLoading(false)
  }, [esMensual, rfc, fiscalYear, periodValueId])

  useEffect(() => {
    void consultar()
  }, [consultar, refreshKey])

  if (!esMensual) return null

  if (loading && !status) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={12} className="animate-spin" /> Descargas SAT…
      </span>
    )
  }
  if (!status) return null

  const completados = COMBOS.filter((c) => status[c.key] === 1).length
  const faltantes = COMBOS.filter((c) => status[c.key] !== 1)
  const done = faltantes.length === 0

  const title = done
    ? 'Los 4 archivos SAT del periodo ya se descargaron.'
    : `Falta: ${faltantes.map((c) => c.label).join(', ')}. ` +
      'Tras encolar una descarga puede tardar unos minutos en reflejarse.'

  return (
    <span
      title={title}
      className="inline-flex items-center gap-2 self-center text-[11.5px] cursor-default select-none"
      style={{ color: done ? 'var(--accent-700, #047857)' : 'var(--ink-500)' }}
    >
      {/* 4 segmentos = 4 combos; el estado se lee por forma, no solo por número */}
      <span className="inline-flex items-center gap-[3px]" aria-hidden>
        {COMBOS.map((c) => (
          <span
            key={c.key}
            title={`${c.label}: ${status[c.key] === 1 ? 'descargado' : 'pendiente'}`}
            className="h-[5px] w-[13px] rounded-full"
            style={{
              background: status[c.key] === 1 ? 'var(--accent-500, #10b981)' : 'var(--ink-200, var(--border))',
              transition: 'background-color 150ms ease',
            }}
          />
        ))}
      </span>
      <span className="font-semibold whitespace-nowrap">
        {done ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 size={13} /> Descargas SAT completas
          </span>
        ) : (
          <>
            Descargas SAT <span className="font-bold" style={{ color: 'var(--foreground)' }}>{completados}/4</span>
          </>
        )}
      </span>
      <button
        type="button"
        onClick={() => void consultar()}
        disabled={loading}
        title="Volver a consultar"
        aria-label="Volver a consultar descargas"
        className="inline-flex items-center justify-center h-5 w-5 rounded-full cursor-pointer active:scale-[0.9] disabled:cursor-wait"
        style={{
          color: 'var(--ink-400)',
          transition: 'color 150ms ease, background-color 150ms ease, transform 140ms cubic-bezier(0.23, 1, 0.32, 1)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ink-50, var(--input))' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <RefreshCw size={11} className={loading ? 'animate-spin' : undefined} />
      </button>
    </span>
  )
}
