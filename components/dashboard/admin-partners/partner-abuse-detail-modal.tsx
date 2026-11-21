'use client'

import { useCallback, useEffect, useState } from 'react'
import { Ban, Loader2, Lock, RotateCcw, Save } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  getAdminPartnerDetail,
  liftAdminPartnerRestriction,
  restrictAdminPartner,
  setAdminPartnerLimits,
} from '@/features/admin-partners/actions/adminPartners.action'
import type { PartnerAbuseDetail, PartnerAlertType, PartnerRestriction } from '@/features/admin-partners/types'
import { Modal } from '../modal'
import { Badge, type BadgeKind, Btn } from '../ui'

export const ALERT_TYPE_LABEL: Record<PartnerAlertType, string> = {
  OwnerReport: 'Un cliente no reconoció una solicitud',
  ReportRate: 'Porcentaje de denuncias alto',
  LowAcceptance: 'Pocos clientes aceptan',
  ConsentQuotaExceeded: 'Tope de solicitudes',
  ProbeWithoutEmail: 'Altas sin correo (sondeo)',
  NotLinkedLookups: 'Consultas a RFC no ligados',
  InvalidRfcBurst: 'RFC con formato inválido',
  SequentialRfc: 'RFC consecutivos',
}

export const SEVERITY: Record<'Info' | 'Warning' | 'Critical', { label: string; kind: BadgeKind }> = {
  Info: { label: 'Informativa', kind: 'sky' },
  Warning: { label: 'Aviso', kind: 'amber' },
  Critical: { label: 'Grave', kind: 'danger' },
}

const RESTRICTION_LABEL: Record<PartnerRestriction['type'], string> = {
  FullSuspension: 'Suspensión total',
  TaxpayerOnboarding: 'Altas bloqueadas',
}

const REASON_LABEL: Record<PartnerRestriction['reason'], string> = {
  Manual: 'Manual',
  InvalidRfcBurst: 'Automática: RFC inválidos',
  SequentialRfc: 'Automática: RFC consecutivos',
  ConsentQuotaRepeated: 'Automática: tope rebasado varios días',
}

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-MX')

