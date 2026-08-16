'use client'

import { AlertCircle, Check, CheckCircle2, Clock, Loader2, Undo2, UserPlus, X, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  cancelAssignmentRequest,
  reviewAssignmentRequest,
} from '@/features/assignments/actions/createAssignmentRequest.action'
import {
  getAssignmentRequests,
  getUnassignedOperations,
} from '@/features/assignments/actions/getAssignments.action'
import {
  REQUEST_STATUS,
  type AssignmentRequest,
  type UnassignedOperation,
} from '@/features/assignments/types'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { SolicitarAsignacionModal } from '../asignaciones/solicitar-asignacion-modal'
import { Badge, Card, Tabs } from '../ui'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function timeAgo(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hours = Math.floor((Date.now() - d.getTime()) / 3_600_000)
  if (hours < 24) return `hace ${Math.max(hours, 1)} h`
  return `hace ${Math.floor(hours / 24)} d`
}

interface AsignacionesScreenProps {
  /** Administración/Developer: revisa y aprueba; la gerencia solicita y retira. */
  isAdmin?: boolean
}

export function AsignacionesScreen({ isAdmin = false }: AsignacionesScreenProps) {
  const [unassigned, setUnassigned] = useState<UnassignedOperation[]>([])
  const [requests, setRequests] = useState<AssignmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState(isAdmin ? 1 : 0)
  const [requesting, setRequesting] = useState<UnassignedOperation | null>(null)
  const [cancelling, setCancelling] = useState<number | null>(null)
  const [cancelError, setCancelError] = useState<string | null>(null)
  // Revisión de Administración: solicitud en revisión + modo (aprobar/rechazar).
  const [reviewing, setReviewing] = useState<{ request: AssignmentRequest; approve: boolean } | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const withdraw = async (requestId: number) => {
    if (cancelling !== null) return
    setCancelling(requestId)
    setCancelError(null)
    const res = await cancelAssignmentRequest(requestId)
    setCancelling(null)
    if (!res.success) {
      setCancelError(res.error.message)
      return
    }
    void load()
  }

  const openReview = (request: AssignmentRequest, approve: boolean) => {
    setReviewing({ request, approve })
    setReviewNotes('')
    setReviewError(null)
  }

  const submitReview = async () => {
    if (!reviewing || reviewLoading) return
    // El rechazo exige nota: el gerente debe saber por qué (queda visible en su tabla).
    if (!reviewing.approve && reviewNotes.trim().length < 5) return
    setReviewLoading(true)
    setReviewError(null)
    const res = await reviewAssignmentRequest(reviewing.request.id, reviewing.approve, reviewNotes)
    setReviewLoading(false)
    if (!res.success) {
      setReviewError(res.error.message)
      return
    }
    setReviewing(null)
    void load()
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    const [unassignedRes, requestsRes] = await Promise.all([
      getUnassignedOperations(),
      getAssignmentRequests(),
    ])
    if (unassignedRes.success) {
      setUnassigned(unassignedRes.value)
    } else {
      setError(unassignedRes.error.message)
    }
    if (requestsRes.success) setRequests(requestsRes.value)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const stats = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const inMonth = (iso: string | null) => Boolean(iso && iso.slice(0, 7) === currentMonth)
    return {
      unassigned: unassigned.length,
      pending: requests.filter((r) => r.statusId === REQUEST_STATUS.Pending).length,
      approved: requests.filter((r) => r.statusId === REQUEST_STATUS.Approved && inMonth(r.reviewedAt)).length,
      rejected: requests.filter((r) => r.statusId === REQUEST_STATUS.Rejected && inMonth(r.reviewedAt)).length,
    }
  }, [unassigned, requests])

  const summaryCards = [
    { label: 'Sin asignar', value: stats.unassigned, hint: 'Clientes activos sin código', Icon: AlertCircle, color: 'var(--ink-700)' },
    { label: 'Pendientes', value: stats.pending, hint: 'Esperando Administración', Icon: Clock, color: '#7B5312' },
    { label: 'Aprobadas (mes)', value: stats.approved, hint: 'Aplicadas al propietario', Icon: CheckCircle2, color: 'var(--brand-700)' },
    { label: 'Rechazadas (mes)', value: stats.rejected, hint: 'Con nota de revisión', Icon: XCircle, color: '#9E3A15' },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c) => (
          <Card key={c.label}>
            <div className="flex items-start gap-3 p-5">
              <c.Icon size={18} style={{ color: c.color }} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-400)' }}>
                  {c.label}
                </div>
                <div className="text-[26px] font-bold leading-tight" style={{ color: 'var(--ink-900)' }}>
                  {loading ? '—' : c.value}
                </div>
                <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{c.hint}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Tabs
        items={[`Sin asignar (${stats.unassigned})`, `Solicitudes (${requests.length})`]}
        active={tab}
        onChange={setTab}
      />

      {loading ? (
        <Card>
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando asignaciones…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle size={22} style={{ color: '#9E3A15' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error}</div>
            <button
              type="button"
              onClick={() => void load()}
              className="px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >
              Reintentar
            </button>
          </div>
        </Card>
      ) : tab === 0 ? (
        <Card>
          <div className="px-5 pt-5 pb-3">
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>
              Clientes sin vendedor asignado
            </div>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
              Estos clientes entraron al sistema sin código de vendedor. Solicita a Administración
              asignar la venta al ejecutivo que la generó.
            </p>
          </div>
          {unassigned.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center gap-2 text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              <CheckCircle2 size={22} style={{ color: 'var(--brand-700)' }} />
              No hay operaciones sin asignar
            </div>
          ) : (
            <div className="overflow-x-auto px-2 py-2">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'Tipo', 'Producto', 'Monto neto', 'Ingresó', 'Acción'].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unassigned.map((op) => (
                    <tr key={op.operationId} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-3">
                        <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {op.clientName ?? '—'}
                        </div>
                        <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-500)' }}>{op.rfc}</code>
                      </td>
                      <td className="py-3 px-3"><Badge kind="default">{op.operationType}</Badge></td>
                      <td className="py-3 px-3 text-[12.5px] max-w-[220px]" style={{ color: 'var(--ink-700)' }}>
                        {op.products || '—'}
                      </td>
                      <td className="py-3 px-3 text-[13px] font-semibold" style={{ ...MONO, color: 'var(--ink-900)' }}>
                        {money.format(op.amountNet)}
                      </td>
                      <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                        {timeAgo(op.saleDate)}
                      </td>
                      <td className="py-3 px-3">
                        {op.hasPendingRequest ? (
                          <Badge kind="amber">Solicitud pendiente</Badge>
                        ) : isAdmin ? (
                          <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>
                            Sin solicitud del gerente
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setRequesting(op)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12.5px] font-bold transition hover:opacity-95 cursor-pointer"
                            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                          >
                            <UserPlus size={13} /> Asignar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          {cancelError && (
            <div className="m-3 p-3 rounded-lg text-[12.5px]" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}>
              {cancelError}
            </div>
          )}
          {requests.length === 0 ? (
            <div className="py-10 text-center text-[13.5px]" style={{ color: 'var(--ink-500)' }}>
              Aún no has enviado solicitudes
            </div>
          ) : (
            <div className="overflow-x-auto px-2 py-2">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Cliente', 'Reasignar a', 'Motivo', 'Estatus', 'Enviada', ''].map((h, i) => (
                      <th key={`${h}-${i}`} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="py-3 px-3">
                        <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>
                          {r.clientName ?? '—'}
                        </div>
                        <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-500)' }}>{r.rfc}</code>
                      </td>
                      <td className="py-3 px-3 text-[13px]" style={{ color: 'var(--ink-700)' }}>
                        {r.proposedExecutiveName}
                      </td>
                      <td className="py-3 px-3 text-[12.5px] max-w-[260px]" style={{ color: 'var(--ink-600)' }}>
                        {r.reason}
                        {r.statusId === REQUEST_STATUS.Rejected && r.reviewNotes && (
                          <div className="mt-1 text-[12px]" style={{ color: '#9E3A15' }}>
                            Administración: {r.reviewNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          kind={
                            r.statusId === REQUEST_STATUS.Approved
                              ? 'brand'
                              : r.statusId === REQUEST_STATUS.Rejected
                                ? 'coral'
                                : r.statusId === REQUEST_STATUS.Cancelled
                                  ? 'default'
                                  : 'amber'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                        {timeAgo(r.createdAt)}
                      </td>
                      <td className="py-3 px-3">
                        {r.statusId === REQUEST_STATUS.Pending && (
                          isAdmin ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openReview(r, true)}
                                aria-label={`Aprobar solicitud de ${r.clientName ?? r.rfc}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition hover:opacity-95 cursor-pointer"
                                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                              >
                                <Check size={12} /> Aprobar
                              </button>
                              <button
                                type="button"
                                onClick={() => openReview(r, false)}
                                aria-label={`Rechazar solicitud de ${r.clientName ?? r.rfc}`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors hover:bg-[var(--ink-50)] cursor-pointer"
                                style={{ border: '1px solid var(--border)', color: '#9E3A15' }}
                              >
                                <X size={12} /> Rechazar
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void withdraw(r.id)}
                              disabled={cancelling !== null}
                              aria-label={`Retirar solicitud de ${r.clientName ?? r.rfc}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold transition-colors hover:bg-[var(--ink-50)] cursor-pointer disabled:opacity-50"
                              style={{ border: '1px solid var(--border)', color: 'var(--ink-700)' }}
                            >
                              {cancelling === r.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <Undo2 size={12} />
                              )}
                              Retirar
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <SolicitarAsignacionModal
        operation={requesting}
        onClose={() => setRequesting(null)}
        onSent={() => void load()}
      />

      {/* Revisión de Administración: aprobar aplica el propietario; rechazar exige nota */}
      {reviewing && (
        <Modal
          isOpen
          onClose={() => setReviewing(null)}
          title={reviewing.approve ? 'Aprobar asignación' : 'Rechazar solicitud'}
        >
          <div className="flex flex-col gap-4">
            {reviewError && (
              <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--coral-soft)', color: '#9E3A15' }}>
                {reviewError}
              </div>
            )}

            <div
              className="p-3.5 rounded-xl text-[13px] flex flex-col gap-1"
              style={{ background: 'var(--ink-50)', color: 'var(--ink-700)' }}
            >
              <div>
                Cliente: <b style={{ color: 'var(--ink-900)' }}>{reviewing.request.clientName ?? reviewing.request.rfc}</b>{' '}
                <code style={{ ...MONO, fontSize: '11.5px', color: 'var(--ink-500)' }}>{reviewing.request.rfc}</code>
              </div>
              <div>
                Solicitó: <b style={{ color: 'var(--ink-900)' }}>{reviewing.request.requestedByName}</b> · propone a{' '}
                <b style={{ color: 'var(--ink-900)' }}>{reviewing.request.proposedExecutiveName}</b>
              </div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                Motivo: “{reviewing.request.reason}”
              </div>
            </div>

            {reviewing.approve ? (
              <p className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
                Al aprobar, la operación pasa a ser propiedad de{' '}
                <b>{reviewing.request.proposedExecutiveName}</b> (con bitácora del cambio) y el
                cliente queda ligado a ese vendedor para futuras compras.
              </p>
            ) : (
              <p className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
                El rechazo regresa la operación a la cola y el gerente verá tu nota en su tabla
                de solicitudes.
              </p>
            )}

            <div>
              <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>
                Nota de revisión{' '}
                <span className="font-normal" style={{ color: 'var(--ink-400)' }}>
                  {reviewing.approve ? '(opcional)' : '(requerida, mínimo 5 caracteres)'}
                </span>
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={2}
                placeholder={reviewing.approve ? 'Comentario para la bitácora…' : 'Explica por qué se rechaza…'}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] outline-none focus:ring-2 resize-y"
                style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                disabled={reviewLoading}
              />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setReviewing(null)}
                disabled={reviewLoading}
                className="px-5 py-2.5 rounded-full font-bold text-[13.5px] transition cursor-pointer"
                style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitReview()}
                disabled={reviewLoading || (!reviewing.approve && reviewNotes.trim().length < 5)}
                className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
                style={
                  reviewing.approve
                    ? { background: 'var(--primary)', color: 'var(--primary-foreground)' }
                    : { background: 'var(--coral)', color: '#FFFFFF' }
                }
              >
                {reviewLoading ? <Loader2 size={15} className="animate-spin" /> : reviewing.approve ? <Check size={15} /> : <X size={15} />}
                {reviewing.approve ? 'Aprobar asignación' : 'Rechazar solicitud'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
