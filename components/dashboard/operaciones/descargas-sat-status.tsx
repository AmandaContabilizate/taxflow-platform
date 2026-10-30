'use client'

import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { memo } from 'react'
import { useDownloadStatus } from '@/features/declarations/hooks/useDeclarationQueries'

interface Props {
  declarationId: number
  /**
   * PeriodValueId del catálogo Period. Solo se usa como gate de render: el chip no se pinta si
   * no es mensual (101..112), y así se evita pedir para luego desaparecer. El backend también
   * lo valida (DOWNLOAD_NOT_MONTHLY).
   */
  periodValueId: number | null
}

type ComboKey = 'issuedInvoices' | 'receivedInvoices' | 'issuedRetentions' | 'receivedRetentions'

const COMBOS: { key: ComboKey; label: string }[] = [
  { key: 'issuedInvoices', label: 'Facturas emitidas' },
  { key: 'receivedInvoices', label: 'Facturas recibidas' },
  { key: 'issuedRetentions', label: 'Retenciones emitidas' },
  { key: 'receivedRetentions', label: 'Retenciones recibidas' },
]

// Dominio del backend por combo: 0 gris (nunca pedido), 1 verde (completo), 2 azul (en curso:
// DownloadRequest sin terminar o todavía en la cola interna de scrapers), 3 rojo (el intento más
// reciente terminó en Error/Expired). Ver GetPeriodDownloadStatusQuery.cs.
const COMBO_COLOR: Record<number, string> = {
  0: 'var(--ink-200, var(--border))',
  1: 'var(--accent-500, #10b981)',
  2: 'var(--sky-500, #0ea5e9)',
  3: 'var(--danger-500, #ef4444)',
}
const COMBO_LABEL: Record<number, string> = {
  0: 'pendiente',
  1: 'descargado',
  2: 'en curso',
  3: 'falló',
}

/**
 * Chip "Descargas del periodo: N/4" junto al botón Descargar archivos SAT.
 * Dice si los 4 combos de descarga del mes ya quedaron completos, con el
 * detalle de cuál falta en el tooltip. Lee la copia sincronizada: tras encolar
 * una descarga puede tardar unos minutos en reflejarse (el botón invalida esta
 * consulta al encolar; el ↻ la vuelve a pedir a mano).
 */
export const DescargasSatStatus = memo(function DescargasSatStatus({ declarationId, periodValueId }: Props) {
  const esMensual = periodValueId !== null && periodValueId >= 101 && periodValueId <= 112
  const statusQ = useDownloadStatus(declarationId, esMensual && !!declarationId)

  if (!esMensual) return null

  const loading = statusQ.isFetching
  const status = statusQ.isError ? null : (statusQ.data ?? null)

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
            title={`${c.label}: ${COMBO_LABEL[status[c.key]] ?? 'pendiente'}`}
            className="h-[5px] w-[13px] rounded-full"
            style={{
              background: COMBO_COLOR[status[c.key]] ?? COMBO_COLOR[0],
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
        onClick={() => void statusQ.refetch()}
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
})
