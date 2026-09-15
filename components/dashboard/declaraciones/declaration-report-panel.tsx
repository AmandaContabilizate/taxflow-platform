'use client'

import { AlertCircle, CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  authorizeMyDeclarationReport,
  commentMyDeclarationReport,
} from '@/features/declaration-report/actions'
import {
  buildDetailBlocks,
  formatMoney,
  formatPercent,
  formatSignedMoney,
  toNumber,
} from '@/features/declaration-report/lib/reportDetail'
import {
  DECLARATION_STATUS,
  REPORT_COMMENT_MAX_LENGTH,
  type DeclarationReport,
  type ReportDetailRow,
} from '@/features/declaration-report/types'
import { DISPLAY } from '../constants'
import { Badge } from '../ui'

type View = 'main' | 'authorized' | 'sent'

function rowValue(row: ReportDetailRow): string {
  return row.format === 'percent' ? formatPercent(row.amount) : formatSignedMoney(row.amount)
}

function rowColor(tone: ReportDetailRow['tone']): string {
  if (tone === 'positive') return 'var(--brand-700)'
  if (tone === 'negative') return 'var(--danger)'
  return 'var(--ink-900)'
}

/**
 * El cálculo de la declaración dentro del dashboard.
 *
 * Mismos datos que el reporte del correo, otra presentación: allá es un documento que se
 * lee de corrido en el celular, aquí es una pantalla — el total arriba, el desglose en
 * pestañas en vez de apilado, y las acciones al pie. La lógica de armado de renglones
 * (`buildDetailBlocks`) sí se comparte: eso es negocio, no diseño.
 */