/** Detalle de un aliado en Admin Partners: cifras, umbrales, topes, restricciones y alertas. */
export function PartnerAbuseDetailModal({
  partnershipId,
  onClose,
  onChanged,
}: {
  partnershipId: number
  onClose: () => void
  onChanged: () => void
}) {
  const [detail, setDetail] = useState<PartnerAbuseDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [perDay, setPerDay] = useState('')
  const [perWeek, setPerWeek] = useState('')

  const load = useCallback(async () => {
    const res = await getAdminPartnerDetail(partnershipId)
    if (res.success) {
      setDetail(res.value)
      const l = res.value.summary.limits
      setPerDay(l.perDayOverridden ? String(l.perDay) : '')
      setPerWeek(l.perWeekOverridden ? String(l.perWeek) : '')
    } else {
      setError(res.error.message)
    }
  }, [partnershipId])

  useEffect(() => {
    load()
  }, [load])

  async function run(key: string, fn: () => Promise<{ success: boolean; error?: { message: string } }>) {
    setBusy(key)
    setError(null)
    const res = await fn()
    setBusy(null)
    if (res.success) {
      await load()
      onChanged()
    } else {
      setError(res.error?.message ?? 'Ocurrió un error.')
    }
  }

  function askNotes(question: string): string | null {
    const notes = window.prompt(question, '')
    if (notes === null) return null
    if (notes.trim().length < 5) {
      setError('Escriba el motivo (mínimo 5 caracteres).')
      return null
    }
    return notes.trim()
  }

  const s = detail?.summary
  const t = detail?.thresholds
  const active = detail?.restrictions.filter((r) => !r.liftedAt) ?? []

  return (
    <Modal isOpen onClose={onClose} title={s?.name ?? 'Aliado'} subtitle="Admin Partners" maxWidth={860}>
      {!detail ? (
        error ? (
          <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>{error}</div>
        ) : (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando…
          </div>
        )
      ) : (
        <div className="flex flex-col gap-5">
          {error && <div className="text-[13px] font-semibold" style={{ color: 'var(--violet-ink)' }}>{error}</div>}

          {/* Estado + acciones */}
          <section className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-2 flex-wrap">
              {s!.fullySuspended ? <Badge kind="danger">API suspendida</Badge> : s!.onboardingBlocked ? <Badge kind="amber">Altas bloqueadas</Badge> : <Badge kind="brand">API activa</Badge>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {!s!.onboardingBlocked && !s!.fullySuspended && (
                <Btn
                  kind="ghost"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    const notes = askNotes('Motivo para bloquear las altas e invitaciones (seguirá pudiendo consultar):')
                    if (notes) void run('block', () => restrictAdminPartner(partnershipId, 'block-onboarding', notes))
                  }}
                >
                  {busy === 'block' ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />} Bloquear altas
                </Btn>
              )}
              {!s!.fullySuspended && (
                <Btn
                  kind="ghost"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    const notes = askNotes('Motivo para suspender TODA la API del aliado (todas sus llamadas responderán 403):')
                    if (notes) void run('suspend', () => restrictAdminPartner(partnershipId, 'suspend', notes))
                  }}
                >
                  {busy === 'suspend' ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Suspender API
                </Btn>
              )}
            </div>
          </section>

          {active.length > 0 && (
            <section className="flex flex-col gap-2">
              {active.map((r) => (
                <div key={r.id} className="rounded-xl px-4 py-3 flex items-start justify-between gap-3" style={{ background: 'var(--amber-soft)' }}>
                  <div className="text-[13px]" style={{ color: 'var(--violet-ink)' }}>
                    <div className="font-bold">{RESTRICTION_LABEL[r.type]} · {REASON_LABEL[r.reason]}</div>
                    <div>{r.notes}</div>
                    <div className="text-[12px] opacity-80">Desde {fechaHora(r.createdAt)}</div>
                  </div>
                  <Btn
                    kind="ghost"
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => {
                      const notes = askNotes('Motivo de la reactivación:')
                      if (notes) void run(`lift-${r.id}`, () => liftAdminPartnerRestriction(partnershipId, r.id, notes))
                    }}
                  >
                    {busy === `lift-${r.id}` ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />} Reactivar
                  </Btn>
                </div>
              ))}
            </section>
          )}

          {/* Cifras */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Metric label="Ligas activas" value={s!.activeLinks} />
            <Metric label="Solicitudes 24 h" value={`${s!.consentRequests24h} / ${s!.limits.perDay}`} />
            <Metric label="Solicitudes 7 días" value={`${s!.consentRequests7d} / ${s!.limits.perWeek}`} />
            <Metric label="Llamadas 24 h" value={s!.requests24h} />
            <Metric label="Aceptadas 7 d" value={s!.accepted7d} hint={s!.acceptancePercent7d != null ? `${s!.acceptancePercent7d}%` : undefined} />
            <Metric label="Rechazadas 7 d" value={s!.rejected7d} />
            <Metric label="No reconocidas 7 d" value={s!.reported7d} />
            <Metric label="Vencidas 7 d" value={s!.expired7d} />
            <Metric label="Denuncias 30 d" value={`${s!.reported30d} de ${s!.responded30d}`} hint={s!.reportRatePercent30d != null ? `${s!.reportRatePercent30d}%` : undefined} />
            <Metric label="RFC inválidos 24 h" value={s!.invalidRfc24h} hint={`suspende en ${t!.invalidRfcPerDay}`} />
            <Metric label="No ligados 24 h" value={s!.notLinked24h} hint={`aviso ${t!.notLinkedLookupsPerHour}/h`} />
            <Metric label="Altas sin correo 24 h" value={s!.probeWithoutEmail24h} hint={`aviso ${t!.probeWithoutEmailPerDay}`} />
          </section>

          {/* Topes */}
          <section className="flex flex-col gap-2">
            <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Topes de solicitudes de consentimiento</div>
            <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
              Vacío = default de configuración ({t!.consentRequestsPerDay} por día / {t!.consentRequestsPerWeek} por semana). Rebasarlo{' '}
              {t!.quotaExceededDaysToBlockOnboarding} días en {t!.quotaExceededWindowDays} bloquea las altas.
            </div>
            <div className="flex items-end gap-2 flex-wrap">
              <label className="flex flex-col gap-1 text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
                Por día
                <Input type="number" min={0} value={perDay} onChange={(e) => setPerDay(e.target.value)} className="w-28" placeholder={String(t!.consentRequestsPerDay)} />
              </label>
              <label className="flex flex-col gap-1 text-[12px] font-bold" style={{ color: 'var(--ink-500)' }}>
                Por semana
                <Input type="number" min={0} value={perWeek} onChange={(e) => setPerWeek(e.target.value)} className="w-28" placeholder={String(t!.consentRequestsPerWeek)} />
              </label>
              <Btn
                kind="primary"
                size="sm"
                disabled={busy !== null}
                onClick={() =>
                  void run('limits', () =>
                    setAdminPartnerLimits(partnershipId, perDay.trim() ? Number(perDay) : null, perWeek.trim() ? Number(perWeek) : null),
                  )
                }
              >
                {busy === 'limits' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Guardar topes
              </Btn>
            </div>
          </section>

          {/* Alertas del aliado */}
          <section className="flex flex-col gap-2">
            <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Alertas</div>
            {detail.alerts.length === 0 ? (
              <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Sin alertas.</div>
            ) : (
              detail.alerts.slice(0, 50).map((a) => (
                <div key={a.id} className="text-[13px] flex flex-col gap-0.5 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge kind={SEVERITY[a.severity].kind}>{SEVERITY[a.severity].label}</Badge>
                    <span className="font-bold" style={{ color: 'var(--ink-900)' }}>{ALERT_TYPE_LABEL[a.type]}</span>
                    <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                      {fechaHora(a.lastSeenAt)} · {a.status === 'Open' ? 'Abierta' : a.status === 'Reviewed' ? 'Revisada' : 'Descartada'}
                    </span>
                  </div>
                  <div style={{ color: 'var(--ink-700)' }}>{a.summary}</div>
                </div>
              ))
            )}
          </section>

          {/* Historial de restricciones */}
          {detail.restrictions.some((r) => r.liftedAt) && (
            <section className="flex flex-col gap-1">
              <div className="text-[13px] font-extrabold" style={{ color: 'var(--ink-900)' }}>Historial de restricciones</div>
              {detail.restrictions.filter((r) => r.liftedAt).map((r) => (
                <div key={r.id} className="text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                  {RESTRICTION_LABEL[r.type]} ({REASON_LABEL[r.reason]}) · {fechaHora(r.createdAt)} → reactivada {fechaHora(r.liftedAt!)}
                  {r.liftNotes ? ` · ${r.liftNotes}` : ''}
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </Modal>
  )
}

function Metric({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-xl px-3 py-2.5" style={{ border: '1px solid var(--border)' }}>
      <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[16px] font-black" style={{ color: 'var(--ink-900)' }}>{value}</div>
      {hint && <div className="text-[11px]" style={{ color: 'var(--ink-500)' }}>{hint}</div>}
    </div>
  )
}
