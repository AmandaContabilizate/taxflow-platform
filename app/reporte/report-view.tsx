'use client'

import { useMemo, useState } from 'react'
import {
  Check,
  ChevronDown,
  Clock,
  FileCheck2,
  Info,
  MessageSquare,
  Printer,
  Send,
  X,
} from 'lucide-react'
import {
  authorizeDeclarationReport,
  commentDeclarationReport,
} from '@/features/declaration-report/actions'
import {
  buildDetailBlocks,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  toNumber,
} from '@/features/declaration-report/lib/reportDetail'
import {
  CLIENT_REVIEW_BUSINESS_DAYS,
  DECLARATION_STATUS,
  REPORT_COMMENT_MAX_LENGTH,
  type DeclarationReport,
  type ReportDetailBlock,
  type ReportDetailRow,
} from '@/features/declaration-report/types'

type View = 'main' | 'authorized' | 'question' | 'sent' | 'closed'

/** Estatus en los que la declaración ya está presentada ante el SAT. */
const SUBMITTED_STATUS = new Set([3, 5, 7, 8])

function initialView(report: DeclarationReport): View {
  if (report.canAuthorize) return 'main'
  if (report.statusId === DECLARATION_STATUS.TO_SUBMIT) return 'authorized'
  if (report.statusId === DECLARATION_STATUS.CLIENT_REJECTED) return 'sent'
  return 'closed'
}

function headerTitle(report: DeclarationReport): string {
  const kind = report.periodicity
    ? `Declaración ${report.periodicity.toLowerCase()}`
    : 'Declaración'
  return report.periodLabel ? `${kind} · ${report.periodLabel}` : kind
}

function rowValue(row: ReportDetailRow): string {
  return row.format === 'percent' ? formatPercent(row.amount) : formatSignedMoney(row.amount)
}

function toneColor(tone: ReportDetailRow['tone']): string {
  if (tone === 'positive') return 'var(--brand-700)'
  if (tone === 'negative') return 'var(--danger)'
  return 'var(--ink-900)'
}

