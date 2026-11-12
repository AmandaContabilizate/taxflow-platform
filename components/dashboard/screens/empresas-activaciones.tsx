'use client'

import { AlertCircle, Building2, Loader2, RefreshCw, Zap } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { activateCompanyPerson, getActivationQueue } from '@/features/empresa/actions/activations.action'
import type { ActivationCandidate, ActivationPlanOption, CompanyPerson, EmpresaError } from '@/features/empresa/types'
import { billingPeriodLabel } from '@/features/productos/types'
import { MONO } from '../constants'
import { EstadosCuentaPanel } from '../empresa/estados-cuenta'
import { LotesPanel } from '../empresa/lotes-panel'
import { PersonaExpedientePanel } from '../empresa/persona-expediente-panel'
import { Modal } from '../modal'
import { Badge, Btn, Card, Tabs } from '../ui'

const TABS = ['Por activar', 'Lotes', 'Estados de cuenta']

function mxn(v: number): string {
  return v.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
}

/** Renglón etiqueta · valor del resumen de confirmación. */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span style={{ color: 'var(--ink-500)' }}>{label}</span>
      <span className="font-bold text-right" style={{ color: 'var(--ink-900)' }}>{value}</span>
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

/**
 * Cola "Personas de empresa por activar" (spec-perfil-empresa §5.4), backoffice, claim
 * GerenciaComercial.ActivarPersonasEmpresa. Activar = venta a futuro con el cupón 100 % de la alianza, pagada
 * por la empresa; la persona ve su plan "Activado por <Empresa>". Los lotes diarios llegan en el paso 8.
 */
