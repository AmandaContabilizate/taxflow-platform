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
// reciente terminó en Error/Expired, o el intento murió antes de crear la solicitud), 4 parcial
// (descarga temprana del día 1 completada hasta fin de mes; la cola día 1-6 del mes siguiente la pide
// el reconcile desde el día 7 — el texto lleva la fecha concreta, ver colaDelPeriodo). Ver
// GetPeriodDownloadStatusQuery.cs.
const GRIS = 'var(--ink-200, var(--border))'
const VERDE = 'var(--accent-500, #10b981)'
const COMBO_COLOR: Record<number, string> = {
  0: GRIS,
  1: VERDE,
  2: 'var(--sky-500, #0ea5e9)',
  3: 'var(--danger-500, #ef4444)',
  // Parcial = segmento a la mitad: sin color nuevo, se lee por forma.
  4: `linear-gradient(90deg, ${VERDE} 50%, ${GRIS} 50%)`,
}
const COMBO_LABEL: Record<number, string> = {
  0: 'pendiente',
  1: 'descargado',
  2: 'en curso',
  3: 'falló',
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/**
 * Fecha concreta de la cola del periodo: día 7 del mes siguiente (DownloadCoverageRange.TailDay + 1).
 * Antes decía "del mes siguiente" y se leía contra HOY: una regularización de septiembre vista en
 * noviembre parecía esperar al 7 de diciembre. Se arma con números (sin `new Date('YYYY-MM-DD')`,
 * que se interpreta UTC y en México pinta el día anterior).
 */
function colaDelPeriodo(fiscalYear: number, period: number): { mes: string; etiqueta: string; yaAbrio: boolean } {
  const mesN = period - 100 // 101..112 → 1..12
  const anioSig = mesN === 12 ? fiscalYear + 1 : fiscalYear
  const mesSig = mesN === 12 ? 1 : mesN + 1
  const mes = MESES[mesSig - 1] ?? ''
  const hoy = new Date()
  const hoyNum = hoy.getFullYear() * 10000 + (hoy.getMonth() + 1) * 100 + hoy.getDate()
  return { mes, etiqueta: `7 de ${mes} de ${anioSig}`, yaAbrio: hoyNum >= anioSig * 10000 + mesSig * 100 + 7 }
}

function etiquetaParcial(fiscalYear: number, period: number): string {
  const cola = colaDelPeriodo(fiscalYear, period)
  return cola.yaAbrio
    ? `descarga temprana hasta fin de mes; falta del 1 al 6 de ${cola.mes}, se vuelve a pedir en la siguiente revisión automática`
    : `descarga temprana hasta fin de mes; se completa a partir del ${cola.etiqueta}`
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
  const hayTemprana = faltantes.some((c) => status[c.key] === 4)
  const cola = colaDelPeriodo(status.fiscalYear, status.period)
  const labelDe = (estado: number) =>
    estado === 4 ? etiquetaParcial(status.fiscalYear, status.period) : (COMBO_LABEL[estado] ?? 'pendiente')

  const title = done
    ? 'Los 4 archivos SAT del periodo ya se descargaron.'
    : `Falta: ${faltantes.map((c) => (status[c.key] === 4 ? `${c.label} (días 1-6 de ${cola.mes})` : c.label)).join(', ')}. ` +
      (hayTemprana
        ? cola.yaAbrio
          ? `La descarga temprana del día 1 llega hasta fin de mes; los días 1-6 de ${cola.mes} se vuelven a pedir en la siguiente revisión automática.`
          : `La descarga temprana del día 1 llega hasta fin de mes; el resto se pide a partir del ${cola.etiqueta}.`
        : 'Tras encolar una descarga puede tardar unos minutos en reflejarse.')

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
            title={`${c.label}: ${labelDe(status[c.key])}`}
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