export function ReportView({
  report,
  token,
}: {
  report: DeclarationReport
  token: string
}) {
  const [view, setView] = useState<View>(() => initialView(report))
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const blocks = useMemo(
    () => [
      ...buildDetailBlocks(report.ivaDetail, 'iva'),
      ...buildDetailBlocks(report.isrDetail, 'isr'),
    ],
    [report.ivaDetail, report.isrDetail],
  )

  const total = toNumber(report.totalDeclaration) ?? 0
  const ivaFavor = toNumber(report.ivaFavor) ?? 0
  const canReturn = report.canAuthorize

  async function handleAuthorize() {
    setError(null)
    setLoading(true)
    const res = await authorizeDeclarationReport(token)
    setLoading(false)

    if (!res.success) {
      setError(res.error.message)
      return
    }
    setView('authorized')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await commentDeclarationReport(token, comment)
    setLoading(false)

    if (!res.success) {
      setError(res.error.message)
      return
    }
    setView('sent')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className="report-print-card w-full max-w-[640px] self-start overflow-hidden rounded-3xl"
      style={{
        background: 'var(--card)',
        border: '1.5px solid var(--border-strong)',
        boxShadow: 'var(--sh-3)',
      }}
    >
      <header
        className="flex flex-wrap items-center gap-3.5 px-6 py-5"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="grid size-[46px] shrink-0 place-items-center rounded-[14px]"
          style={{ background: 'var(--ink-900)' }}
        >
          <FileCheck2 size={22} style={{ color: 'var(--brand-400)' }} />
        </div>
        <div className="min-w-[170px] flex-1">
          <h1
            className="text-[17px] font-extrabold tracking-tight"
            style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
          >
            {headerTitle(report)}
          </h1>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--ink-500)' }}>
            Preparada por tu contador en Contabilízate
          </p>
        </div>
        <StatusBadge report={report} />
      </header>

      {view === 'main' || view === 'closed' ? (
        <section>
          <div
            className="px-6 pb-5 pt-6"
            style={{ background: 'linear-gradient(160deg,#2A1C64 0%,#221158 55%,#120A33 100%)' }}
          >
            <p
              className="mb-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em]"
              style={{ color: 'rgba(255,255,255,0.62)' }}
            >
              Total a pagar
            </p>
            <p
              className="text-[46px] font-extrabold leading-none tracking-tight tabular-nums"
              style={{ color: '#FFFFFF' }}
            >
              {formatMoney(total)}
              <span className="ml-1.5 text-xl font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                MXN
              </span>
            </p>
            <p className="mt-2.5 text-[13.5px]" style={{ color: 'rgba(255,255,255,0.72)' }}>
              {total > 0
                ? 'Impuesto a cargo del periodo'
                : 'No hay impuesto a cargo en este periodo'}
            </p>

            {ivaFavor > 0 && (
              <div
                className="mt-4 flex items-start gap-3 rounded-2xl px-3.5 py-3"
                style={{
                  background: 'rgba(0,211,161,0.12)',
                  border: '1px solid rgba(0,211,161,0.34)',
                }}
              >
                <Check size={17} className="mt-0.5 shrink-0" style={{ color: '#06FF94' }} />
                <p className="text-[13px] leading-[19px]" style={{ color: 'rgba(255,255,255,0.86)' }}>
                  <strong style={{ color: '#FFFFFF' }}>
                    Tienes {formatMoney(report.ivaFavor)} de IVA a favor.
                  </strong>{' '}
                  No lo pierdes: se acredita automáticamente en tus siguientes declaraciones.
                </p>
              </div>
            )}
          </div>

          <dl className="px-6 pb-1 pt-4">
            <IdRow label="RFC" value={report.rfc} mono />
            <IdRow label="Contribuyente" value={report.legalName} />
            <IdRow label="Régimen" value={report.regimeName} />
            <IdRow label="Actividad" value={report.activity} />
            <IdRow label="Periodo" value={report.periodLabel} />
            <IdRow label="Ingresos del periodo" value={formatMoney(report.income)} />
            {toNumber(report.isrRetenido) ? (
              <IdRow label="ISR retenido" value={formatMoney(report.isrRetenido)} />
            ) : null}
            {toNumber(report.ivaRetenido) ? (
              <IdRow label="IVA retenido" value={formatMoney(report.ivaRetenido)} />
            ) : null}
            {toNumber(report.personalDeductions) ? (
              <IdRow
                label="Deducciones personales"
                value={formatMoney(report.personalDeductions)}
              />
            ) : null}
          </dl>

          {blocks.length > 0 && (
            <details
              open
              className="group mx-6 mt-2.5 overflow-hidden rounded-2xl"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between gap-2.5 px-4 py-3.5 text-sm font-bold"
                style={{ color: 'var(--ink-900)' }}
              >
                Ver el detalle del cálculo
                <ChevronDown
                  size={16}
                  className="transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  style={{ color: 'var(--ink-500)' }}
                />
              </summary>
              <div className="grid gap-3.5 px-3.5 pb-4 pt-1 sm:grid-cols-2">
                {blocks.map((block) => (
                  <CalcBlock key={block.key} block={block} />
                ))}
              </div>
            </details>
          )}

          {view === 'main' ? (
            <div
              className="mx-6 mt-4 flex items-start gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)' }}
            >
              <Info size={18} className="mt-px shrink-0" style={{ color: 'var(--brand-700)' }} />
              <p className="text-[13px] leading-[19px]" style={{ color: 'var(--ink-900)' }}>
                Al autorizar, tu declaración pasa a la fila de presentación ante el SAT. Si algo no
                cuadra, mándanos tu duda: no presentamos nada hasta resolverla contigo.
              </p>
            </div>
          ) : (
            <div
              className="mx-6 mt-4 flex items-start gap-3 rounded-2xl px-4 py-3.5"
              style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}
            >
              <Info size={18} className="mt-px shrink-0" style={{ color: 'var(--ink-500)' }} />
              <p className="text-[13px] leading-[19px]" style={{ color: 'var(--ink-900)' }}>
                {SUBMITTED_STATUS.has(report.statusId)
                  ? 'Esta declaración ya está presentada ante el SAT, por eso no requiere tu autorización.'
                  : 'Esta declaración todavía no está lista para tu revisión. Tu contador te avisará en cuanto puedas autorizarla.'}
              </p>
            </div>
          )}

          {view === 'main' && <DeadlineNote />}

          {error && <ErrorNote className="mx-6 mt-4">{error}</ErrorNote>}

          <div className="grid gap-2.5 px-6 pb-2 pt-5 sm:grid-cols-[1.35fr_1fr]">
            {view === 'main' && (
              <>
                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={loading}
                  className="print-hidden flex items-center justify-center gap-2.5 rounded-full px-5 py-4 text-[15.5px] font-bold transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
                  style={{
                    background: 'linear-gradient(90deg,var(--brand-500),var(--brand-400))',
                    color: '#FFFFFF',
                    boxShadow: 'var(--sh-brand)',
                  }}
                >
                  <Check size={18} />
                  {loading ? 'Autorizando…' : 'Autorizar y presentar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null)
                    setView('question')
                  }}
                  disabled={loading}
                  className="print-hidden flex items-center justify-center gap-2.5 rounded-full px-5 py-4 text-[15.5px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    background: 'transparent',
                    color: 'var(--danger)',
                    border: '1.5px solid var(--danger)',
                  }}
                >
                  <X size={18} />
                  Tengo una duda
                </button>
              </>
            )}
            <PrintLink />
          </div>
        </section>
      ) : null}

      {view === 'authorized' && (
        <StateView
          icon={<Check size={28} style={{ color: 'var(--brand-700)' }} />}
          iconStyle={{ background: 'var(--brand-50)', border: '1px solid var(--brand-100)' }}
          title="Declaración autorizada"
          description="Queda lista para presentarse ante el SAT. Te enviaremos el acuse y la línea de captura por correo en cuanto quede confirmada."
          onBack={canReturn ? () => setView('main') : undefined}
        />
      )}

      {view === 'question' && (
        <section className="px-6 pb-7 pt-8 text-center">
          <div
            className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full"
            style={{ background: 'var(--amber-soft)' }}
          >
            <MessageSquare size={28} style={{ color: 'var(--amber)' }} />
          </div>
          <h2
            className="mb-2 text-xl font-extrabold"
            style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
          >
            Cuéntanos tu duda
          </h2>
          <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
            Tu contador la revisa y te responde. No presentaremos nada hasta resolverla contigo.
          </p>

          <p className="mx-auto mt-2 max-w-[34em] text-[13px] leading-[19px]" style={{ color: 'var(--ink-500)' }}>
            Tienes {CLIENT_REVIEW_BUSINESS_DAYS} días hábiles desde que te avisamos para
            enviarla. Si el plazo se cumple sin respuesta tuya, la declaración queda lista para
            presentar.
          </p>

          <form onSubmit={handleComment}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
              maxLength={REPORT_COMMENT_MAX_LENGTH}
              placeholder="Ej. Creo que falta una factura de gasolina de julio…"
              aria-label="Escribe tu duda"
              className="mt-4 min-h-[92px] w-full resize-y rounded-2xl px-3.5 py-3 text-sm outline-none"
              style={{
                background: 'var(--card-muted)',
                border: '1px solid var(--border-strong)',
                color: 'var(--ink-900)',
              }}
            />
            <p className="mt-1 text-right text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
              {comment.length}/{REPORT_COMMENT_MAX_LENGTH}
            </p>
            {error && <ErrorNote className="mt-2 text-left">{error}</ErrorNote>}
            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-full px-5 py-4 text-[15.5px] font-bold disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: 'linear-gradient(90deg,var(--brand-500),var(--brand-400))',
                color: '#FFFFFF',
                boxShadow: 'var(--sh-brand)',
              }}
            >
              <Send size={16} />
              {loading ? 'Enviando…' : 'Enviar comentario'}
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setError(null)
              setView('main')
            }}
            className="mt-3 w-full text-[13px]"
            style={{ color: 'var(--ink-500)' }}
          >
            Cancelar
          </button>
        </section>
      )}

      {view === 'sent' && (
        <StateView
          icon={<Send size={26} style={{ color: 'var(--ink-600)' }} />}
          iconStyle={{ background: 'var(--ink-100)' }}
          title="Comentario enviado"
          description="Tu contador ya lo tiene. Te avisamos por correo en cuanto responda."
          onBack={canReturn ? () => setView('main') : undefined}
        />
      )}

      <footer className="px-6 pb-5 pt-4 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <p className="text-[11.5px] leading-[17px]" style={{ color: 'var(--ink-500)' }}>
          Enviado por{' '}
          <span className="font-extrabold" style={{ color: 'var(--brand-700)' }}>
            Contabilízate
          </span>{' '}
          · Servicios contables apoyados en tecnología
        </p>
        <p className="mt-1 text-[11.5px] leading-[17px]" style={{ color: 'var(--ink-500)' }}>
          Si no reconoces esta declaración, escríbenos antes de responder.
        </p>
      </footer>
    </div>
  )
}

