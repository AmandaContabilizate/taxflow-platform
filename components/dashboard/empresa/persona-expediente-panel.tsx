'use client'

import { AlertCircle, ArrowLeft, Download, FileCheck2, FileText, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { type CompanyDocumentKind, getCompanyPersonDocument } from '@/features/empresa/actions/getCompanyPersonDocument.action'
import { getCompanyPersonFile } from '@/features/empresa/actions/getCompanyPersonFile.action'
import {
  CONSENT_SCOPES,
  type CompanyPerson,
  type CompanyPersonFile,
  type EmpresaError,
  relationLabel,
  stageLabel,
} from '@/features/empresa/types'
import { Avatar, CloseX, EmpBtn, EmpTabs, FindingRow, Pill, ScoreRing, SectionTitle, SidePanel, fmtDate, fmtMxn, list69Tone, scoreMeta, stageTone } from './ui'

const TABS = ['Resumen', 'Diagnóstico fiscal', 'Documentos', 'Autorizaciones', 'Actividad', 'Ventas']

const ACTION_LABEL: Record<number, string> = {
  1: 'Consultó el expediente',
  2: 'Descargó un documento',
  3: 'Exportó información',
  4: 'Consultó facturación',
}

const ACTIVATION_STATUS: Record<number, { label: string; tone: 'gray' | 'green' | 'amber' | 'red' }> = {
  0: { label: 'Pendiente', tone: 'amber' },
  1: { label: 'Activada', tone: 'green' },
  2: { label: 'Fallida', tone: 'red' },
  3: { label: 'Excluida', tone: 'gray' },
}

function maskRfc(rfc: string | null | undefined): string {
  if (!rfc || rfc.length < 6) return rfc ?? '—'
  return `${rfc.slice(0, 4)}••••${rfc.slice(-3)}`
}

/**
 * Expediente de una persona (spec §5.8) como panel lateral, con el lenguaje del prototipo: cabecera con avatar,
 * anillo de puntaje y semáforo, tabs subrayadas y tarjetas de hallazgos. Lo que no está autorizado aparece
 * como "Sin autorización", nunca con datos. Cada apertura deja bitácora en el backend.
 */
export function PersonaExpedientePanel({ person, partnershipId, onClose }: { person: CompanyPerson | null; partnershipId?: number; onClose: () => void }) {
  const [tab, setTab] = useState(0)
  const [file, setFile] = useState<CompanyPersonFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<EmpresaError | null>(null)
  const requestedRef = useRef<number | null>(null)
  // Se conserva la última persona para que el panel pueda animar su salida con contenido.
  const [shown, setShown] = useState<CompanyPerson | null>(person)

  useEffect(() => {
    if (!person) return
    setShown(person)
    const id = person.id
    requestedRef.current = id
    setTab(0)
    setFile(null)
    setError(null)
    setLoading(true)
    void (async () => {
      try {
        const res = await getCompanyPersonFile(id, partnershipId)
        if (requestedRef.current !== id) return
        if (res.success) setFile(res.value)
        else setError(res.error)
      } catch (e) {
        if (requestedRef.current !== id) return
        console.error('[PersonaExpedientePanel] getCompanyPersonFile falló:', e)
        setError({ statusCode: 500, message: 'No pudimos cargar el expediente. Inténtalo de nuevo.' })
      } finally {
        if (requestedRef.current === id) setLoading(false)
      }
    })()
  }, [person, partnershipId])

  const p = shown
  const fiscal = file?.fiscal
  const scope = fiscal?.consentScope ?? 0
  const has = (bit: number) => (scope & bit) === bit
  const stage = file?.person.stage ?? p?.stage ?? 0
  const score = has(8) ? fiscal?.score ?? null : null

  return (
    <SidePanel open={!!person} onClose={onClose} labelledBy="exp-title">
      {p && (
        <div className="emp-panel-inner">
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={onClose} className="emp-icon-btn" aria-label="Volver" style={{ border: 'none', background: 'transparent' }}>
              <ArrowLeft size={18} />
            </button>
            <CloseX onClick={onClose} />
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <Avatar name={p.fullName} />
              <div className="min-w-0">
                <h2 id="exp-title" className="text-[19px] font-extrabold leading-tight truncate" style={{ color: 'var(--ink-900)' }}>{p.fullName}</h2>
                <div className="emp-mono text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>
                  {maskRfc(fiscal?.rfc ?? p.rfcDeclared)} · {relationLabel(p.relationType)}{p.city ? ` · ${p.city}` : ''}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>
                  Alta: {fmtDate(p.createdAt)} · Última actualización: {fmtDate(file?.person.stageUpdatedAt ?? p.stageUpdatedAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3.5">
              {score != null ? (
                <>
                  <ScoreRing value={score} />
                  <div>
                    <Pill tone={scoreMeta(score).tone}>{scoreMeta(score).label}</Pill>
                    <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-400)' }}>Puntaje de cumplimiento</div>
                  </div>
                </>
              ) : (
                <div>
                  <Pill tone={stageTone(stage)}>{stageLabel(stage)}</Pill>
                  <div className="text-[12px] mt-1.5" style={{ color: 'var(--ink-400)' }}>
                    {scope ? (has(8) ? 'Sin declaraciones evaluables aún' : 'Diagnóstico no autorizado') : 'Sin autorización'}
                  </div>
                </div>
              )}
            </div>
          </div>

          <EmpTabs items={TABS} active={tab} onChange={setTab} />

          <div className="pt-4">
            {loading ? (
              <div className="emp-empty flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Cargando expediente…</div>
            ) : error || !file ? (
              <div className="emp-empty"><AlertCircle size={28} /><div>{error?.message ?? 'No pudimos cargar el expediente.'}</div></div>
            ) : (
              <div key={tab} className="ui-section-enter">
                {tab === 0 && <ResumenTab file={file} has={has} />}
                {tab === 1 && <DiagnosticoTab file={file} has={has} />}
                {tab === 2 && <DocumentosTab file={file} has={has} partnershipId={partnershipId} />}
                {tab === 3 && <AutorizacionesTab file={file} />}
                {tab === 4 && <ActividadTab file={file} />}
                {tab === 5 && <VentasTab file={file} />}
              </div>
            )}
          </div>
        </div>
      )}
    </SidePanel>
  )
}

type TabProps = { file: CompanyPersonFile; has: (bit: number) => boolean; partnershipId?: number }

function ResumenTab({ file, has }: TabProps) {
  const { person, fiscal } = file
  const recs = recommendations(file, has)
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="emp-card">
          <SectionTitle>Estatus general</SectionTitle>
          <FindingRow label="Etapa" value={<Pill tone={stageTone(person.stage)}>{stageLabel(person.stage)}</Pill>} />
          <FindingRow label="Cuenta" value={person.hasAccount ? (person.pendingPassword ? 'Sin contraseña' : 'Creada') : person.lastInviteAt ? `Invitada el ${fmtDate(person.lastInviteAt)}` : 'Sin invitar'} />
          {has(1) ? (
            <>
              <FindingRow label="Régimen fiscal" value={fiscal.regimes.length ? fiscal.regimes.join(', ') : '—'} />
              <FindingRow label="Estatus en el padrón" value={fiscal.estatusPadron ?? '—'} />
              <FindingRow label="RFC en el SAT" value={<span className="emp-mono">{fiscal.rfc ?? 'Aún sin constancia'}</span>} />
              <FindingRow label="CIEC" value={fiscal.hasCiec ? 'Capturada' : 'Pendiente'} />
              <FindingRow label="Lista 69-B del SAT" value={fiscal.list69Status ? <Pill tone={list69Tone(fiscal.list69Status)}>{fiscal.list69Status}{fiscal.list69PublicationDate ? ` · ${fmtDate(fiscal.list69PublicationDate)}` : ''}</Pill> : <Pill tone="green">Sin coincidencia</Pill>} />
            </>
          ) : (
            <NoAuth text="La persona no ha autorizado compartir su RFC y régimen." />
          )}
        </div>
        <div className="emp-card">
          <SectionTitle>Datos de contacto</SectionTitle>
          <FindingRow label="Correo" value={<span className="break-all">{person.email}</span>} />
          <FindingRow label="Teléfono" value={person.phone ?? '—'} />
          <FindingRow label="Relación" value={relationLabel(person.relationType)} />
          <FindingRow label="RFC declarado" value={<span className="emp-mono">{person.rfcDeclared ?? '—'}</span>} />
          {person.externalId && <FindingRow label="Id interno" value={person.externalId} />}
          {(person.city || person.state) && <FindingRow label="Ubicación" value={[person.city, person.state].filter(Boolean).join(', ')} />}
        </div>
      </div>
      <div className="emp-card">
        <SectionTitle>Recomendaciones prioritarias</SectionTitle>
        {recs.length === 0 ? (
          <p className="text-[12.5px] m-0" style={{ color: 'var(--ink-400)' }}>Sin recomendaciones pendientes.</p>
        ) : (
          recs.map((r) => <FindingRow key={r.text} label={r.text} dot={r.dot} />)
        )}
      </div>
    </div>
  )
}

/** Recomendaciones deducidas de los hechos del expediente; nunca inventa datos que el backend no trae. */
function recommendations(file: CompanyPersonFile, has: (bit: number) => boolean): { text: string; dot: 'red' | 'amber' | 'blue' | 'green' }[] {
  const { person, fiscal } = file
  const out: { text: string; dot: 'red' | 'amber' | 'blue' | 'green' }[] = []
  if (!person.hasAccount) out.push({ text: person.lastInviteAt ? 'Aún no abre la invitación: reenviar la liga.' : 'Enviar la invitación para que cree su cuenta.', dot: 'blue' })
  else if (person.pendingPassword) out.push({ text: 'Tiene cuenta pero no ha definido contraseña: reenviar la liga.', dot: 'blue' })
  if (!fiscal.consentScope) out.push({ text: 'La persona retiró su autorización: solo ves su etapa hasta que vuelva a autorizar.', dot: 'amber' })
  if (has(1) && person.hasAccount && !fiscal.hasCiec) out.push({ text: 'Falta capturar la CIEC para obtener su información del SAT.', dot: 'amber' })
  if (has(1) && person.hasAccount && fiscal.hasCiec && !fiscal.hasCsf) out.push({ text: 'Aún no hay constancia de situación fiscal; llega sola cuando el robot la descargue.', dot: 'blue' })
  if (has(8) && fiscal.score != null && fiscal.score < 50) out.push({ text: `Dar seguimiento a sus declaraciones pendientes (${fiscal.declarationsPending ?? 0}).`, dot: fiscal.score < 25 ? 'red' : 'amber' })
  if (person.stage === 8) out.push({ text: 'Lista para activar: entra al lote diario que aprueba Contabilízate.', dot: 'green' })
  if (person.stage === 10) out.push({ text: 'Ya paga su propio plan; entrará a la cola de activación cuando venza.', dot: 'blue' })
  return out
}

function DiagnosticoTab({ file, has }: TabProps) {
  const { fiscal } = file
  if (!has(8)) return <NoAuth text="La persona no ha autorizado compartir su diagnóstico fiscal." />
  if (fiscal.score == null) {
    return (
      <div className="emp-note">
        Todavía no hay declaraciones evaluables. El diagnóstico aparece cuando sus declaraciones se sincronizan con el SAT.
        {fiscal.isReconciling ? ' La sincronización está en curso.' : ''}
      </div>
    )
  }
  const meta = scoreMeta(fiscal.score)
  const total = fiscal.declarationsTotal ?? 0
  const presented = fiscal.declarationsPresented ?? 0
  const pending = fiscal.declarationsPending ?? 0
  return (
    <div className="flex flex-col gap-4">
      <div className="emp-note">Este diagnóstico se calcula solo con la información autorizada por el titular y tiene fines orientativos.</div>
      <div className="emp-card">
        <div className="flex flex-wrap items-center gap-5">
          <ScoreRing value={fiscal.score} size={88} />
          <div className="min-w-0">
            <Pill tone={meta.tone}>{meta.label}</Pill>
            <div className="text-[16px] font-extrabold mt-1.5" style={{ color: 'var(--ink-900)' }}>{Math.round(fiscal.score)} de 100 en cumplimiento</div>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Mismo cálculo que ve la persona en su cuenta: declaraciones presentadas entre las evaluables.</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Evaluables" value={total} />
        <Stat label="Presentadas" value={presented} tone="green" />
        <Stat label="Pendientes" value={pending} tone={pending > 0 ? 'amber' : undefined} />
      </div>
      <div className="emp-card">
        <SectionTitle>Revisiones</SectionTitle>
        <FindingRow label="RFC en el SAT" value={fiscal.rfc ? <Pill tone="green">Registrado</Pill> : <Pill tone="gray">Sin constancia</Pill>} />
        <FindingRow label="Régimen fiscal" value={fiscal.regimes.length ? fiscal.regimes.join(', ') : '—'} />
        <FindingRow label="Estatus en el padrón" value={fiscal.estatusPadron ?? '—'} />
        <FindingRow label="Opinión de cumplimiento" value={!has(2) ? <Pill tone="gray">No autorizada</Pill> : fiscal.hasComplianceOpinion ? <Pill tone="green">Obtenida · {fmtDate(fiscal.complianceOpinionAt)}</Pill> : <Pill tone="gray">Aún no obtenida</Pill>} />
        <FindingRow label="Constancia de situación fiscal" value={!has(4) ? <Pill tone="gray">No autorizada</Pill> : fiscal.hasCsf ? <Pill tone="green">Vigente · {fmtDate(fiscal.csfDownloadedAt)}</Pill> : <Pill tone="amber">Pendiente</Pill>} />
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: 'green' | 'amber' }) {
  const color = tone === 'green' ? 'var(--emp-green)' : tone === 'amber' ? 'var(--emp-amber)' : 'var(--ink-900)'
  return (
    <div className="emp-card" style={{ padding: '14px 16px' }}>
      <div className="emp-kpi-label" style={{ marginBottom: 4 }}>{label}</div>
      <div className="emp-kpi-value" style={{ fontSize: 24, color }}>{value}</div>
    </div>
  )
}

function DocumentosTab({ file, has, partnershipId }: TabProps) {
  const { fiscal, person } = file
  const [opening, setOpening] = useState<CompanyDocumentKind | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Abre el PDF en otra pestaña: el backend lo sirve ya autorizado y deja bitácora de la descarga.
  const open = async (tipo: CompanyDocumentKind) => {
    setOpening(tipo)
    setError(null)
    try {
      const res = await getCompanyPersonDocument(person.id, tipo, partnershipId)
      if (!res.success) return setError(res.error.message)
      const bytes = Uint8Array.from(atob(res.value.base64), (ch) => ch.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: res.value.contentType }))
      const win = window.open(url, '_blank', 'noopener')
      if (!win) {
        const a = document.createElement('a')
        a.href = url
        a.download = res.value.filename
        a.click()
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      console.error('[DocumentosTab] getCompanyPersonDocument falló:', e)
      setError('No pudimos abrir el documento. Inténtalo de nuevo.')
    } finally {
      setOpening(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="emp-card" style={{ paddingTop: 6, paddingBottom: 6 }}>
        <DocRow icon={<FileText size={18} />} label="Constancia de situación fiscal" sub="Documento que descarga el robot con la CIEC de la persona" authorized={has(4)} available={fiscal.hasCsf} date={fiscal.csfDownloadedAt} opening={opening === 'constancia'} disabled={opening !== null} onOpen={() => void open('constancia')} />
        <DocRow icon={<FileCheck2 size={18} />} label="Opinión de cumplimiento" sub="Positiva o negativa según el SAT" authorized={has(2)} available={fiscal.hasComplianceOpinion} date={fiscal.complianceOpinionAt} opening={opening === 'opinion'} disabled={opening !== null} onOpen={() => void open('opinion')} />
      </div>
      {error && <div className="text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'var(--emp-red-bg)', color: 'var(--emp-red)' }}>{error}</div>}
      <div className="emp-note">Cada vez que abres un documento queda registrado en la pestaña Actividad de la persona.</div>
    </div>
  )
}

function DocRow({ icon, label, sub, authorized, available, date, opening, disabled, onOpen }: { icon: React.ReactNode; label: string; sub: string; authorized: boolean; available: boolean; date?: string | null; opening: boolean; disabled: boolean; onOpen: () => void }) {
  return (
    <div className="emp-doc-row">
      <div className="flex items-center gap-3 min-w-0">
        <div className="emp-doc-icon">{icon}</div>
        <div className="min-w-0">
          <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{label}</div>
          <div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{sub}</div>
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {!authorized ? <Pill tone="gray">Sin autorización</Pill> : available ? <Pill tone="green">Disponible · {fmtDate(date)}</Pill> : <Pill tone="amber">Aún no se ha obtenido</Pill>}
        {authorized && available && (
          <EmpBtn small disabled={disabled} onClick={onOpen}>
            {opening ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Ver
          </EmpBtn>
        )}
      </div>
    </div>
  )
}

function AutorizacionesTab({ file }: { file: CompanyPersonFile }) {
  if (file.consents.length === 0) return <div className="emp-empty"><ShieldOff size={28} />La persona aún no tiene autorizaciones registradas.</div>
  const now = Date.now()
  return (
    <div className="emp-card">
      <div className="emp-timeline">
        {file.consents.map((c, i) => {
          const exp = new Date(c.expiresAt.endsWith('Z') ? c.expiresAt : `${c.expiresAt}Z`).getTime()
          const vigente = !c.revokedAt && exp > now
          return (
            <div key={`${c.grantedAt}-${i}`} className="emp-tl-item">
              <span className={`emp-tl-dot${vigente ? '' : ' is-muted'}`} />
              <div className="emp-tl-date">{fmtDate(c.grantedAt, true)}</div>
              <div className="emp-tl-title flex items-center gap-2">
                {vigente ? <ShieldCheck size={15} style={{ color: 'var(--emp-green)' }} /> : <ShieldOff size={15} style={{ color: 'var(--ink-400)' }} />}
                {vigente ? `Vigente hasta ${fmtDate(c.expiresAt)}` : c.revokedAt ? `Retirada el ${fmtDate(c.revokedAt, true)}` : `Venció el ${fmtDate(c.expiresAt)}`}
              </div>
              <div className="emp-tl-desc flex flex-wrap gap-1.5 mt-1.5">
                {CONSENT_SCOPES.filter((s) => (c.scope & s.bit) === s.bit).map((s) => <Pill key={s.bit} tone={vigente ? 'purple' : 'gray'}>{s.label}</Pill>)}
                <span className="self-center text-[11px]" style={{ color: 'var(--ink-400)' }}>aviso v{c.privacyNoticeVersion}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ActividadTab({ file }: { file: CompanyPersonFile }) {
  if (file.activity.length === 0) return <div className="emp-empty">Sin consultas registradas todavía.</div>
  return (
    <div className="emp-card">
      <div className="emp-timeline">
        {file.activity.map((a, i) => (
          <div key={`${a.at}-${i}`} className="emp-tl-item">
            <span className="emp-tl-dot is-muted" />
            <div className="emp-tl-date">{fmtDate(a.at, true)}</div>
            <div className="emp-tl-title">{ACTION_LABEL[a.action] ?? `Acción ${a.action}`}</div>
            <div className="emp-tl-desc">{a.userName ?? '—'}{a.detail ? ` · ${a.detail}` : ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function VentasTab({ file }: { file: CompanyPersonFile }) {
  if (file.activations.length === 0) {
    return <div className="emp-note">Sin activaciones todavía. Cuando esté lista para activar, entrará al lote diario que aprueba Contabilízate.</div>
  }
  return (
    <div className="emp-card">
      {file.activations.map((a) => {
        const st = ACTIVATION_STATUS[a.status] ?? ACTIVATION_STATUS[0]
        return (
          <div key={a.id} className="emp-finding-row">
            <div className="min-w-0">
              <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{a.planName}{a.isRenewal ? ' · renovación' : ''}</div>
              <div className="text-[12px]" style={{ color: 'var(--ink-400)' }}>Periodo {a.period} · {fmtMxn(a.priceMxn, 2)}{a.error ? ` · ${a.error}` : ''}</div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Pill tone={st.tone}>{st.label}</Pill>
              <span className="text-[12px]" style={{ color: 'var(--ink-400)' }}>{fmtDate(a.activatedAt)}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function NoAuth({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-[13px] rounded-xl px-4 py-3" style={{ background: 'var(--emp-amber-bg)', color: 'var(--emp-amber)' }}>
      <ShieldOff size={16} /> {text}
    </div>
  )
}
