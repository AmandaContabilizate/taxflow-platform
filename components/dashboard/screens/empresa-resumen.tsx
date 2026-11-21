'use client'

import { AlertCircle, Building2, CircleDollarSign, Loader2, Plug, ShieldCheck, Users, UserCog, UserRound, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getMyCompanySummary } from '@/features/empresa/actions/getMyCompanySummary.action'
import { getCompanyServices } from '@/features/empresa/actions/services.action'
import { type CompanySummary, type EmpresaError, PERSON_STAGES } from '@/features/empresa/types'
import { EmpBtn, FindingRow, KpiCard, Pill, SectionTitle, fmtMxn } from '../empresa/ui'

/** Embudo: pasos 1 a 9; "Con plan propio" (10) es un estado aparte y se muestra abajo como nota. */
const FUNNEL_STAGES = PERSON_STAGES.filter((s) => s.value <= 9)

const BILLING_MODE_LABEL: Record<number, string> = {
  1: 'Stripe, factura con IVA a la empresa',
  2: 'Transferencia con estado de cuenta mensual',
}

/**
 * Pantalla inicial del portal "Mi empresa" (spec-perfil-empresa §5) con el lenguaje del prototipo: KPI con
 * icono, embudo con barras degradadas, semáforo con puntos de color y tarjetas de hallazgos. La empresa sale
 * del token; un interno con vista de empresa pasa `partnershipId`.
 */