/**
 * "Descargar en PDF" del mockup: no hay endpoint que genere ese documento, el
 * requerimiento pide el PDF de esta misma pantalla. `window.print()` deja que el
 * navegador la guarde como PDF; las reglas `@media print` de globals.css ocultan
 * los controles.
 */
function PrintLink() {
  return (
    <p className="print-hidden text-center text-xs sm:col-span-2" style={{ color: 'var(--ink-500)' }}>
      ¿Quieres guardar este reporte?{' '}
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1 font-bold hover:underline"
        style={{ color: 'var(--brand-700)' }}
      >
        <Printer size={12} />
        Descárgalo en PDF
      </button>
    </p>
  )
}

/**
 * Plazo del worker `UpdateExpiredClientReviewDeclarationsCommand`: si el cliente no
 * autoriza ni comenta en el plazo, la declaración pasa sola a PorPresentar (11).
 */
function DeadlineNote() {
  return (
    <div
      className="mx-6 mt-3 flex items-start gap-3 rounded-2xl px-4 py-3.5"
      style={{ background: 'var(--amber-soft)', border: '1px solid var(--amber-soft)' }}
    >
      <Clock size={18} className="mt-px shrink-0" style={{ color: 'var(--amber)' }} />
      <p className="text-[13px] leading-[19px]" style={{ color: 'var(--ink-900)' }}>
        <strong>
          Tienes {CLIENT_REVIEW_BUSINESS_DAYS} días hábiles para autorizarla o mandarnos tu duda
          con un comentario.
        </strong>{' '}
        Si no haces nada en ese plazo, la dejamos lista para presentar ante el SAT
        automáticamente.
      </p>
    </div>
  )
}

