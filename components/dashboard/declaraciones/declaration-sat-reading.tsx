'use client'

import { AlertCircle, AlertTriangle, Loader2, ScanText } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { getDeclarationSatReading } from '@/features/declarations/actions/getDeclarationSatReading.action'
import type {
  DeclarationSatReading,
  SatDocumentReading,
  SatDocumentTax,
  SatTaxDetermination,
} from '@/features/declarations/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge } from '../ui'
import { SinDatos, money } from './parts'

type Variant = 'row' | 'chip' | 'detail'

const VARIANT_CLASS: Record<Variant, string> = {
  row: 'w-[34px] h-[34px] rounded-lg',
  chip: 'w-[26px] h-[26px] rounded-md',
  detail: 'w-[42px] h-[42px] rounded-xl',
}
const VARIANT_ICON: Record<Variant, number> = { row: 15, chip: 13, detail: 17 }

interface ButtonProps {
  declarationId: number
  /** Vista del cliente (backoffice): pide la ruta espejo. */
  taxpayerId?: number
  /** Encabezado del modal ("Marzo 2026 · Complementaria 1"). */
  title: string
  variant?: Variant
}

/**
 * Ícono "Datos del SAT": abre el modal con lo que el lector sacó de los PDFs del SAT de UNA
 * declaración (Normal o complementaria). Se muestra siempre; si no hay lectura, cada rubro dice
 * "Sin datos".
 */
export function SatReadingButton({ declarationId, taxpayerId, title, variant = 'row' }: ButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Datos del SAT"
        aria-label="Datos del SAT"
        className={`inline-flex items-center justify-center flex-shrink-0 transition hover:opacity-90 ${VARIANT_CLASS[variant]}`}
        style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
      >
        <ScanText size={VARIANT_ICON[variant]} />
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={`Datos del SAT — ${title}`} maxWidth={900}>
        {open && <SatReadingPanel declarationId={declarationId} taxpayerId={taxpayerId} />}
      </Modal>
    </>
  )
}

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: DeclarationSatReading }

function SatReadingPanel({ declarationId, taxpayerId }: { declarationId: number; taxpayerId?: number }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    void (async () => {
      const res = await getDeclarationSatReading(declarationId, taxpayerId)
      if (cancelled) return
      setState(res.success ? { status: 'ready', data: res.value } : { status: 'error', message: res.error.message })
    })()
    return () => {
      cancelled = true
    }
  }, [declarationId, taxpayerId])

  if (state.status === 'loading') {
    return (
      <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
        <Loader2 size={18} className="animate-spin" /> Leyendo los datos del SAT…
      </div>
    )
  }
  if (state.status === 'error') {
    return (
      <div className="py-8 text-center flex flex-col items-center gap-2">
        <AlertCircle size={20} style={{ color: 'var(--danger)' }} />
        <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>
          {state.message}
        </div>
      </div>
    )
  }

  const r = state.data
  return (
    <div className="flex flex-col gap-6">
      <Rubro title="Resumen">
        <Grid>
          <Dato label="Folio de la declaración" value={r.operationNumber && <code style={MONO}>{r.operationNumber}</code>} />
          <Dato label="PDFs con error" value={String(r.failedPdfs)} tone={r.hasPdfError ? 'danger' : undefined} />
          <Dato label="PDFs sin leer" value={String(r.pendingPdfs)} />
        </Grid>
      </Rubro>

      <Documento
        title="Acuse"
        doc={r.acknowledgment}
        declarationFolio={r.operationNumber}
        rubros={['montos', 'pagosAnteriores', 'linea', 'determinacion']}
      />
      <Documento
        title="Línea de captura"
        doc={r.paymentLine}
        declarationFolio={r.operationNumber}
        rubros={['montos', 'pagosAnteriores', 'linea']}
      />
      <Documento
        title="Recibo bancario"
        doc={r.paymentReceipt}
        declarationFolio={r.operationNumber}
        rubros={['montos', 'linea', 'banco']}
      />
    </div>
  )
}

