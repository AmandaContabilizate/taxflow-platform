'use client'

import { AlertCircle, Check, ExternalLink, FileText, Loader2, Receipt, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  closeCompanyStatements,
  getCompanyStatementDetail,
  getCompanyStatements,
  getMyCompanyStatementDetail,
  getMyCompanyStatements,
  markCompanyStatementPaid,
} from '@/features/empresa/actions/statements.action'
import { STATEMENT_STATUS, type CompanyStatement, type CompanyStatementDetail, type EmpresaError } from '@/features/empresa/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge, Card } from '../ui'

function mxn(v: number): string {
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })
}

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '—'
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime
    ? d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function periodLabel(period: string): string {
  const [y, m] = period.split('-').map(Number)
  if (!y || !m) return period
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
}

const btnGhost = { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' } as const
const btnPrimary = { background: 'var(--primary)', color: 'var(--primary-foreground)' } as const

/**
 * Estados de cuenta mensuales (spec §5.5). `mode="empresa"`: lo que ve la empresa (sus cortes, liga de pago de
 * Stripe o datos de transferencia). `mode="backoffice"`: Finanzas ve todas las empresas, hace el corte y marca pagos.
 */
export function EstadosCuentaPanel({ mode, partnershipId }: { mode: 'empresa' | 'backoffice'; partnershipId?: number }) {
  const [items, setItems] = useState<CompanyStatement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)
  const [period, setPeriod] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = mode === 'empresa' ? await getMyCompanyStatements(partnershipId) : await getCompanyStatements(partnershipId)
      if (res.success) setItems(res.value)
      else setError(res.error)
    } catch (e) {
      console.error('[EstadosCuentaPanel] load falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar los estados de cuenta. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [mode, partnershipId])

  useEffect(() => {
    void load()
  }, [load])

  const close = async () => {
    if (period && !/^\d{4}-\d{2}$/.test(period)) return setNotice('El periodo debe tener formato AAAA-MM.')
    if (!window.confirm(`Hacer el corte ${period ? `de ${period}` : 'del mes anterior'}: se emiten los estados de cuenta y, para empresas con Stripe, se envía la factura. ¿Continuar?`)) return
    setClosing(true)
    setNotice(null)
    try {
      const res = await closeCompanyStatements(period || undefined, partnershipId)
      if (!res.success) return setNotice(res.error.message)
      const r = res.value
      setNotice(`${r.period}: ${r.statementsIssued} estado(s) emitido(s) · ${r.stripeInvoices} factura(s) Stripe · ${r.markedOverdue} vencido(s)${r.details.length ? ` — ${r.details.join(' / ')}` : ''}`)
      await load()
    } catch (e) {
      console.error('[EstadosCuentaPanel] closeCompanyStatements falló:', e)
      setNotice('No pudimos hacer el corte.')
    } finally {
      setClosing(false)
    }
  }

  const pendingTotal = items.filter((s) => s.status === 2 || s.status === 4).reduce((a, s) => a + s.total, 0)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          {mode === 'empresa'
            ? 'Cada mes se emite un estado de cuenta con las activaciones de tu gente. Las bajas no se reembolsan; el plan sigue hasta vencer.'
            : 'Un estado de cuenta por empresa y mes. Stripe envía la factura con IVA; por transferencia, Finanzas marca el pago aquí.'}
          {pendingTotal > 0 && <span className="ml-2 font-bold" style={{ color: 'var(--ink-900)' }}>Pendiente de pago: {mxn(pendingTotal)}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer disabled:opacity-60" style={btnGhost}>
            <RefreshCw size={14} /> Actualizar
          </button>
          {mode === 'backoffice' && (
            <>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="AAAA-MM (vacío = mes anterior)" className="px-3 py-2 rounded-full text-[12.5px] outline-none w-[230px]" style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }} />
              <button type="button" onClick={() => void close()} disabled={closing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
                {closing ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />} Hacer corte
              </button>
            </>
          )}
        </div>
      </div>

      {notice && <div className="text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>{notice}</div>}

      {loading ? (
        <Card><div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando…</div></Card>
      ) : error ? (
        <Card><div className="py-10 text-center flex flex-col items-center gap-3"><AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} /><div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error.message}</div></div></Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Receipt size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>Aún no hay estados de cuenta</div>
            <p className="text-[13px] max-w-[460px]" style={{ color: 'var(--ink-500)' }}>El primero se emite al cerrar el mes con activaciones.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[...(mode === 'backoffice' ? ['Empresa'] : []), 'Periodo', 'Activaciones', 'Subtotal', 'IVA', 'Total', 'Estatus', 'Vence', 'Pago', ''].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const st = STATEMENT_STATUS[s.status] ?? STATEMENT_STATUS[1]
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      {mode === 'backoffice' && <td className="py-3 px-3 text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{s.companyName}</td>}
                      <td className="py-3 px-3 text-[13px] capitalize whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{periodLabel(s.period)}</td>
                      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>{s.activations}</td>
                      <td className="py-3 px-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{mxn(s.subtotal)}</td>
                      <td className="py-3 px-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{mxn(s.vat)}</td>
                      <td className="py-3 px-3 text-[13.5px] font-bold whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{mxn(s.total)}</td>
                      <td className="py-3 px-3"><Badge kind={st.kind}>{st.label}</Badge></td>
                      <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: s.status === 4 ? '#8B1E1E' : 'var(--ink-500)' }}>{formatDate(s.dueAt)}</td>
                      <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>
                        {s.status === 3 ? `${formatDate(s.paidAt)}${s.paymentReference ? ` · ${s.paymentReference}` : ''}` : s.stripeInvoiceUrl ? (
                          <a href={s.stripeInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold hover:underline" style={{ color: 'var(--brand-700)' }}>
                            Pagar / factura <ExternalLink size={12} />
                          </a>
                        ) : s.billingMode === 2 ? 'Transferencia' : '—'}
                      </td>
                      <td className="py-3 px-3">
                        <button type="button" onClick={() => setOpenId(s.id)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold transition cursor-pointer" style={btnGhost}>Detalle</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {openId !== null && <EstadoCuentaModal mode={mode} statementId={openId} partnershipId={partnershipId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  )
}

function EstadoCuentaModal({ mode, statementId, partnershipId, onClose, onChanged }: { mode: 'empresa' | 'backoffice'; statementId: number; partnershipId?: number; onClose: () => void; onChanged: () => Promise<void> }) {
  const [detail, setDetail] = useState<CompanyStatementDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const res = mode === 'empresa' ? await getMyCompanyStatementDetail(statementId, partnershipId) : await getCompanyStatementDetail(statementId)
        if (res.success) setDetail(res.value)
        else setMsg(res.error.message)
      } catch (e) {
        console.error('[EstadoCuentaModal] detalle falló:', e)
        setMsg('No pudimos cargar el estado de cuenta.')
      } finally {
        setLoading(false)
      }
    })()
  }, [mode, statementId, partnershipId])

  const markPaid = async () => {
    const ref = window.prompt('Referencia del pago (opcional):')
    if (ref === null) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await markCompanyStatementPaid(statementId, ref.trim() || null)
      if (!res.success) return setMsg(res.error.message)
      setMsg('Marcado como pagado.')
      await onChanged()
      onClose()
    } catch (e) {
      console.error('[EstadoCuentaModal] markCompanyStatementPaid falló:', e)
      setMsg('No pudimos marcar el pago.')
    } finally {
      setBusy(false)
    }
  }

  const s = detail?.statement
  const st = s ? (STATEMENT_STATUS[s.status] ?? STATEMENT_STATUS[1]) : null

  return (
    <Modal isOpen onClose={onClose} title={s ? `Estado de cuenta · ${periodLabel(s.period)} · ${s.companyName}` : 'Estado de cuenta'} maxWidth={820}>
      {loading || !detail || !s || !st ? (
        <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Activaciones" value={String(s.activations)} />
            <Stat label="Subtotal" value={mxn(s.subtotal)} />
            <Stat label="IVA 16 %" value={mxn(s.vat)} />
            <Stat label="Total" value={mxn(s.total)} strong />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
            <Badge kind={st.kind}>{st.label}</Badge>
            <span>Emitido {formatDate(s.issuedAt)} · vence {formatDate(s.dueAt)}</span>
            {s.paidAt && <span>· pagado {formatDate(s.paidAt, true)}{s.paymentReference ? ` (${s.paymentReference})` : ''}</span>}
            {s.stripeInvoiceUrl && (
              <a href={s.stripeInvoiceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold hover:underline" style={{ color: 'var(--brand-700)' }}>Factura Stripe <ExternalLink size={12} /></a>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-left text-[12.5px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Persona', 'RFC', 'Plan', 'Activada', 'Importe'].map((h) => (
                    <th key={h} className="py-2 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.rows.map((r) => (
                  <tr key={r.activationId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-3"><div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{r.fullName}{r.isRenewal ? <span className="text-[11px] ml-1" style={{ color: 'var(--ink-400)' }}>renovación</span> : null}</div><div style={{ color: 'var(--ink-500)' }}>{r.email}</div></td>
                    <td className="py-2 px-3"><code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-700)' }}>{r.rfc ?? '—'}</code></td>
                    <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{r.planName}</td>
                    <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{formatDate(r.activatedAt)}{r.saleId ? ` · venta ${r.saleId}` : ''}</td>
                    <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{mxn(r.priceMxn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {msg && <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>{msg}</div>}

          {mode === 'backoffice' && s.status !== 3 && (
            <div className="flex justify-end">
              <button type="button" disabled={busy} onClick={() => void markPaid()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Marcar pagado
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: strong ? 'var(--brand-50)' : 'var(--ink-50)', border: `1px solid ${strong ? 'var(--brand-200)' : 'var(--border)'}` }}>
      <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: strong ? 'var(--brand-700)' : 'var(--ink-500)' }}>{label}</div>
      <div className="text-[20px] font-extrabold mt-1" style={{ color: strong ? 'var(--brand-700)' : 'var(--ink-900)' }}>{value}</div>
    </div>
  )
}