function StatusBadge({ report }: { report: DeclarationReport }) {
  const tone = report.canAuthorize
    ? { bg: 'var(--brand-50)', fg: 'var(--brand-700)', border: 'var(--brand-100)' }
    : report.statusId === DECLARATION_STATUS.CLIENT_REJECTED
      ? { bg: 'var(--amber-soft)', fg: 'var(--ink-700)', border: 'var(--amber-soft)' }
      : { bg: 'var(--sky-soft)', fg: 'var(--ink-700)', border: 'var(--sky-soft)' }

  const label = report.canAuthorize
    ? 'Pendiente de autorizar'
    : (report.statusLabel ?? 'Sin estatus')

  return (
    <span
      className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-bold"
      style={{ background: tone.bg, color: tone.fg, border: `1px solid ${tone.border}` }}
    >
      {label}
    </span>
  )
}

function ErrorNote({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm font-semibold ${className ?? ''}`}
      style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
    >
      {children}
    </p>
  )
}

function IdRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex justify-between gap-3.5 border-b border-border py-2.5 text-[13.5px] last:border-b-0">
      <dt style={{ color: 'var(--ink-500)' }}>{label}</dt>
      <dd
        className={`text-right font-bold ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--ink-900)' }}
      >
        {value}
      </dd>
    </div>
  )
}

function CalcBlock({ block }: { block: ReportDetailBlock }) {
  return (
    <section
      className="overflow-hidden rounded-2xl"
      style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
    >
      <div
        className="flex items-center justify-between gap-2 px-3.5 py-2.5"
        style={{ background: 'var(--card-muted)', borderBottom: '1px solid var(--border)' }}
      >
        <h3 className="text-sm font-extrabold" style={{ color: 'var(--ink-900)' }}>
          {block.title}
        </h3>
        {block.tag && (
          <span
            className="rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide"
            style={{ background: 'var(--ink-100)', color: 'var(--ink-600)' }}
          >
            {block.tag}
          </span>
        )}
      </div>
      <dl className="px-3.5 pb-2.5 pt-1">
        {block.rows.map((row, i) => {
          const isTotal = row.emphasis === 'total'
          const isLast = i === block.rows.length - 1
          return (
            <div
              key={`${row.label}-${i}`}
              className="flex items-baseline justify-between gap-3 text-[13px] leading-[18px]"
              style={{
                borderBottom: isTotal || isLast ? 'none' : '1px solid var(--border)',
                borderTop: isTotal ? '1.5px solid var(--border-strong)' : undefined,
                paddingTop: isTotal ? 11 : 9,
                paddingBottom: 9,
                marginTop: isTotal ? 2 : undefined,
              }}
            >
              <dt
                style={{
                  color: row.emphasis === 'normal' ? 'var(--ink-500)' : 'var(--ink-900)',
                  fontWeight: isTotal ? 700 : 400,
                  fontSize: isTotal ? 13.5 : undefined,
                }}
              >
                {row.label}
              </dt>
              <dd
                className="whitespace-nowrap text-right tabular-nums"
                style={{
                  color: toneColor(row.tone),
                  fontWeight: isTotal ? 800 : 700,
                  fontSize: isTotal ? 16 : undefined,
                }}
              >
                {rowValue(row)}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function StateView({
  icon,
  iconStyle,
  title,
  description,
  onBack,
}: {
  icon: React.ReactNode
  iconStyle: React.CSSProperties
  title: string
  description: string
  onBack?: () => void
}) {
  return (
    <section className="px-6 pb-7 pt-9 text-center">
      <div className="mx-auto mb-4 grid size-[62px] place-items-center rounded-full" style={iconStyle}>
        {icon}
      </div>
      <h2
        className="mb-2 text-xl font-extrabold"
        style={{ color: 'var(--ink-900)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h2>
      <p className="mx-auto max-w-[34em] text-sm leading-[21px]" style={{ color: 'var(--ink-500)' }}>
        {description}
      </p>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="print-hidden mt-3 w-full text-[13px]"
          style={{ color: 'var(--ink-500)' }}
        >
          Volver
        </button>
      )}
    </section>
  )
}
