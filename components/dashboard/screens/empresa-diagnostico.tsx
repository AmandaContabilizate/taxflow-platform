'use client'

import { AlertCircle, AlertTriangle, ChevronRight, CircleDashed, CircleX, Download, Loader2, ShieldCheck } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { getCompanyList69Summary } from '@/features/empresa/actions/getCompanyList69Summary.action'
import { getCompanyPersons } from '@/features/empresa/actions/getCompanyPersons.action'
import { getMyCompanySummary } from '@/features/empresa/actions/getMyCompanySummary.action'
import { type CompanyList69Summary, type CompanyPerson, type CompanySemaforo, type EmpresaError, stageLabel } from '@/features/empresa/types'
import { PersonaExpedientePanel } from '../empresa/persona-expediente-panel'
import { Avatar, EmpBtn, Pill, type PillTone, SectionTitle, fmtDate, list69Tone, scoreMeta, stageTone } from '../empresa/ui'

/** Más de 3 meses: constancia desactualizada (mismo criterio que la tabla de personas). */
const CSF_FRESH_DAYS = 90
/** Tope de personas que se traen para calcular hallazgos en el navegador. */
const MAX_PERSONS = 500

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime()
  return Number.isNaN(d) ? null : Math.floor((Date.now() - d) / 86_400_000)
}

interface Finding {
  key: string
  label: string
  hint: string
  dot: 'red' | 'amber' | 'blue' | 'green'
  persons: CompanyPerson[]
}

/**
 * Hallazgos calculados con lo que la empresa tiene autorizado ver. Cada uno nombra una fuente real del sistema;
 * lo que el sistema no consulta (adeudos, CSD) no se inventa.
 */
function computeFindings(items: CompanyPerson[]): Finding[] {
  const active = items.filter((p) => p.isActive)
  const has = (p: CompanyPerson, bit: number) => ((p.consentScope ?? 0) & bit) === bit
  const f = (key: string, label: string, hint: string, dot: Finding['dot'], pred: (p: CompanyPerson) => boolean): Finding => ({ key, label, hint, dot, persons: active.filter(pred) })
  return [
    f('lista', 'Coincidencia en la lista 69-B del SAT', 'Su RFC aparece en el listado de operaciones presuntamente inexistentes (SíConf).', 'red', (p) => has(p, 1) && !!p.list69Status),
    f('riesgo', 'Riesgo alto en cumplimiento', 'Puntaje menor a 25: la mayoría de sus declaraciones evaluables están pendientes.', 'red', (p) => has(p, 8) && p.score != null && p.score < 25),
    f('observaciones', 'Con observaciones en cumplimiento', 'Puntaje entre 25 y 49.', 'amber', (p) => has(p, 8) && p.score != null && p.score >= 25 && p.score < 50),
    f('csf-vieja', 'CSF desactualizada', `Constancia con más de ${CSF_FRESH_DAYS} días; conviene que la persona la renueve.`, 'amber', (p) => has(p, 4) && p.hasCsf === true && (daysSince(p.csfDownloadedAt) ?? 0) > CSF_FRESH_DAYS),
    f('sin-csf', 'Sin constancia de situación fiscal', 'Con cuenta pero el robot aún no obtiene su constancia (falta CIEC o está en proceso).', 'blue', (p) => p.hasAccount && has(p, 4) && p.hasCsf === false),
    f('sin-opinion', 'Sin opinión de cumplimiento', 'Aún no se ha obtenido su opinión del SAT.', 'blue', (p) => p.hasAccount && has(p, 2) && p.hasComplianceOpinion === false),
    f('rfc', 'RFC declarado distinto al del SAT', 'El RFC que registró tu empresa no coincide con el de su constancia.', 'amber', (p) => has(p, 1) && !!p.rfc && !!p.rfcDeclared && p.rfc.toUpperCase() !== p.rfcDeclared.toUpperCase()),
    f('sin-diag', 'Sin declaraciones evaluables', 'Autorizó el diagnóstico pero todavía no hay declaraciones sincronizadas con el SAT.', 'blue', (p) => has(p, 8) && p.hasAccount && p.score == null),
    f('sin-auth', 'Sin autorización', 'Retiró su autorización: solo ves su etapa.', 'blue', (p) => p.hasAccount && !p.consentScope),
    f('sin-cuenta', 'Sin cuenta todavía', 'Cargadas o invitadas que aún no entran.', 'blue', (p) => !p.hasAccount),
  ]
}

function csvCell(v: string | number | null | undefined): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const TONE_COLOR: Record<PillTone, string> = {
  green: 'var(--emp-green)',
  amber: 'var(--emp-amber)',
  red: 'var(--emp-red)',
  blue: 'var(--emp-blue)',
  purple: 'var(--emp-purple)',
  gray: 'var(--ink-300)',
}