export function DeclarationReportPanel({
  report,
  onDone,
}: {
  report: DeclarationReport
  /** Se llama tras autorizar o mandar la duda, para que la pantalla de atrás se refresque. */
  onDone?: () => void
}) {
  const [view, setView] = useState<View>(() =>
    report.statusId === DECLARATION_STATUS.TO_SUBMIT ? 'authorized' : 'main',
  )
  const [tab, setTab] = useState<'iva' | 'isr'>('iva')
  const [comment, setComment] = useState('')
  const [asking, setAsking] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ivaBlocks = useMemo(() => buildDetailBlocks(report.ivaDetail, 'iva'), [report.ivaDetail])
  const isrBlocks = useMemo(() => buildDetailBlocks(report.isrDetail, 'isr'), [report.isrDetail])
  const blocks = tab === 'iva' ? ivaBlocks : isrBlocks

  // ISR e IVA son impuestos distintos y se pagan aparte: el total es la suma y el IVA a
  // favor NO se resta, va en su propio aviso.
  const isrCargo = toNumber(report.isrCargo) ?? 0
  const ivaCargo = toNumber(report.ivaCargo) ?? 0
  const total = toNumber(report.totalDeclaration) ?? isrCargo + ivaCargo
  const ivaFavor = toNumber(report.ivaFavor) ?? 0

  async function authorize() {
    setError(null)
    setLoading(true)
    const res = await authorizeMyDeclarationReport(report.declarationId)
    setLoading(false)
    if (!res.success) return setError(res.error.message)
    setView('authorized')
    onDone?.()
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await commentMyDeclarationReport(report.declarationId, comment)
    setLoading(false)
    if (!res.success) return setError(res.error.message)
    setView('sent')
    onDone?.()
  }

  if (view !== 'main') {
    const ok = view === 'authorized'
    return (
      <div className="flex flex-col items-center text-center gap-3 py-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: ok ? 'var(--brand-50)' : 'var(--ink-50)' }}
        >
          {ok ? (
            <CheckCircle2 size={26} style={{ color: 'var(--brand-700)' }} />
          ) : (
            <MessageSquare size={26} style={{ color: 'var(--ink-700)' }} />
          )}
        </div>
        <h3 className={`text-[19px] font-extrabold ${DISPLAY}`} style={{ color: 'var(--ink-900)' }}>
          {ok ? 'Declaración autorizada' : 'Tu duda va en camino'}
        </h3>
        <p className="text-[13.5px] max-w-[46ch]" style={{ color: 'var(--ink-500)' }}>
          {ok
            ? 'Queda en la fila de presentación ante el SAT. Te avisamos en cuanto esté presentada.'
            : 'Tu contador la revisa y te responde. Mientras tanto no presentamos nada.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lo primero y lo más grande: cuánto se paga. */}
      <div className="rounded-2xl p-6" style={{ background: 'var(--ink-900)' }}>
        <div className="text-[11.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-300, #9b97b8)' }}>
          Total a pagar
        </div>
        <div className={`text-[38px] leading-none font-black mt-1.5 ${DISPLAY}`} style={{ color: '#fff' }}>
          {total > 0 ? formatMoney(total) : '$0.00'}
          <span className="text-[15px] font-bold ml-2" style={{ color: 'var(--ink-300, #9b97b8)' }}>
            MXN
          </span>
        </div>

        {total > 0 ? (
          <div className="flex flex-wrap gap-2.5 mt-4">
            {isrCargo > 0 && <Pill label="ISR" value={formatMoney(isrCargo)} />}
            {ivaCargo > 0 && <Pill label="IVA" value={formatMoney(ivaCargo)} />}
          </div>
        ) : (
          <p className="text-[13px] mt-2.5" style={{ color: 'var(--ink-300, #9b97b8)' }}>
            No hay impuesto a cargo en este periodo.
          </p>
        )}

        {ivaFavor > 0 && (
          <p className="text-[12.5px] mt-4 pt-4" style={{ color: '#fff', borderTop: '1px solid rgba(255,255,255,.14)' }}>
            Tienes <b>{formatMoney(ivaFavor)}</b> de IVA a favor. No lo pierdes: se acredita en tus
            siguientes declaraciones.
          </p>
        )}
      </div>

      {/* Contexto del periodo, en una rejilla compacta. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Dato label="Ingresos del periodo" value={formatMoney(report.income)} />
        <Dato label="ISR retenido" value={formatMoney(report.isrRetenido)} />
        <Dato label="IVA retenido" value={formatMoney(report.ivaRetenido)} />
        <Dato label="Régimen" value={report.regimeSatCode ?? '—'} />
      </div>

      {/* El desglose en pestañas: en el correo va apilado, aquí no cabe así. */}
      {(ivaBlocks.length > 0 || isrBlocks.length > 0) && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['iva', 'isr'] as const).map((k) => {
              const empty = (k === 'iva' ? ivaBlocks : isrBlocks).length === 0
              const active = tab === k
              return (
                <button
                  key={k}
                  type="button"
                  disabled={empty}
                  onClick={() => setTab(k)}
                  className="flex-1 py-3 text-[13px] font-extrabold transition disabled:opacity-40"
                  style={{
                    background: active ? 'var(--card)' : 'transparent',
                    color: active ? 'var(--brand-700)' : 'var(--ink-500)',
                    borderBottom: active ? '2px solid var(--brand-700)' : '2px solid transparent',
                  }}
                >
                  {k.toUpperCase()}
                </button>
              )
            })}
          </div>

          <div className="flex flex-col">
            {blocks.map((block) => (
              <div key={block.key} className="px-5 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                    {block.title}
                  </span>
                  {block.tag && <Badge kind="default">{block.tag}</Badge>}
                </div>
                {block.rows.map((row, i) => (
                  <div
                    key={`${block.key}-${i}`}
                    className="flex items-baseline justify-between gap-4 py-1.5"
                    style={row.emphasis === 'total' ? { borderTop: '1px solid var(--border)', marginTop: 4, paddingTop: 8 } : undefined}
                  >
                    <span
                      className="text-[13px]"
                      style={{
                        color: row.emphasis === 'total' ? 'var(--ink-900)' : 'var(--ink-500)',
                        fontWeight: row.emphasis === 'total' ? 800 : 500,
                      }}
                    >
                      {row.label}
                    </span>
                    <span
                      className="text-[13.5px] tabular-nums"
                      style={{ color: rowColor(row.tone), fontWeight: row.emphasis === 'total' ? 800 : 600 }}
                    >
                      {rowValue(row)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-[13px]"
          style={{ background: 'var(--danger-soft, #fdeceb)', color: 'var(--danger)' }}
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {report.canAuthorize && !asking && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={authorize}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] font-extrabold transition hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--brand-700)', color: '#fff' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Autorizar y presentar
          </button>
          <button
            type="button"
            onClick={() => setAsking(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-[14px] font-extrabold transition hover:opacity-90"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          >
            <MessageSquare size={16} /> Tengo una duda
          </button>
        </div>
      )}

      {report.canAuthorize && asking && (
        <form onSubmit={send} className="flex flex-col gap-3">
          <label className="text-[13px] font-bold" style={{ color: 'var(--ink-900)' }}>
            ¿Qué no te cuadra?
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, REPORT_COMMENT_MAX_LENGTH))}
            rows={4}
            autoFocus
            placeholder="Cuéntanos qué revisar de este periodo."
            className="w-full rounded-xl px-4 py-3 text-[13.5px] outline-none"
            style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
              {comment.length}/{REPORT_COMMENT_MAX_LENGTH}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAsking(false)}
                className="px-4 py-2.5 rounded-xl text-[13px] font-bold"
                style={{ background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || comment.trim().length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-extrabold transition hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--brand-700)', color: '#fff' }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Enviar duda
              </button>
            </div>
          </div>
        </form>
      )}

      {!report.canAuthorize && (
        <p className="text-[12.5px] text-center" style={{ color: 'var(--ink-500)' }}>
          Esta declaración ya no está en tu revisión: {report.statusLabel ?? 'sin estatus'}.
        </p>
      )}
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3.5 py-2" style={{ background: 'rgba(255,255,255,.10)' }}>
      <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-300, #9b97b8)' }}>
        {label}
      </span>
      <div className="text-[15px] font-extrabold tabular-nums" style={{ color: '#fff' }}>
        {value}
      </div>
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <div className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
        {label}
      </div>
      <div className="text-[15px] font-extrabold mt-1 tabular-nums" style={{ color: 'var(--ink-900)' }}>
        {value}
      </div>
    </div>
  )
}