export function EmpresaResumenScreen({ partnershipId }: { partnershipId?: number } = {}) {
  const [summary, setSummary] = useState<CompanySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  // Servicios adicionales: activos y costo del mes (activaciones + servicios) para las tarjetas.
  const [services, setServices] = useState<{ activeServices: number; monthlyServicesCost: number } | null>(null)
  // Las barras del embudo arrancan en 0 y se llenan una vez (600 ms) cuando llegan los datos.
  const [filled, setFilled] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [res, svc] = await Promise.all([getMyCompanySummary(partnershipId), getCompanyServices(partnershipId)])
      if (svc.success) setServices({ activeServices: svc.value.activeServices, monthlyServicesCost: svc.value.monthlyServicesCost })
      if (res.success) setSummary(res.value.resumen)
      else setError(res.error)
    } catch (e) {
      console.error('[EmpresaResumenScreen] getMyCompanySummary falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar tu empresa. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnershipId])

  useEffect(() => {
    if (!summary) return
    const id = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(id)
  }, [summary])

  if (loading) {
    return <div className="emp-card emp-empty flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Cargando tu empresa…</div>
  }

  if (error || !summary) {
    const noCompany = error?.errorCode === 'NO_COMPANY'
    return (
      <div className="emp-card emp-empty">
        <AlertCircle size={28} />
        <div className="max-w-[420px] mx-auto mb-3">
          {noCompany
            ? 'Tu usuario no está ligado a ninguna empresa. Pide a Contabilízate que lo vincule a tu alianza.'
            : (error?.message ?? 'No pudimos cargar tu empresa.')}
        </div>
        {!noCompany && <EmpBtn kind="ghost" small onClick={() => void load()}>Reintentar</EmpBtn>}
      </div>
    )
  }

  const title = summary.legalName?.trim() || summary.name
  // Tolerante a un backend sin el bloque de etapas/semáforo (p. ej. instancia vieja de Procedures).
  const stageCounts = summary.stageCounts ?? {}
  const semaforo = summary.semaforo ?? { enOrden: 0, conObservaciones: 0, riesgoAlto: 0, sinDatos: 0, sinAutorizacion: 0 }
  const activated = stageCounts['9'] ?? 0
  const ready = stageCounts['8'] ?? 0

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <div className="emp-card flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'var(--emp-purple-bg)', color: 'var(--emp-purple)' }}>
            <Building2 size={22} />
          </div>
          <div className="min-w-0">
            <div className="text-[18px] font-extrabold tracking-tight truncate" style={{ color: 'var(--ink-900)' }}>{title}</div>
            <div className="text-[12.5px] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--ink-500)' }}>
              <span className="emp-mono">{summary.code}</span>
              {summary.rfc && <span>RFC {summary.rfc}</span>}
              {summary.legalName && summary.legalName !== summary.name && <span>Alianza {summary.name}</span>}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {summary.hasProfile ? (
            <Pill tone={summary.isActive ? 'green' : 'gray'}>{summary.isActive ? 'Empresa activa' : 'Empresa inactiva'}</Pill>
          ) : (
            <Pill tone="amber">Perfil pendiente en Contabilízate</Pill>
          )}
          {summary.hasSso && <Pill tone="blue">Entrada por SSO</Pill>}
          {summary.autoApproveBatches && <Pill tone="purple">Lotes automáticos</Pill>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard dark label="En seguimiento fiscal" value={summary.personsCount} foot={`${activated} activada${activated === 1 ? '' : 's'} · ${ready} por activar`} icon={<Users size={15} />} />
        <KpiCard label="Personas ligadas" value={summary.linkedUsersCount} foot={summary.hasSso ? 'Entraron desde tu plataforma' : 'Usuarios de tu empresa'} icon={<Zap size={15} />} />
        <KpiCard label="Administradores" value={summary.adminsCount} foot="Pueden dar de alta usuarios" icon={<UserCog size={15} />} />
        <KpiCard label="Tope mensual" value={summary.maxActivationsPerMonth != null ? summary.maxActivationsPerMonth : '∞'} foot={summary.maxActivationsPerMonth != null ? 'Activaciones por mes' : 'Sin tope de activaciones'} icon={<CircleDollarSign size={15} />} />
        {services && (
          <>
            <KpiCard label="Servicios activos" value={services.activeServices} foot="Timbrame, Venvers y Doc2Sign que paga tu empresa" icon={<Plug size={15} />} />
            <KpiCard label="Servicios al mes" value={fmtMxn(services.monthlyServicesCost, 2)} foot="Entra al estado de cuenta junto con las activaciones" icon={<CircleDollarSign size={15} />} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Embudo por etapa (paso 6): cuántas personas van en cada paso, de Cargada a Activada. */}
        <div className="emp-card">
          <SectionTitle sub="Cuántas personas han llegado al menos a cada paso">Embudo de incorporación</SectionTitle>
          {summary.personsCount === 0 ? (
            <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Aún no hay personas. Empieza en Personas con una carga o una invitación.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {FUNNEL_STAGES.map((s) => {
                const reached = FUNNEL_STAGES.filter((x) => x.value >= s.value).reduce((acc, x) => acc + (stageCounts[String(x.value)] ?? 0), 0)
                const pct = summary.personsCount > 0 ? Math.round((reached / summary.personsCount) * 100) : 0
                return (
                  <div key={s.value}>
                    <div className="flex items-center justify-between text-[13px] font-bold mb-1.5" style={{ color: 'var(--ink-900)' }}>
                      <span>{s.label}</span>
                      <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>{reached} · {pct}%</span>
                    </div>
                    <div className="emp-bar-track">
                      <div className={`emp-bar-fill${s.value === 9 ? ' is-turq' : ''}`} style={{ width: filled ? `${pct}%` : '0%' }} />
                    </div>
                  </div>
                )
              })}
              {(stageCounts['10'] ?? 0) > 0 && (
                <div className="emp-note">Con plan propio: {stageCounts['10']} · ya pagan su plan; entran a la cola cuando venza.</div>
              )}
            </div>
          )}
        </div>

        {/* Semáforo fiscal: solo cuenta a quien autorizó compartir su diagnóstico. */}
        <div className="emp-card">
          <SectionTitle sub="Según el puntaje de cumplimiento de cada persona">Estado fiscal del ecosistema</SectionTitle>
          <FindingRow dot="green" label={<span>En orden <span className="font-medium" style={{ color: 'var(--ink-400)' }}>· puntaje de 50 o más</span></span>} value={semaforo.enOrden} />
          <FindingRow dot="amber" label={<span>Con observaciones <span className="font-medium" style={{ color: 'var(--ink-400)' }}>· entre 25 y 49</span></span>} value={semaforo.conObservaciones} />
          <FindingRow dot="red" label={<span>Riesgo alto <span className="font-medium" style={{ color: 'var(--ink-400)' }}>· menor a 25</span></span>} value={semaforo.riesgoAlto} />
          <FindingRow dot="blue" label={<span>Sin datos aún <span className="font-medium" style={{ color: 'var(--ink-400)' }}>· sin declaraciones evaluables</span></span>} value={semaforo.sinDatos} />
          <FindingRow label={<span>Sin autorización <span className="font-medium" style={{ color: 'var(--ink-400)' }}>· solo ves su etapa</span></span>} value={semaforo.sinAutorizacion} />
        </div>

        <div className="emp-card">
          <SectionTitle>Condiciones con Contabilízate</SectionTitle>
          <FindingRow label="Cobro" value={BILLING_MODE_LABEL[summary.billingMode] ?? '—'} />
          <FindingRow label="Presupuesto mensual" value={summary.monthlyBudgetMxn == null ? 'Sin tope' : fmtMxn(summary.monthlyBudgetMxn)} />
          <FindingRow label="Precios pactados" value={summary.pricesCount > 0 ? `${summary.pricesCount} plan${summary.pricesCount === 1 ? '' : 'es'} con precio especial` : 'Precio de lista'} />
        </div>

        <div className="emp-card">
          <SectionTitle>Tu contacto en Contabilízate</SectionTitle>
          {summary.accountExecutiveName ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--emp-surface-2)', color: 'var(--emp-purple)' }}>
                <UserRound size={18} />
              </div>
              <div>
                <div className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>{summary.accountExecutiveName}</div>
                <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Ejecutivo de cuenta</div>
              </div>
            </div>
          ) : (
            <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Aún no tienes ejecutivo de cuenta asignado.</div>
          )}
          <div className="flex items-start gap-2 text-[12.5px] mt-4" style={{ color: 'var(--ink-500)' }}>
            <ShieldCheck size={15} className="shrink-0 mt-[1px]" style={{ color: 'var(--emp-green)' }} />
            <span>Solo ves información de personas que autorizaron compartirla con tu empresa.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
