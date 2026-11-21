'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle, Ban, Check, Loader2, ShieldAlert, X } from 'lucide-react'
import {
  getAdminPartnersAlerts,
  getAdminPartnersOverview,
  reviewAdminPartnersAlert,
} from '@/features/admin-partners/actions/adminPartners.action'
import type { PartnerAbuseAlert, PartnerAbuseOverviewRow } from '@/features/admin-partners/types'
import { PartnerAbuseDetailModal, ALERT_TYPE_LABEL, SEVERITY } from '../admin-partners/partner-abuse-detail-modal'
import { Badge, Btn, Card, ErrorState, Tabs } from '../ui'

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-MX')
const pct = (v: number | null) => (v == null ? '—' : `${v}%`)

/**
 * Admin Partners (Backoffice.AdminPartners): vigilancia de la API para aliados. Tablero por aliado (uso,
 * consentimientos, denuncias, sondeos), alertas abiertas y acciones: suspender la API, bloquear altas,
 * reactivar y ajustar topes por aliado.
 */
export function AdminPartnersScreen() {
  const [tab, setTab] = useState(0)
  const [rows, setRows] = useState<PartnerAbuseOverviewRow[]>([])
  const [alerts, setAlerts] = useState<PartnerAbuseAlert[]>([])
  const [alertFilter, setAlertFilter] = useState<'open' | 'all'>('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [busyAlert, setBusyAlert] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const [o, a] = await Promise.all([getAdminPartnersOverview(), getAdminPartnersAlerts(alertFilter)])
    if (o.success) setRows(o.value)
    else setError(o.error.message)
    if (a.success) setAlerts(a.value)
    else setError(a.error.message)
    setLoading(false)
  }, [alertFilter])

  useEffect(() => {
    load()
  }, [load])

  async function review(alert: PartnerAbuseAlert, dismiss: boolean) {
    const notes = window.prompt(dismiss ? 'Motivo para descartar (falso positivo, etc.):' : 'Nota de revisión (opcional):', '')
    if (notes === null) return
    setBusyAlert(alert.id)
    const res = await reviewAdminPartnersAlert(alert.id, dismiss, notes)
    setBusyAlert(null)
    if (res.success) load()
    else setError(res.error.message)
  }

  const suspended = rows.filter((r) => r.fullySuspended).length
  const blocked = rows.filter((r) => r.onboardingBlocked && !r.fullySuspended).length
  const openAlerts = rows.reduce((s, r) => s + r.openAlerts, 0)

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat label="Aliados suspendidos" value={suspended} tone={suspended > 0 ? 'coral' : 'default'} />
        <Stat label="Con altas bloqueadas" value={blocked} tone={blocked > 0 ? 'amber' : 'default'} />
        <Stat label="Alertas abiertas" value={openAlerts} tone={openAlerts > 0 ? 'amber' : 'default'} />
      </div>

      <Tabs items={['Aliados', 'Alertas']} active={tab} onChange={setTab} />

      {error && <ErrorState message={error} />}

      {loading ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando…
          </div>
        </Card>
      ) : tab === 0 ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Aliado', 'Estado API', 'Ligas activas', 'Solicitudes 24h / 7d', 'Aceptación 7d', 'Denuncias 30d', 'RFC inválidos 24h', 'No ligados 24h', 'Sin correo 24h', 'Alertas'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-extrabold whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.partnershipId}
                    className="cursor-pointer hover:bg-[var(--ink-50)]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => setSelected(r.partnershipId)}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--ink-900)' }}>{r.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.fullySuspended ? (
                        <Badge kind="danger">Suspendida</Badge>
                      ) : r.onboardingBlocked ? (
                        <Badge kind="amber">Altas bloqueadas</Badge>
                      ) : (
                        <Badge kind="brand">Activa</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">{r.activeLinks}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.consentRequests24h}/{r.limits.perDay} · {r.consentRequests7d}/{r.limits.perWeek}
                    </td>
                    <td className="px-4 py-3">{pct(r.acceptancePercent7d)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.reported30d} de {r.responded30d} · {pct(r.reportRatePercent30d)}
                    </td>
                    <td className="px-4 py-3">{r.invalidRfc24h}</td>
                    <td className="px-4 py-3">{r.notLinked24h}</td>
                    <td className="px-4 py-3">{r.probeWithoutEmail24h}</td>
                    <td className="px-4 py-3">{r.openAlerts > 0 ? <Badge kind="amber">{r.openAlerts}</Badge> : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>Ningún aliado usa todavía la API.</div>
            )}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="px-5 py-3 flex items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <Btn kind={alertFilter === 'open' ? 'primary' : 'ghost'} size="sm" onClick={() => setAlertFilter('open')}>Abiertas</Btn>
            <Btn kind={alertFilter === 'all' ? 'primary' : 'ghost'} size="sm" onClick={() => setAlertFilter('all')}>Todas</Btn>
          </div>
          <div className="flex flex-col">
            {alerts.map((a) => (
              <div key={a.id} className="px-5 py-4 flex flex-col gap-1.5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge kind={SEVERITY[a.severity].kind}>{SEVERITY[a.severity].label}</Badge>
                    <span className="font-bold text-[14px]" style={{ color: 'var(--ink-900)' }}>{ALERT_TYPE_LABEL[a.type]}</span>
                    <button
                      type="button"
                      className="text-[13px] underline"
                      style={{ color: 'var(--ink-700)' }}
                      onClick={() => setSelected(a.partnershipId)}
                    >
                      {a.partnershipName}
                    </button>
                  </div>
                  <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                    {fechaHora(a.lastSeenAt)}
                    {a.occurrences > 1 ? ` · visto ${a.occurrences} veces` : ''}
                  </span>
                </div>
                <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>{a.summary}</div>
                {a.status !== 'Open' ? (
                  <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                    {a.status === 'Dismissed' ? 'Descartada' : 'Revisada'} el {a.reviewedAt ? fechaHora(a.reviewedAt) : '—'}
                    {a.reviewNotes ? ` · ${a.reviewNotes}` : ''}
                  </div>
                ) : (
                  <div className="flex gap-2 justify-end">
                    <Btn kind="ghost" size="sm" onClick={() => review(a, true)} disabled={busyAlert === a.id}>
                      <X size={14} /> Descartar
                    </Btn>
                    <Btn kind="ghost" size="sm" onClick={() => review(a, false)} disabled={busyAlert === a.id}>
                      {busyAlert === a.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Marcar revisada
                    </Btn>
                  </div>
                )}
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--ink-500)' }}>
                {alertFilter === 'open' ? 'No hay alertas abiertas.' : 'Sin alertas registradas.'}
              </div>
            )}
          </div>
        </Card>
      )}

      {selected != null && (
        <PartnerAbuseDetailModal partnershipId={selected} onClose={() => setSelected(null)} onChanged={load} />
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'default' | 'amber' | 'coral' }) {
  const Icon = tone === 'coral' ? Ban : tone === 'amber' ? AlertTriangle : ShieldAlert
  const color = tone === 'coral' ? 'var(--violet-ink)' : tone === 'amber' ? 'var(--violet-ink)' : 'var(--ink-700)'
  const bg = tone === 'coral' ? 'var(--coral-soft, #FDECEC)' : tone === 'amber' ? 'var(--amber-soft)' : 'var(--ink-50)'
  return (
    <Card>
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg, color }}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[22px] font-black" style={{ color: 'var(--ink-900)' }}>{value}</div>
          <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{label}</div>
        </div>
      </div>
    </Card>
  )
}