/**
 * Diagnóstico fiscal (prototipo): semáforo del ecosistema en cuatro tarjetas, listas del SAT (69-B vía SíConf) con
 * dona y desglose, distribución de hallazgos con la lista de personas de cada uno y exportación a CSV. Solo con lo
 * que cada persona autorizó compartir.
 */
export function EmpresaDiagnosticoScreen({ partnershipId }: { partnershipId?: number } = {}) {
  const [semaforo, setSemaforo] = useState<CompanySemaforo | null>(null)
  const [personsCount, setPersonsCount] = useState(0)
  const [items, setItems] = useState<CompanyPerson[]>([])
  const [listas, setListas] = useState<CompanyList69Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [open, setOpen] = useState<string | null>(null)
  const [fileFor, setFileFor] = useState<CompanyPerson | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summary, persons, l69] = await Promise.all([
        getMyCompanySummary(partnershipId),
        getCompanyPersons({ pageSize: MAX_PERSONS, partnershipId }),
        getCompanyList69Summary(partnershipId),
      ])
      if (!summary.success) return setError(summary.error)
      setSemaforo(summary.value.resumen.semaforo ?? { enOrden: 0, conObservaciones: 0, riesgoAlto: 0, sinDatos: 0, sinAutorizacion: 0 })
      setPersonsCount(summary.value.resumen.personsCount)
      setItems(persons.success ? persons.value.items : [])
      setListas(l69.success ? l69.value : null)
    } catch (e) {
      console.error('[EmpresaDiagnosticoScreen] load falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar el diagnóstico. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [partnershipId])

  useEffect(() => {
    void load()
  }, [load])

  const findings = useMemo(() => computeFindings(items), [items])

  const exportCsv = () => {
    const header = ['Nombre', 'Correo', 'RFC', 'Etapa', 'Autorización', 'Puntaje', 'Nivel de riesgo', 'CSF', 'Opinión', 'Lista 69-B', 'Hallazgos']
    const lines = items.filter((p) => p.isActive).map((p) => {
      const found = findings.filter((f) => f.persons.some((q) => q.id === p.id)).map((f) => f.label).join(' · ')
      return [
        p.fullName, p.email, p.rfc ?? p.rfcDeclared ?? '', stageLabel(p.stage), p.consentScope ? `Hasta ${fmtDate(p.consentExpiresAt)}` : 'Sin autorización',
        p.score != null ? Math.round(p.score) : '', p.score != null ? scoreMeta(p.score).label : '',
        p.hasCsf == null ? '' : p.hasCsf ? `Descargada ${fmtDate(p.csfDownloadedAt)}` : 'Sin constancia',
        p.hasComplianceOpinion == null ? '' : p.hasComplianceOpinion ? `Obtenida ${fmtDate(p.complianceOpinionAt)}` : 'Sin opinión',
        p.list69Status ?? (p.rfc ? 'Sin coincidencia' : ''),
        found,
      ].map(csvCell).join(',')
    })
    const blob = new Blob([`﻿${[header.join(','), ...lines].join('\n')}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diagnostico-fiscal-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  if (loading) return <div className="emp-card emp-empty flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Cargando diagnóstico…</div>
  if (error || !semaforo) {
    return (
      <div className="emp-card emp-empty">
        <AlertCircle size={28} />
        <div className="mb-3">{error?.message ?? 'No pudimos cargar el diagnóstico.'}</div>
        <EmpBtn kind="ghost" small onClick={() => void load()}>Reintentar</EmpBtn>
      </div>
    )
  }

  const pending = semaforo.sinDatos + semaforo.sinAutorizacion
  const pct = (n: number) => (personsCount > 0 ? Math.round((n / personsCount) * 100) : 0)

  return (
    <div className="flex flex-col gap-4 max-w-full">
      <div className="flex justify-end">
        <EmpBtn kind="ghost" onClick={exportCsv} disabled={items.length === 0}><Download size={16} /> Exportar</EmpBtn>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi label="En orden" value={semaforo.enOrden} pct={pct(semaforo.enOrden)} icon={<ShieldCheck size={15} />} color="var(--emp-green)" bg="var(--emp-green-bg)" />
        <Kpi label="Atención requerida" value={semaforo.conObservaciones} pct={pct(semaforo.conObservaciones)} icon={<AlertTriangle size={15} />} color="var(--emp-amber)" bg="var(--emp-amber-bg)" />
        <Kpi label="Riesgo alto" value={semaforo.riesgoAlto} pct={pct(semaforo.riesgoAlto)} icon={<CircleX size={15} />} color="var(--emp-red)" bg="var(--emp-red-bg)" />
        <Kpi label="Información pendiente" value={pending} pct={pct(pending)} icon={<CircleDashed size={15} />} color="var(--emp-blue)" bg="var(--emp-blue-bg)" />
      </div>

      {listas && <ListasSat data={listas} items={items} onOpen={setFileFor} />}

      <div className="emp-card emp-card-flush">
        <div className="px-5 pt-5 pb-2">
          <SectionTitle sub="Haz clic en un indicador para ver a las personas que lo tienen.">Distribución de hallazgos</SectionTitle>
        </div>
        {items.length === 0 ? (
          <div className="emp-empty">Aún no hay personas en seguimiento.</div>
        ) : (
          <div>
            {findings.map((f) => {
              const isOpen = open === f.key
              const n = f.persons.length
              return (
                <div key={f.key} style={{ borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : f.key)}
                    disabled={n === 0}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between gap-4 px-5 py-3.5 text-left cursor-pointer disabled:cursor-default"
                    style={{ background: isOpen ? 'var(--emp-surface-2)' : 'transparent', transition: 'background-color 150ms ease' }}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <span className={`emp-dot emp-dot-${f.dot}`} style={{ opacity: n === 0 ? 0.35 : 1 }} />
                      <span className="min-w-0">
                        <span className="block text-[13.5px] font-bold truncate" style={{ color: n === 0 ? 'var(--ink-400)' : 'var(--ink-900)' }}>{f.label}</span>
                        <span className="block text-[12px]" style={{ color: 'var(--ink-400)' }}>{f.hint}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[14px] font-extrabold" style={{ color: n === 0 ? 'var(--ink-300)' : 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                      <ChevronRight size={16} style={{ color: 'var(--ink-400)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 180ms var(--ease-out-strong)' }} />
                    </span>
                  </button>
                  {isOpen && (
                    <div className="ui-section-enter px-5 pb-4 pt-1 flex flex-col gap-1.5" style={{ background: 'var(--emp-surface-2)' }}>
                      {f.persons.map((p) => <PersonChip key={p.id} p={p} onOpen={() => setFileFor(p)} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        <div className="px-5 py-3 text-[12px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-400)' }}>
          Calculado con la información que cada persona autorizó compartir. Adeudos y CSD no se consultan en esta fase.
          {items.length >= MAX_PERSONS ? ` Se analizan las primeras ${MAX_PERSONS} personas.` : ''}
        </div>
      </div>

      <PersonaExpedientePanel person={fileFor} partnershipId={partnershipId} onClose={() => setFileFor(null)} />
    </div>
  )
}

/** Listas del SAT como en SíConf: dona de confiables vs. estatus 69-B, leyenda con porcentajes y personas con coincidencia. */
function ListasSat({ data, items, onOpen }: { data: CompanyList69Summary; items: CompanyPerson[]; onOpen: (p: CompanyPerson) => void }) {
  const total = data.evaluated
  const segments = [
    { key: 'clean', label: 'Contribuyentes confiables', count: data.clean, color: TONE_COLOR.green },
    ...data.byStatus.map((s) => ({ key: `s${s.statusId}`, label: s.status, count: s.count, color: TONE_COLOR[list69Tone(s.status)] })),
  ]
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0)
  const byPerson = new Map(items.map((p) => [p.id, p]))

  return (
    <div className="emp-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle sub="Cruce del RFC de cada persona con el listado 69-B del SAT que publica SíConf. Solo personas con RFC autorizado.">Listas del SAT (Art. 69-B)</SectionTitle>
        <div className="text-[12px] text-right" style={{ color: 'var(--ink-400)' }}>
          Lista con {data.listSize.toLocaleString('es-MX')} RFC{data.listUpdatedAt ? ` · actualizada ${fmtDate(data.listUpdatedAt)}` : ''}
        </div>
      </div>
      {total === 0 ? (
        <div className="emp-note mt-2">Todavía no hay personas con RFC autorizado para cruzar con la lista.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6 items-center mt-2">
          <Donut segments={segments} total={total} centerLabel={`${pct(data.clean)}%`} centerSub="confiables" />
          <div className="flex flex-col gap-2.5 min-w-0">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full shrink-0" style={{ background: s.color, opacity: s.count === 0 ? 0.35 : 1 }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 text-[13.5px]">
                    <span className="font-bold truncate" style={{ color: s.count === 0 ? 'var(--ink-400)' : 'var(--ink-900)' }}>{s.label}</span>
                    <span className="font-extrabold shrink-0" style={{ color: s.count === 0 ? 'var(--ink-300)' : s.color, fontVariantNumeric: 'tabular-nums' }}>{s.count} · {pct(s.count)}%</span>
                  </div>
                  <div className="emp-bar-track mt-1" style={{ height: 4 }}>
                    <div className="emp-bar-fill" style={{ width: `${pct(s.count)}%`, background: s.color }} />
                  </div>
                </div>
              </div>
            ))}
            {data.notEvaluated > 0 && (
              <div className="text-[12px] mt-1" style={{ color: 'var(--ink-400)' }}>{data.notEvaluated} persona{data.notEvaluated === 1 ? '' : 's'} sin RFC conocido o sin autorización: no entran al cruce.</div>
            )}
          </div>
        </div>
      )}
      {data.matches.length > 0 && (
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="emp-kpi-label" style={{ marginBottom: 2 }}>Personas con coincidencia</div>
          {data.matches.map((m) => {
            const p = byPerson.get(m.personId)
            return (
              <button key={m.personId} type="button" onClick={() => p && onOpen(p)} disabled={!p} className="ui-press flex items-center gap-3 px-3 py-2 rounded-xl text-left cursor-pointer disabled:cursor-default" style={{ background: 'var(--emp-surface-2)', border: '1px solid var(--border)' }}>
                <Avatar name={m.fullName} size={30} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold truncate" style={{ color: 'var(--ink-900)' }}>{m.fullName}</span>
                  <span className="block text-[11.5px] truncate emp-mono" style={{ color: 'var(--ink-400)' }}>{m.rfc}{m.publicationDate ? ` · publicado ${fmtDate(m.publicationDate)}` : ''}</span>
                </span>
                <Pill tone={list69Tone(m.status)}>{m.status}</Pill>
                <ChevronRight size={15} style={{ color: 'var(--ink-300)' }} />
              </button>
            )
          })}
        </div>
      )}
      <div className="text-[12px] mt-3" style={{ color: 'var(--ink-400)' }}>
        La consulta a listas del SAT se realiza con la autorización del titular y tiene fines orientativos; no sustituye una validación legal especializada.
      </div>
    </div>
  )
}

/** Dona en SVG: un trazo por segmento, se llena una vez al montar (700 ms). Hueco de 2 px entre segmentos. */
function Donut({ segments, total, centerLabel, centerSub }: { segments: { key: string; count: number; color: string }[]; total: number; centerLabel: string; centerSub: string }) {
  const size = 200
  const stroke = 26
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const gap = 2
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  let offset = 0
  const arcs = segments.filter((s) => s.count > 0).map((s) => {
    const len = (s.count / total) * c
    const arc = { ...s, len: Math.max(0, len - (segments.filter((x) => x.count > 0).length > 1 ? gap : 0)), start: offset }
    offset += len
    return arc
  })
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} role="img" aria-label={`${centerLabel} ${centerSub}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--emp-surface-2)" strokeWidth={stroke} />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={stroke}
            strokeDasharray={`${ready ? a.len : 0} ${c}`}
            strokeDashoffset={-a.start}
            style={{ transition: 'stroke-dasharray 700ms var(--ease-out-strong)' }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-extrabold leading-none" style={{ color: 'var(--ink-900)', fontVariantNumeric: 'tabular-nums' }}>{centerLabel}</span>
        <span className="text-[12px] font-semibold mt-1" style={{ color: 'var(--ink-400)' }}>{centerSub}</span>
      </div>
    </div>
  )
}

function PersonChip({ p, onOpen }: { p: CompanyPerson; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="ui-press flex items-center gap-3 px-3 py-2 rounded-xl text-left cursor-pointer" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Avatar name={p.fullName} size={30} />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold truncate" style={{ color: 'var(--ink-900)' }}>{p.fullName}</span>
        <span className="block text-[11.5px] truncate" style={{ color: 'var(--ink-400)' }}>{p.email}{p.rfc ? ` · ${p.rfc}` : ''}</span>
      </span>
      {p.list69Status ? <Pill tone={list69Tone(p.list69Status)}>69-B · {p.list69Status}</Pill> : p.score != null ? <Pill tone={scoreMeta(p.score).tone as PillTone}>{Math.round(p.score)} · {scoreMeta(p.score).label}</Pill> : <Pill tone={stageTone(p.stage)}>{stageLabel(p.stage)}</Pill>}
      <ChevronRight size={15} style={{ color: 'var(--ink-300)' }} />
    </button>
  )
}

function Kpi({ label, value, pct, icon, color, bg }: { label: string; value: number; pct: number; icon: ReactNode; color: string; bg: string }) {
  return (
    <div className="emp-card">
      <div className="emp-kpi-label">
        <span>{label}</span>
        <span className="emp-kpi-icon" style={{ background: bg, color }}>{icon}</span>
      </div>
      <div className="emp-kpi-value" style={{ color: value > 0 ? color : 'var(--ink-900)' }}>{value}</div>
      <div className="emp-kpi-foot">{pct}% del ecosistema</div>
    </div>
  )
}