type RubroKey = 'montos' | 'pagosAnteriores' | 'linea' | 'banco' | 'determinacion'

/** Motivo del error de lectura (Catalogs.DocumentReadError.Code). */
const READ_ERROR_LABEL: Record<string, string> = {
  OperationNumberMismatch: 'Folio distinto al de la declaración',
  RfcMismatch: 'RFC distinto al del contribuyente',
  PeriodMismatch: 'Ejercicio o mes distinto',
  UnsupportedFilingType: 'Tipo de declaración no soportado',
  UnknownConcept: 'Concepto desconocido',
  UnknownFormat: 'Formato no reconocido',
  NoText: 'PDF escaneado (sin texto)',
  ParseError: 'Error de lectura',
  BlobNotFound: 'Archivo no encontrado',
  InvalidUrl: 'URL inválida',
  Unexpected: 'Error inesperado',
}

const READ_FAILED = 2

function Documento({
  title,
  doc,
  declarationFolio,
  rubros,
}: {
  title: string
  doc: SatDocumentReading | null
  declarationFolio: string | null
  rubros: RubroKey[]
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-[16px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
        {title}
      </h3>
      {doc == null ? (
        <SinDatos />
      ) : (
        <div className="flex flex-col gap-4 pl-3" style={{ borderLeft: '2px solid var(--border)' }}>
          <Lectura doc={doc} declarationFolio={declarationFolio} />
          {rubros.includes('montos') && <Montos taxes={doc.taxes} />}
          {rubros.includes('pagosAnteriores') && <PagosAnteriores taxes={doc.taxes} />}
          {rubros.includes('linea') && <Linea doc={doc} />}
          {rubros.includes('banco') && <Banco doc={doc} />}
          {rubros.includes('determinacion') && <Determinacion rows={doc.determinations} />}
        </div>
      )}
    </section>
  )
}

function Lectura({ doc, declarationFolio }: { doc: SatDocumentReading; declarationFolio: string | null }) {
  const failed = doc.readStatusId === READ_FAILED
  const otherFiling = !!doc.operationNumber && !!declarationFolio && doc.operationNumber !== declarationFolio
  return (
    <Rubro title="Lectura">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge kind={failed ? 'danger' : 'brand'}>{failed ? 'Con error' : 'Leído'}</Badge>
        {failed && (
          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
            {(doc.errorCode && READ_ERROR_LABEL[doc.errorCode]) ?? doc.errorCode ?? 'Sin motivo'}
          </span>
        )}
      </div>
      {failed && doc.errorDetail && (
        <p className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
          {doc.errorDetail}
        </p>
      )}
      <Grid>
        <Dato label="Leído el" value={fmtDateTime(doc.readAt)} />
        <Dato
          label="Número de operación (folio SAT)"
          value={
            doc.operationNumber && (
              <span className="inline-flex items-center gap-1.5">
                <code style={MONO}>{doc.operationNumber}</code>
                {otherFiling && (
                  <span title="El folio impreso no es el de esta declaración: el PDF es de otra presentación">
                    <AlertTriangle size={14} style={{ color: 'var(--danger)' }} />
                  </span>
                )}
              </span>
            )
          }
        />
        <Dato label="Tipo de declaración" value={doc.filingType} />
        <Dato label="Tipo de complementaria" value={doc.complementaryType} />
        <Dato label="Presentada el" value={doc.presentedAt && fmtDateTime(doc.presentedAt)} />
        <Dato label="Vencimiento de la obligación" value={doc.obligationDueDate && fmtDay(doc.obligationDueDate)} />
        <Dato label="Emitido el" value={doc.issuedAt && fmtDateTime(doc.issuedAt)} />
        <Dato label="Versión del formulario" value={doc.formVersion != null ? String(doc.formVersion) : null} />
      </Grid>
    </Rubro>
  )
}

function Montos({ taxes }: { taxes: SatDocumentTax[] }) {
  return (
    <Rubro title="Montos por impuesto">
      {taxes.length === 0 ? (
        <SinDatos />
      ) : (
        <ConceptTable
          columns={taxes}
          rows={[
            ['A cargo', (t) => money0(t.amountCharged)],
            ['Parte actualizada', (t) => money0(t.updatedPart)],
            ['Recargos', (t) => money0(t.surcharges)],
            ['Total de aplicaciones', (t) => money0(t.totalApplications)],
            ['Cantidad a cargo', (t) => money0(t.amountDue)],
            ['Cantidad a pagar', (t) => money0(t.amountToPay)],
            [
              'Saldo a favor',
              (t) =>
                t.amountInFavor == null ? null : (
                  <span style={{ color: t.amountInFavor > 0 ? 'var(--brand-700)' : undefined, fontWeight: 800 }}>
                    {money(t.amountInFavor)}
                  </span>
                ),
            ],
            ['Fecha del pago anterior', (t) => t.priorPaymentDate && fmtDay(t.priorPaymentDate)],
            ['Monto pagado con anterioridad', (t) => money0(t.amountPreviouslyPaid)],
          ]}
        />
      )}
    </Rubro>
  )
}

function PagosAnteriores({ taxes }: { taxes: SatDocumentTax[] }) {
  const rows = taxes.flatMap((t) => t.priorPayments.map((p) => ({ tax: t.taxCode, ...p })))
  return (
    <Rubro title="Pagos anteriores (complementaria)">
      {rows.length === 0 ? (
        <SinDatos />
      ) : (
        <SimpleTable
          headers={['Impuesto', 'Folio anterior', 'Línea de captura', 'Banco', 'Fecha de pago', 'Operación bancaria', 'Llave de pago', 'Monto pagado']}
          rows={rows.map((p) => [
            p.tax,
            <code key="f" style={MONO}>{p.priorOperationNumber}</code>,
            <code key="l" style={MONO}>{groupBy4(p.captureLineCode)}</code>,
            p.bank,
            fmtDay(p.paidOn),
            <code key="o" style={MONO}>{p.bankOperationNumber}</code>,
            <code key="k" style={MONO}>{p.paymentKey}</code>,
            money(p.amountPaid),
          ])}
        />
      )}
    </Rubro>
  )
}

function Linea({ doc }: { doc: SatDocumentReading }) {
  const line = doc.paymentLine
  const expired = line != null && line.validUntil < todayYmd()
  return (
    <Rubro title="Línea de captura">
      {line == null ? (
        <SinDatos />
      ) : (
        <Grid>
          <Dato label="Línea de captura" value={<code style={MONO}>{groupBy4(line.captureLineCode)}</code>} />
          <Dato label="Importe total a pagar" value={money(line.totalToPay)} />
          <Dato
            label="Vigente hasta"
            value={
              <span className="inline-flex items-center gap-2">
                {fmtDay(line.validUntil)}
                {expired && <Badge kind="danger">Vencida</Badge>}
              </span>
            }
          />
        </Grid>
      )}
    </Rubro>
  )
}

function Banco({ doc }: { doc: SatDocumentReading }) {
  const pay = doc.bankPayment
  return (
    <Rubro title="Pago en el banco">
      {pay == null ? (
        <SinDatos />
      ) : (
        <Grid>
          <Dato label="Institución de crédito" value={pay.bank} />
          <Dato label="Fecha del pago" value={fmtDay(pay.paidOn)} />
          <Dato label="Número de operación" value={<code style={MONO}>{pay.bankOperationNumber}</code>} />
          <Dato label="Llave de pago" value={<code style={MONO}>{pay.paymentKey}</code>} />
        </Grid>
      )}
    </Rubro>
  )
}

function Determinacion({ rows }: { rows: SatTaxDetermination[] }) {
  return (
    <Rubro title="Determinación del impuesto">
      {rows.length === 0 ? (
        <SinDatos />
      ) : (
        <ConceptTable
          columns={rows}
          rows={[
            ['Ingresos cobrados', (d) => money0(d.incomeCollected)],
            ['Base gravable / Actividades gravadas al 16%', (d) => money0(d.taxableBase)],
            ['Tasa aplicada', (d) => (d.rateApplied == null ? null : pct(d.rateApplied))],
            ['Impuesto mensual', (d) => money0(d.monthlyTax)],
            ['ISR retenido', (d) => money0(d.isrWithheld)],
            ['IVA a cargo (trasladado)', (d) => money0(d.vatTransferred)],
            ['IVA retenido', (d) => money0(d.vatWithheld)],
            ['IVA acreditable', (d) => money0(d.vatCreditable)],
            ['Saldo a favor de periodos anteriores aplicado', (d) => money0(d.priorFavorBalanceApplied)],
            ['Facturas PUE vigentes (SAT)', (d) => (d.pueInvoicesValid == null ? null : String(d.pueInvoicesValid))],
            ['Facturas PUE canceladas (SAT)', (d) => (d.pueInvoicesCancelled == null ? null : String(d.pueInvoicesCancelled))],
          ]}
        />
      )}
    </Rubro>
  )
}

// --- piezas de presentación ---

function Rubro({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

function Dato({ label, value, tone }: { label: string; value: ReactNode; tone?: 'danger' }) {
  const empty = value == null || value === '' || value === false
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
      <div className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
        {label}
      </div>
      <div
        className="text-[13.5px] font-bold mt-0.5 break-words"
        style={{ color: tone === 'danger' ? 'var(--danger)' : 'var(--ink-900)' }}
      >
        {empty ? <SinDatos /> : value}
      </div>
    </div>
  )
}

/** Tabla transpuesta: una columna por concepto (ISR, IVA…), un renglón por dato. */
function ConceptTable<T extends { concept: string; taxCode: string }>({
  columns,
  rows,
}: {
  columns: T[]
  rows: [string, (c: T) => ReactNode][]
}) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th className="px-2 py-2" />
            {columns.map((c, i) => (
              <th key={i} className="px-2 py-2 text-right align-bottom">
                <div className="font-extrabold" style={{ color: 'var(--ink-900)' }}>
                  {c.taxCode}
                </div>
                <div className="text-[10.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>
                  {c.concept}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, cell]) => (
            <tr key={label} style={{ borderBottom: '1px solid var(--border)' }}>
              <td className="px-2 py-2 font-semibold" style={{ color: 'var(--ink-700)' }}>
                {label}
              </td>
              {columns.map((c, i) => {
                const v = cell(c)
                return (
                  <td key={i} className="px-2 py-2 text-right whitespace-nowrap" style={{ ...MONO, color: 'var(--ink-900)' }}>
                    {v == null || v === '' ? <SinDatos /> : v}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {headers.map((h) => (
              <th key={h} className="px-2 py-2 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              {r.map((c, j) => (
                <td key={j} className="px-2 py-2 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// --- formato ---

/** Monto o null (null = el PDF no lo trae → "Sin datos"; nunca se pinta como $0). */
const money0 = (n: number | null) => (n == null ? null : money(n))

const pct = (fraction: number) =>
  `${(fraction * 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`

const groupBy4 = (code: string) => code.replace(/\s+/g, '').replace(/(.{4})(?=.)/g, '$1 ')

/** Fecha sin hora (`YYYY-MM-DD`): se arma en local para que no se corra un día por UTC. */
function fmtDay(ymd: string): string {
  const [y, m, d] = ymd.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ymd
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Fecha y hora: los PDFs del SAT están en hora de la Ciudad de México. */
function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function todayYmd(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' })
}