export function EmpresasActivacionesScreen() {
  const [items, setItems] = useState<ActivationCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [planByPerson, setPlanByPerson] = useState<Record<number, number>>({})
  const [busy, setBusy] = useState<number | null>(null)
  const [results, setResults] = useState<Record<number, { ok: boolean; text: string }>>({})
  const [fileFor, setFileFor] = useState<{ person: CompanyPerson; partnershipId: number } | null>(null)
  const [confirmFor, setConfirmFor] = useState<{ candidate: ActivationCandidate; plan: ActivationPlanOption } | null>(null)
  const [tab, setTab] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getActivationQueue()
      if (res.success) {
        setItems(res.value)
        setPlanByPerson((prev) => {
          const next = { ...prev }
          for (const c of res.value) if (!next[c.personId] && c.eligiblePlans[0]) next[c.personId] = c.eligiblePlans[0].planId
          return next
        })
      } else setError(res.error)
    } catch (e) {
      console.error('[EmpresasActivacionesScreen] getActivationQueue falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar la cola. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /** Abre la confirmación propia (antes era window.confirm, que sale como "localhost dice"). */
  const askActivate = (c: ActivationCandidate) => {
    const planId = planByPerson[c.personId]
    const plan = c.eligiblePlans.find((p) => p.planId === planId)
    if (!plan) return
    setConfirmFor({ candidate: c, plan })
  }

  const activate = async (c: ActivationCandidate, plan: ActivationPlanOption) => {
    setConfirmFor(null)
    const planId = plan.planId
    setBusy(c.personId)
    try {
      const res = await activateCompanyPerson(c.partnershipId, c.personId, planId)
      if (res.success) {
        setResults((r) => ({ ...r, [c.personId]: { ok: true, text: `Activada · venta ${res.value.saleId} · ${mxn(res.value.priceMxn ?? 0)}` } }))
        setItems((list) => list.filter((x) => x.personId !== c.personId))
      } else {
        setResults((r) => ({ ...r, [c.personId]: { ok: false, text: res.error.message } }))
      }
    } catch (e) {
      console.error('[EmpresasActivacionesScreen] activateCompanyPerson falló:', e)
      setResults((r) => ({ ...r, [c.personId]: { ok: false, text: 'No pudimos activar. Inténtalo de nuevo.' } }))
    } finally {
      setBusy(null)
    }
  }

  const openFile = (c: ActivationCandidate) => {
    setFileFor({
      partnershipId: c.partnershipId,
      person: {
        id: c.personId, fullName: c.fullName, email: c.email, phone: null, rfcDeclared: c.rfc, relationType: 0, externalId: null,
        city: null, state: null, stage: c.stage, stageUpdatedAt: c.stageUpdatedAt, hasAccount: true, pendingPassword: false, lastInviteChannel: null,
        lastInviteAt: null, inviteAttempts: 0, isActive: true, createdAt: c.stageUpdatedAt, consentScope: null, consentExpiresAt: null,
        rfc: null, hasCsf: null, csfDownloadedAt: null, hasComplianceOpinion: null, complianceOpinionAt: null, score: null, declarationsTotal: null, declarationsPresented: null,
        list69Status: null, list69PublicationDate: null,
      },
    })
  }

  const byCompany = items.reduce<Record<string, ActivationCandidate[]>>((acc, c) => {
    ;(acc[c.companyName] ??= []).push(c)
    return acc
  }, {})
  const failed = Object.entries(results).filter(([, r]) => !r.ok)

  if (tab === 1 || tab === 2) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <Tabs items={TABS} active={tab} onChange={setTab} />
        {tab === 1 ? <LotesPanel /> : <EstadosCuentaPanel mode="backoffice" />}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <Tabs items={TABS} active={tab} onChange={setTab} />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <Zap size={16} />
          {loading ? 'Cargando…' : `${items.length} persona${items.length === 1 ? '' : 's'} lista${items.length === 1 ? '' : 's'} para activar`}
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer disabled:opacity-60" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {failed.length > 0 && (
        <div className="flex flex-col gap-1 text-[13px] px-4 py-3 rounded-xl" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>
          {failed.map(([id, r]) => <div key={id}>{r.text}</div>)}
        </div>
      )}

      {loading ? (
        <Card><div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando cola…</div></Card>
      ) : error ? (
        <Card>
          <div className="py-10 text-center flex flex-col items-center gap-3">
            <AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} />
            <div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error.message}</div>
            <button type="button" onClick={() => void load()} className="px-4 py-2 rounded-full text-[13px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>Reintentar</button>
          </div>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <div className="py-12 text-center flex flex-col items-center gap-3">
            <Zap size={26} style={{ color: 'var(--ink-400)' }} />
            <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>Nadie pendiente por activar</div>
            <p className="text-[13px] max-w-[460px]" style={{ color: 'var(--ink-500)' }}>
              Aquí aparecen las personas de empresas que ya tienen cuenta, CIEC, constancia y autorización vigente, y aún no tienen plan.
            </p>
          </div>
        </Card>
      ) : (
        Object.entries(byCompany).map(([company, list]) => (
          <Card key={company}>
            <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 text-[14px] font-extrabold" style={{ color: 'var(--ink-900)' }}>
                <Building2 size={16} /> {company}
                <span className="text-[12.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>· {list.length}</span>
              </div>
              {list[0].autoApproveBatches && <Badge kind="sky">Lotes automáticos</Badge>}
            </div>
            <div className="overflow-x-auto px-2 py-1">
              <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Persona', 'RFC', 'Régimen', 'Lista desde', 'Plan', 'Precio', ''].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.map((c) => {
                    const planId = planByPerson[c.personId]
                    const plan = c.eligiblePlans.find((p) => p.planId === planId)
                    const r = results[c.personId]
                    return (
                      <tr key={c.personId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="py-3 px-3">
                          <button type="button" onClick={() => openFile(c)} className="text-left text-[13.5px] font-semibold hover:underline cursor-pointer" style={{ color: 'var(--ink-900)' }}>{c.fullName}</button>
                          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{c.email}{c.isRenewal ? ' · renovación' : ''}</div>
                        </td>
                        <td className="py-3 px-3"><code style={{ ...MONO, fontSize: '12px', color: 'var(--ink-700)' }}>{c.rfc ?? '—'}</code></td>
                        <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>{c.regimes.length ? c.regimes.join(', ') : '—'}</td>
                        <td className="py-3 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{formatDate(c.stageUpdatedAt)}</td>
                        <td className="py-3 px-3">
                          {c.eligiblePlans.length === 0 ? (
                            <span className="text-[12.5px]" style={{ color: 'var(--violet-ink)' }}>Sin plan elegible para su régimen</span>
                          ) : (
                            <select value={planId ?? ''} onChange={(e) => setPlanByPerson((m) => ({ ...m, [c.personId]: Number(e.target.value) }))} className="px-2.5 py-1.5 rounded-lg text-[12.5px] outline-none" style={inputStyle} disabled={busy === c.personId}>
                              {c.eligiblePlans.map((p) => <option key={p.planId} value={p.planId}>{p.name}{p.billingPeriod ? ` · ${p.billingPeriod}` : ''}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[13px] whitespace-nowrap" style={{ color: 'var(--ink-900)' }}>
                          {plan ? <>{mxn(plan.priceMxn)}{plan.hasNegotiatedPrice && <span className="text-[11px] ml-1" style={{ color: 'var(--brand-700)' }}>pactado</span>}</> : '—'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {r?.ok ? (
                            <Badge kind="brand">{r.text}</Badge>
                          ) : (
                            <button type="button" disabled={!plan || busy !== null} onClick={() => askActivate(c)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-bold transition hover:opacity-95 cursor-pointer disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                              {busy === c.personId ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Activar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))
      )}

      <PersonaExpedientePanel person={fileFor?.person ?? null} partnershipId={fileFor?.partnershipId} onClose={() => setFileFor(null)} />
      <Modal
        isOpen={confirmFor !== null}
        onClose={() => setConfirmFor(null)}
        title="Activar plan"
        subtitle={confirmFor ? `${confirmFor.candidate.fullName} · ${confirmFor.candidate.companyName}` : undefined}
        maxWidth={520}
        footer={
          <div className="flex justify-end gap-2">
            <Btn kind="ghost" onClick={() => setConfirmFor(null)}>Cancelar</Btn>
            <Btn kind="primary" onClick={() => confirmFor && void activate(confirmFor.candidate, confirmFor.plan)}>
              <Zap size={14} /> Activar
            </Btn>
          </div>
        }
      >
        {confirmFor && (
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl px-4 py-3.5 flex flex-col gap-2" style={{ background: 'var(--card-muted)', border: '1px solid var(--border)' }}>
              <Row label="Plan" value={confirmFor.plan.name} />
              <Row label="Periodo" value={confirmFor.plan.billingPeriod ? billingPeriodLabel(confirmFor.plan.billingPeriod) : '—'} />
              <Row label="Declaraciones incluidas" value={String(confirmFor.plan.futureDeclarations)} />
              <Row
                label="Precio a la empresa"
                value={
                  <>
                    <span style={MONO}>{mxn(confirmFor.plan.priceMxn)}</span>
                    {confirmFor.plan.hasNegotiatedPrice && <span className="text-[11px] font-bold ml-1.5" style={{ color: 'var(--brand-700)' }}>pactado</span>}
                  </>
                }
              />
              {confirmFor.candidate.rfc && <Row label="RFC" value={<span style={MONO}>{confirmFor.candidate.rfc}</span>} />}
            </div>
            <p className="text-[13px] leading-relaxed m-0" style={{ color: 'var(--ink-500)' }}>
              La persona no paga nada: la venta se registra en $0 con el cupón de {confirmFor.candidate.companyName} y el importe entra al estado de cuenta de la empresa en el corte del mes.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}
