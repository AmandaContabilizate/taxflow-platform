'use client'

import { AlertCircle, Check, History, Loader2, Play, RefreshCw, RotateCcw, Workflow } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  completeProvisioningJob,
  getProviderCallLog,
  getProvisioningQueue,
  retryProvisioningJob,
  runProvisioningCycle,
  runProvisioningJobNow,
} from '@/features/aprovisionamiento/actions/aprovisionamiento.action'
import {
  JOB_ACTIONS,
  JOB_STATUSES,
  type ProviderCallLog,
  type ProvisioningJob,
  type ProvisioningQueue,
  SUBSCRIPTION_STATUSES,
} from '@/features/aprovisionamiento/types'
import { PROVIDERS, providerLabel } from '@/features/productos/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { ProviderLogo } from '../productos/provider-logo'
import { Badge, Card } from '../ui'

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—')

/**
 * Cola de aprovisionamiento de servicios adicionales (spec-servicios-adicionales §5.3). Soporte / TI con
 * Backoffice.AprovisionamientoServicios: tareas manuales con los datos para hacerlas en el proveedor, marcar hechas,
 * reintentar, procesar ahora y bitácora de llamadas.
 */
export function AprovisionamientoScreen() {
  const [queue, setQueue] = useState<ProvisioningQueue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<number | null>(6)
  const [providerFilter, setProviderFilter] = useState<string>('')
  const [busyId, setBusyId] = useState<number | 'cycle' | null>(null)
  const [doneFor, setDoneFor] = useState<ProvisioningJob | null>(null)
  const [externalRef, setExternalRef] = useState('')
  const [logOpen, setLogOpen] = useState(false)
  const [log, setLog] = useState<ProviderCallLog[]>([])
  const [logLoading, setLogLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getProvisioningQueue({ status: statusFilter ?? undefined, provider: providerFilter || undefined })
    if (res.success) setQueue(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [statusFilter, providerFilter])

  useEffect(() => {
    void load()
  }, [load])

  const counts = queue?.counts ?? {}
  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts])

  const patch = (job: ProvisioningJob) =>
    setQueue((q) => (q ? { ...q, items: q.items.map((x) => (x.id === job.id ? job : x)) } : q))

  const act = async (job: ProvisioningJob, kind: 'retry' | 'run') => {
    setBusyId(job.id)
    setNotice(null)
    const res = kind === 'retry' ? await retryProvisioningJob(job.id) : await runProvisioningJobNow(job.id)
    setBusyId(null)
    if (!res.success) return setNotice(res.error.message)
    patch(res.value)
    setNotice(kind === 'retry' ? `Tarea #${job.id} reencolada.` : `Tarea #${job.id}: ${JOB_STATUSES[res.value.status]?.label ?? res.value.status}.`)
    await load()
  }

  const confirmDone = async () => {
    if (!doneFor) return
    setBusyId(doneFor.id)
    const res = await completeProvisioningJob(doneFor.id, externalRef.trim() || null)
    setBusyId(null)
    if (!res.success) return setNotice(res.error.message)
    setDoneFor(null)
    setExternalRef('')
    setNotice(`Tarea #${res.value.id} marcada como hecha. El servicio quedó ${SUBSCRIPTION_STATUSES[res.value.subscriptionStatus]?.toLowerCase() ?? 'actualizado'}.`)
    await load()
  }

  const cycle = async () => {
    setBusyId('cycle')
    setNotice(null)
    const res = await runProvisioningCycle()
    setBusyId(null)
    if (!res.success) return setNotice(res.error.message)
    const r = res.value
    setNotice(`Ciclo: ${r.taken} tomadas · ${r.done} hechas · ${r.manual} manuales · ${r.failed} fallidas · ${r.exhausted} agotadas.`)
    await load()
  }

  const openLog = async () => {
    setLogOpen(true)
    setLogLoading(true)
    const res = await getProviderCallLog({ provider: providerFilter || undefined })
    setLog(res.success ? res.value : [])
    setLogLoading(false)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Modo por proveedor */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>Proveedores</span>
          {PROVIDERS.map((p) => {
            const mode = queue?.providerModes?.[p.id] ?? 'manual'
            return (
              <span key={p.id} className="inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1" style={{ background: 'var(--ink-50)' }}>
                <ProviderLogo providerKey={p.id} size={22} />
                <span className="text-[12.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{p.name}</span>
                <Badge kind={mode === 'api' ? 'brand' : 'amber'}>{mode === 'api' ? 'API' : 'Manual'}</Badge>
              </span>
            )
          })}
          <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Manual: Soporte hace el alta en el portal del proveedor y la marca hecha aquí.</span>
        </div>
      </Card>

      {/* Filtros + acciones */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter(null)}
          className="ui-press rounded-full px-3.5 py-1.5 text-[12.5px] font-bold cursor-pointer"
          style={statusFilter === null ? { background: 'var(--brand-700)', color: '#fff' } : { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
        >
          Todas · {total}
        </button>
        {[6, 4, 5, 1, 2, 3].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className="ui-press rounded-full px-3.5 py-1.5 text-[12.5px] font-bold cursor-pointer"
            style={statusFilter === s ? { background: 'var(--brand-700)', color: '#fff' } : { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            {JOB_STATUSES[s].label} · {counts[String(s)] ?? 0}
          </button>
        ))}
        <select className="h-9 px-3 rounded-xl text-[13px] outline-none" style={inputStyle} value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)} aria-label="Proveedor">
          <option value="">Todos los proveedores</option>
          {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div className="flex-1" />
        <button type="button" onClick={() => void openLog()} className="ui-press inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[13px] cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
          <History size={15} /> Bitácora
        </button>
        <button type="button" disabled={busyId !== null} onClick={() => void cycle()} className="ui-press inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[13px] cursor-pointer disabled:opacity-60" style={{ background: 'var(--brand-700)', color: '#fff' }}>
          {busyId === 'cycle' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Procesar pendientes
        </button>
      </div>

      {notice && (
        <div className="rounded-xl px-4 py-2.5 text-[13px] font-semibold" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>{notice}</div>
      )}

      {loading ? (
        <Card><div className="px-5 py-10 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}><Loader2 size={16} className="animate-spin" /> Cargando cola…</div></Card>
      ) : error ? (
        <Card><div className="px-5 py-8 flex items-center gap-2 text-[13px]" style={{ color: '#E84D4D' }}><AlertCircle size={16} /> {error}</div></Card>
      ) : !queue || queue.items.length === 0 ? (
        <Card>
          <div className="px-5 py-12 flex flex-col items-center text-center gap-2">
            <Workflow size={28} style={{ color: 'var(--ink-300)' }} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Sin tareas con ese filtro</p>
            <p className="text-[12.5px] max-w-md" style={{ color: 'var(--ink-500)' }}>
              Las tareas aparecen cuando un cliente o una empresa contrata un servicio, o cuando se da de baja. Cada 5 minutos el proceso toma las pendientes y las manda al conector del proveedor.
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Tarea', 'Servicio', 'Cliente', 'Paga', 'Estado', 'Intentos', ''].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {queue.items.map((j) => {
                  const st = JOB_STATUSES[j.status] ?? { label: String(j.status), kind: 'default' as const }
                  const manual = j.status === 6
                  const retryable = j.status === 4 || j.status === 5 || j.status === 6
                  return (
                    <tr key={j.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{JOB_ACTIONS[j.action] ?? j.action} <span className="font-semibold" style={{ color: 'var(--ink-400)' }}>#{j.id}</span></div>
                        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{fmtDate(j.createdAt)}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <ProviderLogo providerKey={j.providerKey} size={26} />
                          <div>
                            <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>{j.planName}</div>
                            <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{providerLabel(j.providerKey)} · {money.format(j.priceMxn)} · {SUBSCRIPTION_STATUSES[j.subscriptionStatus] ?? j.subscriptionStatus}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>{j.legalName ?? j.userName ?? j.userEmail ?? j.userId}</div>
                        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                          {j.rfc && <code style={{ ...MONO, fontSize: '11.5px' }}>{j.rfc}</code>}{j.rfc && j.userEmail ? ' · ' : ''}{j.userEmail}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                        {j.payerType === 2 ? (j.payerName ?? 'Empresa') : 'La persona'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge kind={st.kind}>{st.label}</Badge>
                        {j.lastError && <div className="text-[11.5px] mt-1 max-w-[260px]" style={{ color: '#E84D4D' }}>{j.lastError}</div>}
                        {j.externalRef && j.status === 3 && <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>Ref. {j.externalRef}</div>}
                      </td>
                      <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>
                        {j.attempts}{(j.status === 4 || j.status === 1) && <div className="text-[11px]">siguiente {fmtDate(j.nextAttemptAt)}</div>}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {manual && (
                            <button type="button" disabled={busyId !== null} onClick={() => { setDoneFor(j); setExternalRef(j.externalRef ?? '') }} className="ui-press inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[12px] font-bold cursor-pointer disabled:opacity-60" style={{ background: 'var(--brand-700)', color: '#fff' }}>
                              <Check size={13} /> Marcar hecha
                            </button>
                          )}
                          {retryable && (
                            <button type="button" disabled={busyId !== null} onClick={() => void act(j, 'retry')} title="Reencolar para que el conector lo intente" className="ui-press p-1.5 rounded-lg hover:bg-[var(--ink-50)] cursor-pointer disabled:opacity-60" style={{ border: '1px solid var(--border)' }}>
                              {busyId === j.id ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} style={{ color: 'var(--ink-500)' }} />}
                            </button>
                          )}
                          {(j.status === 1 || j.status === 4) && (
                            <button type="button" disabled={busyId !== null} onClick={() => void act(j, 'run')} title="Procesar ahora" className="ui-press p-1.5 rounded-lg hover:bg-[var(--ink-50)] cursor-pointer disabled:opacity-60" style={{ border: '1px solid var(--border)' }}>
                              <Play size={14} style={{ color: 'var(--brand-700)' }} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Marcar hecha */}
      <Modal
        isOpen={!!doneFor}
        onClose={() => setDoneFor(null)}
        title={doneFor ? `${JOB_ACTIONS[doneFor.action]} en ${providerLabel(doneFor.providerKey)}` : ''}
        subtitle={doneFor ? `Tarea #${doneFor.id} · ${doneFor.planName}` : undefined}
        maxWidth={520}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDoneFor(null)} className="ui-press px-4 h-10 rounded-full text-[13px] font-bold cursor-pointer hover:bg-[var(--ink-50)]" style={{ color: 'var(--ink-700)' }}>Cancelar</button>
            <button type="button" disabled={busyId !== null} onClick={() => void confirmDone()} className="ui-press inline-flex items-center gap-2 px-5 h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-60" style={{ background: 'var(--brand-700)', color: '#fff' }}>
              {busyId === doneFor?.id ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Ya está hecha
            </button>
          </div>
        }
      >
        {doneFor && (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-3 text-[13px]" style={{ background: 'var(--ink-50)', color: 'var(--ink-900)' }}>
              <div className="text-[11px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: 'var(--ink-500)' }}>Datos para el alta en {providerLabel(doneFor.providerKey)}</div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt style={{ color: 'var(--ink-500)' }}>RFC</dt><dd><code style={{ ...MONO }}>{doneFor.rfc ?? '—'}</code></dd>
                <dt style={{ color: 'var(--ink-500)' }}>Razón social</dt><dd className="font-semibold">{doneFor.legalName ?? '—'}</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Correo</dt><dd>{doneFor.userEmail ?? '—'}</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Paga</dt><dd>{doneFor.payerType === 2 ? (doneFor.payerName ?? 'Empresa') : 'La persona'}</dd>
              </dl>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ap-ref" className="text-[12.5px] font-bold" style={{ color: 'var(--ink-900)' }}>Referencia en el proveedor</label>
              <input id="ap-ref" className="w-full h-10 px-3 rounded-xl text-[13.5px] outline-none" style={inputStyle} value={externalRef} onChange={(e) => setExternalRef(e.target.value)} placeholder="Id de cuenta, usuario o folio en el proveedor" />
              <p className="text-[11.5px]" style={{ color: 'var(--ink-400)' }}>Opcional, pero ayuda a ubicar la cuenta después. Al confirmar, el servicio queda activo para el cliente.</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Bitácora */}
      <Modal isOpen={logOpen} onClose={() => setLogOpen(false)} title="Bitácora de llamadas al proveedor" subtitle="Solo conectores en modo API; el manual no llama a nadie." maxWidth={760}>
        {logLoading ? (
          <div className="py-6 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}><Loader2 size={16} className="animate-spin" /> Cargando…</div>
        ) : log.length === 0 ? (
          <p className="text-[13px] py-4" style={{ color: 'var(--ink-500)' }}>Sin llamadas registradas todavía.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['Cuándo', 'Proveedor', 'Acción', 'Resultado', 'ms', 'Suscripción'].map((h) => <th key={h} className="py-2 px-2 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>{h}</th>)}</tr></thead>
              <tbody>
                {log.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2 px-2 text-[12px] whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fmtDate(l.at)}</td>
                    <td className="py-2 px-2 text-[12.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{providerLabel(l.providerKey)}</td>
                    <td className="py-2 px-2 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{l.action}</td>
                    <td className="py-2 px-2 text-[12px]">{l.success ? <Badge kind="brand">OK{l.httpStatus ? ` ${l.httpStatus}` : ''}</Badge> : <span style={{ color: '#E84D4D' }}>{l.httpStatus ? `${l.httpStatus} · ` : ''}{l.error ?? 'Error'}</span>}</td>
                    <td className="py-2 px-2 text-[12px] tabular-nums" style={{ color: 'var(--ink-500)' }}>{l.durationMs}</td>
                    <td className="py-2 px-2 text-[12px]" style={{ color: 'var(--ink-500)' }}>{l.subscriptionId ? `#${l.subscriptionId}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  )
}
