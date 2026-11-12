'use client'

import { AlertCircle, Check, Layers, Loader2, Play, RefreshCw, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  approveCompanyBatch,
  cancelCompanyBatch,
  getCompanyBatchDetail,
  getCompanyBatches,
  proposeCompanyBatches,
  retryCompanyBatch,
  runCompanyBatch,
} from '@/features/empresa/actions/batches.action'
import { BATCH_STATUS, type CompanyBatch, type CompanyBatchDetail, type EmpresaError } from '@/features/empresa/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge, Card } from '../ui'

const ROW_STATUS: Record<number, { label: string; kind: 'default' | 'brand' | 'amber' | 'coral' }> = {
  0: { label: 'Pendiente', kind: 'amber' },
  1: { label: 'Activada', kind: 'brand' },
  2: { label: 'Fallida', kind: 'coral' },
  3: { label: 'Excluida', kind: 'default' },
}

function mxn(v: number): string {
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

function formatDate(iso: string | null, withTime = false): string {
  if (!iso) return '—'
  const d = new Date(iso.endsWith('Z') || iso.length <= 10 ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime
    ? d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

const btnGhost = { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' } as const
const btnPrimary = { background: 'var(--primary)', color: 'var(--primary-foreground)' } as const

/**
 * Lotes diarios de activación (spec §5.4): el job propone un lote por empresa; el gerente aprueba (puede quitar
 * personas), ejecuta con avance y reintenta fallidas. Las empresas en modo automático nacen aprobadas.
 */
export function LotesPanel() {
  const [items, setItems] = useState<CompanyBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [proposing, setProposing] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCompanyBatches()
      if (res.success) setItems(res.value)
      else setError(res.error)
    } catch (e) {
      console.error('[LotesPanel] getCompanyBatches falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar los lotes. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const propose = async () => {
    setProposing(true)
    setNotice(null)
    try {
      const res = await proposeCompanyBatches()
      if (!res.success) return setNotice(res.error.message)
      const r = res.value
      setNotice(`${r.batchesCreated} lote(s) nuevo(s) · ${r.personsProposed} personas para activar · ${r.personsExcluded} excluidas${r.batchesAutoApproved ? ` · ${r.batchesAutoApproved} en automático` : ''}${r.details.length ? ` — ${r.details.join(' / ')}` : ''}`)
      await load()
    } catch (e) {
      console.error('[LotesPanel] proposeCompanyBatches falló:', e)
      setNotice('No pudimos proponer los lotes.')
    } finally {
      setProposing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          El job propone un lote por empresa cada mañana. Aquí los apruebas, los ejecutas y reintentas fallidas.
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer disabled:opacity-60" style={btnGhost}>
            <RefreshCw size={14} /> Actualizar
          </button>
          <button type="button" onClick={() => void propose()} disabled={proposing} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
            {proposing ? <Loader2 size={14} className="animate-spin" /> : <Layers size={14} />} Proponer lote de hoy
          </button>
        </div>
      </div>

      {notice && <div className="text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>{notice}</div>}

      {loading ? (
        <Card><div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando lotes…</div></Card>
      ) : error ? (
        <Card><div className="py-10 text-center flex flex-col items-center gap-3"><AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} /><div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error.message}</div></div></Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Layers size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>Aún no hay lotes</div>
            <p className="text-[13px] max-w-[460px]" style={{ color: 'var(--ink-500)' }}>Se crean solos cada mañana cuando hay personas listas para activar. También puedes proponer el de hoy ahora.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Fecha', 'Empresa', 'Estatus', 'Personas', 'Estimado', 'Activadas', 'Fallidas', 'Aprobó', ''].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((b) => {
                  const st = BATCH_STATUS[b.status] ?? BATCH_STATUS[1]
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{formatDate(b.batchDate)}</td>
                      <td className="py-3 px-3 text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{b.companyName}</td>
                      <td className="py-3 px-3"><Badge kind={st.kind}>{st.label}</Badge>{b.autoApproved && <span className="text-[11px] ml-1" style={{ color: 'var(--ink-400)' }}>auto</span>}</td>
                      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>{b.personCount}{b.excluded ? <span style={{ color: 'var(--ink-400)' }}> · {b.excluded} excl.</span> : null}</td>
                      <td className="py-3 px-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{mxn(b.estimatedMxn)}</td>
                      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--brand-700)' }}>{b.activated}</td>
                      <td className="py-3 px-3 text-[13px]" style={{ color: b.failed ? '#8B1E1E' : 'var(--ink-500)' }}>{b.failed}</td>
                      <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{b.approvedByName ? `${b.approvedByName} · ${formatDate(b.approvedAt, true)}` : '—'}</td>
                      <td className="py-3 px-3">
                        <button type="button" onClick={() => setOpenId(b.id)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold transition cursor-pointer" style={btnGhost}>
                          {b.status === 1 ? 'Revisar' : 'Ver'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {openId !== null && <LoteModal batchId={openId} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  )
}

function LoteModal({ batchId, onClose, onChanged }: { batchId: number; onClose: () => void; onChanged: () => Promise<void> }) {
  const [detail, setDetail] = useState<CompanyBatchDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [excluded, setExcluded] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getCompanyBatchDetail(batchId)
      if (res.success) setDetail(res.value)
      else setMsg(res.error.message)
    } catch (e) {
      console.error('[LoteModal] getCompanyBatchDetail falló:', e)
      setMsg('No pudimos cargar el lote.')
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    void load()
  }, [load])

  const act = async (key: string, fn: () => Promise<{ success: boolean; error?: EmpresaError; text?: string }>) => {
    setBusy(key)
    setMsg(null)
    try {
      const r = await fn()
      if (!r.success) setMsg(r.error?.message ?? 'No se pudo completar.')
      else if (r.text) setMsg(r.text)
      await load()
      await onChanged()
    } catch (e) {
      console.error(`[LoteModal] ${key} falló:`, e)
      setMsg('No se pudo completar. Inténtalo de nuevo.')
    } finally {
      setBusy(null)
    }
  }

  const approve = () => act('aprobar', async () => {
    const res = await approveCompanyBatch(batchId, [...excluded])
    return res.success ? { success: true, text: 'Lote aprobado. Ya puedes ejecutarlo.' } : { success: false, error: res.error }
  })
  const cancel = () => {
    if (!window.confirm('¿Cancelar el lote? Las personas pendientes quedan excluidas y volverán a proponerse mañana.')) return
    void act('cancelar', async () => {
      const res = await cancelCompanyBatch(batchId)
      return res.success ? { success: true, text: 'Lote cancelado.' } : { success: false, error: res.error }
    })
  }
  const run = () => act('ejecutar', async () => {
    const res = await runCompanyBatch(batchId)
    if (!res.success) return { success: false, error: res.error }
    const a = res.value
    return { success: true, text: `${a.activated} activadas · ${a.failed} fallidas · ${a.remaining} pendientes${a.timeBudgetExceeded ? ' — pulsa Continuar para seguir' : ''}` }
  })
  const retry = () => act('reintentar', async () => {
    const res = await retryCompanyBatch(batchId)
    return res.success ? { success: true, text: `${res.value} fila(s) vuelven a pendiente. Ejecuta el lote otra vez.` } : { success: false, error: res.error }
  })

  const b = detail?.batch
  const st = b ? (BATCH_STATUS[b.status] ?? BATCH_STATUS[1]) : null
  const title = b ? `Lote ${formatDate(b.batchDate)} · ${b.companyName}` : 'Lote'

  return (
    <Modal isOpen onClose={onClose} title={title} maxWidth={820}>
      {loading || !detail || !b || !st ? (
        <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando lote…</div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px]" style={{ color: 'var(--ink-700)' }}>
            <Badge kind={st.kind}>{st.label}</Badge>
            <span>{b.personCount} persona{b.personCount === 1 ? '' : 's'} · {mxn(b.estimatedMxn)} estimado</span>
            <span style={{ color: 'var(--ink-500)' }}>· {b.activated} activadas · {b.failed} fallidas · {b.pending} pendientes · {b.excluded} excluidas</span>
          </div>

          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-left text-[12.5px]" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {b.status === 1 && <th className="py-2 px-3 w-8" />}
                  {['Persona', 'RFC', 'Plan', 'Precio', 'Estatus', 'Detalle'].map((h) => (
                    <th key={h} className="py-2 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detail.rows.map((r) => {
                  const rs = ROW_STATUS[r.status] ?? ROW_STATUS[0]
                  const out = excluded.has(r.personId)
                  return (
                    <tr key={r.activationId} style={{ borderBottom: '1px solid var(--border)', opacity: r.status === 3 || out ? 0.55 : 1 }}>
                      {b.status === 1 && (
                        <td className="py-2 px-3">
                          {r.status === 0 && (
                            <input type="checkbox" checked={!out} onChange={() => setExcluded((s) => { const n = new Set(s); if (n.has(r.personId)) n.delete(r.personId); else n.add(r.personId); return n })} className="w-4 h-4 cursor-pointer" aria-label={`Incluir a ${r.fullName}`} />
                          )}
                        </td>
                      )}
                      <td className="py-2 px-3">
                        <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>{r.fullName}{r.isRenewal ? <span className="text-[11px] ml-1" style={{ color: 'var(--ink-400)' }}>renovación</span> : null}</div>
                        <div style={{ color: 'var(--ink-500)' }}>{r.email}</div>
                      </td>
                      <td className="py-2 px-3"><code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-700)' }}>{r.rfc ?? '—'}</code></td>
                      <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{r.planName}</td>
                      <td className="py-2 px-3 whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>{mxn(r.priceMxn)}</td>
                      <td className="py-2 px-3"><Badge kind={rs.kind}>{rs.label}</Badge></td>
                      <td className="py-2 px-3" style={{ color: r.status === 2 ? '#8B1E1E' : 'var(--ink-500)' }}>{r.saleId ? `Venta ${r.saleId} · ${formatDate(r.activatedAt, true)}` : (r.error ?? '')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {msg && <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' }}>{msg}</div>}

          <div className="flex flex-wrap justify-end gap-2">
            {(b.status === 1 || b.status === 2) && (
              <button type="button" disabled={busy !== null} onClick={cancel} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={btnGhost}>
                <X size={15} /> Cancelar lote
              </button>
            )}
            {b.status === 1 && (
              <button type="button" disabled={busy !== null} onClick={() => void approve()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
                {busy === 'aprobar' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Aprobar {b.personCount - excluded.size} · {mxn(detail.rows.filter((r) => r.status === 0 && !excluded.has(r.personId)).reduce((a, r) => a + r.priceMxn, 0))}
              </button>
            )}
            {(b.status === 2 || b.status === 3) && (
              <button type="button" disabled={busy !== null} onClick={() => void run()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
                {busy === 'ejecutar' ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} {b.status === 3 ? 'Continuar' : 'Ejecutar ahora'}
              </button>
            )}
            {b.status === 4 && b.failed > 0 && (
              <button type="button" disabled={busy !== null} onClick={() => void retry()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={btnPrimary}>
                {busy === 'reintentar' ? <Loader2 size={15} className="animate-spin" /> : <RotateCcw size={15} />} Reintentar fallidas
              </button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
