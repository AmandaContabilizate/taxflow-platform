'use client'

import { AlertCircle, FolderOpen, Loader2, Mail, Plug, Search, Send, Upload, UserMinus, UserPlus, Users } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { getCompanyPersons } from '@/features/empresa/actions/getCompanyPersons.action'
import { deactivateCompanyPerson, inviteCompanyPersons } from '@/features/empresa/actions/managePersons.action'
import { getCompanyServices } from '@/features/empresa/actions/services.action'
import {
  type CompanyPerson,
  type CompanyPersonsPage,
  type CompanyServiceCatalogItem,
  type CompanyServices,
  type EmpresaError,
  PERSON_STAGES,
  type PersonService,
  RELATION_TYPES,
  relationLabel,
  stageLabel,
} from '@/features/empresa/types'
import { CargaMasivaModal } from '../empresa/carga-masiva-modal'
import { PersonaExpedientePanel } from '../empresa/persona-expediente-panel'
import { PersonaModal } from '../empresa/persona-modal'
import { ServicioDrawer } from '../empresa/servicio-drawer'
import { ServicioMasivoModal } from '../empresa/servicio-masivo-modal'
import { Chip, EmpBtn, IconBtn, Pill, type PillTone, fmtDate, list69Tone, scoreMeta, stageTone } from '../empresa/ui'
import { ProviderLogo } from '../productos/provider-logo'

const PAGE_SIZE = 50
/** Una constancia con más de 3 meses se considera desactualizada (criterio del prototipo). */
const CSF_FRESH_DAYS = 90

function maskRfc(rfc: string | null | undefined): string | null {
  if (!rfc) return null
  if (rfc.length < 7) return rfc
  return `${rfc.slice(0, 4)}••••${rfc.slice(-3)}`
}

/** Avance del registro: etapa 1–9 sobre 9; "Con plan propio" (10) cuenta como completo. */
function registroPct(stage: number): number {
  if (stage >= 9) return 100
  return Math.round((Math.max(0, stage) / 9) * 100)
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`).getTime()
  if (Number.isNaN(d)) return null
  return Math.floor((Date.now() - d) / 86_400_000)
}

/**
 * Personas de mi empresa (spec-perfil-empresa §5.2 / §5.8) con las columnas del prototipo: nombre, RFC, relación,
 * ciudad, invitación, avance del registro, diagnóstico, opinión, CSF, nivel de riesgo, última actualización y
 * acciones. Lo fiscal solo aparece si la persona autorizó ese alcance. Alta individual y masiva, invitación,
 * baja, servicios y expediente en panel lateral.
 */
interface EmpresaPersonasScreenProps {
  partnershipId?: number
  /** Alta (una o masivo) e invitar. En el portal: Empresa.Invitar; en la vista interna: GerenciaComercial.GestionarPersonasEmpresa. */
  canInvite: boolean
  /** Baja de la persona. Por omisión igual que canInvite; la vista interna lo pasa en false porque la baja la pide la empresa. */
  canDeactivate?: boolean
  canContractServices?: boolean
}

export function EmpresaPersonasScreen({ partnershipId, canInvite, canDeactivate = canInvite, canContractServices = false }: EmpresaPersonasScreenProps) {
  const [page, setPage] = useState<CompanyPersonsPage | null>(null)
  // Servicios adicionales (spec-servicios-adicionales §5.2): catálogo con precio pactado y servicios vivos por persona.
  const [services, setServices] = useState<CompanyServices | null>(null)
  const [drawer, setDrawer] = useState<{ person: CompanyPerson; service: CompanyServiceCatalogItem } | null>(null)
  const [masivoServicioOpen, setMasivoServicioOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [stage, setStage] = useState<number | undefined>(undefined)
  const [relationType, setRelationType] = useState<number | undefined>(undefined)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [pageNumber, setPageNumber] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [altaOpen, setAltaOpen] = useState(false)
  const [masivaOpen, setMasivaOpen] = useState(false)
  // Expediente (paso 6): se abre al pulsar el nombre o la carpeta; cada apertura deja bitácora en el backend.
  const [fileFor, setFileFor] = useState<CompanyPerson | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCompanyPersons({ search, stage, relationType, includeInactive, page: pageNumber, pageSize: PAGE_SIZE, partnershipId })
      if (res.success) setPage(res.value)
      else setError(res.error)
    } catch (e) {
      console.error('[EmpresaPersonasScreen] getCompanyPersons falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar las personas. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [search, stage, relationType, includeInactive, pageNumber, partnershipId])

  useEffect(() => {
    void load()
  }, [load])

  const loadServices = useCallback(async () => {
    const res = await getCompanyServices(partnershipId)
    if (res.success) setServices(res.value)
    else if (res.error.statusCode !== 403) console.error('[EmpresaPersonasScreen] getCompanyServices falló:', res.error.message)
  }, [partnershipId])

  useEffect(() => {
    void loadServices()
  }, [loadServices])

  const catalog = services?.catalog ?? []
  const servicesOf = useCallback((personId: number): PersonService[] => services?.persons?.[String(personId)] ?? [], [services])
  const selectedPersons = useMemo(() => (page?.items ?? []).filter((p) => selected.has(p.id)), [page, selected])
  const selectedInvitable = selectedPersons.filter((p) => !p.hasAccount || p.pendingPassword).length
  const selectedActivated = selectedPersons.filter((p) => p.stage === 9).length
  const canSelect = canInvite || (canContractServices && catalog.length > 0)
  const selectable = (p: CompanyPerson) => p.isActive && ((canInvite && (!p.hasAccount || p.pendingPassword)) || (canContractServices && catalog.length > 0 && p.stage === 9))

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const ids = (page?.items ?? []).filter(selectable).map((p) => p.id)
    const all = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected(all ? new Set() : new Set(ids))
  }

  const invite = async (ids: number[]) => {
    setBusy('invite')
    setNotice(null)
    try {
      const res = await inviteCompanyPersons(ids, partnershipId)
      if (!res.success) return setNotice(res.error.message)
      const r = res.value
      setNotice(`Invitaciones enviadas: ${r.sent}${r.accountsCreated ? ` · cuentas creadas: ${r.accountsCreated}` : ''}${r.skipped ? ` · omitidas: ${r.skipped}` : ''}${r.failed ? ` · con error: ${r.failed}` : ''}`)
      setSelected(new Set())
      await load()
    } catch (e) {
      console.error('[EmpresaPersonasScreen] inviteCompanyPersons falló:', e)
      setNotice('No pudimos enviar las invitaciones.')
    } finally {
      setBusy(null)
    }
  }

  const deactivate = async (p: CompanyPerson) => {
    const motivo = window.prompt(`Dar de baja a ${p.fullName}. Si tiene un plan vigente sigue hasta vencer; no hay reembolso.\n\nMotivo (opcional):`)
    if (motivo === null) return
    setBusy(`baja-${p.id}`)
    setNotice(null)
    try {
      const res = await deactivateCompanyPerson(p.id, motivo.trim() || null, partnershipId)
      if (!res.success) return setNotice(res.error.message)
      await load()
    } catch (e) {
      console.error('[EmpresaPersonasScreen] deactivateCompanyPerson falló:', e)
      setNotice('No pudimos dar de baja a la persona.')
    } finally {
      setBusy(null)
    }
  }

  const stageCounts = page?.stageCounts ?? {}
  const totalActive = Object.values(stageCounts).reduce((a, b) => a + b, 0)
  const pendingInvite = stageCounts['1'] ?? 0
  const totalPages = page ? Math.max(1, Math.ceil(page.total / page.pageSize)) : 1
  const columns = [
    'Nombre', 'RFC', 'Tipo de relación', 'Ciudad', 'Fecha invitación', 'Avance registro',
    'Diagnóstico', 'Opinión', 'CSF', 'Listas riesgo', 'Nivel de riesgo',
    ...(catalog.length > 0 ? ['Servicios'] : []),
    'Última actualización', 'Acciones',
  ]
  const allSelectableIds = (page?.items ?? []).filter(selectable).map((p) => p.id)
  const allChecked = allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.has(id))

  return (
    <div className="flex flex-col gap-4 max-w-full">
      {/* Embudo por etapa: cada chip filtra la tabla. */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={stage === undefined} onClick={() => { setStage(undefined); setPageNumber(1) }} count={totalActive}>Todas</Chip>
        {PERSON_STAGES.map((s) => (
          <Chip key={s.value} active={stage === s.value} title={s.hint} count={stageCounts[String(s.value)] ?? 0} onClick={() => { setStage(stage === s.value ? undefined : s.value); setPageNumber(1) }}>
            {s.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px] max-w-[340px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--ink-400)' }} />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput.trim()); setPageNumber(1) } }}
            placeholder="Buscar por nombre, correo, RFC o id interno"
            className="emp-input w-full pl-9"
            aria-label="Buscar personas"
          />
        </div>
        <select value={relationType ?? ''} onChange={(e) => { setRelationType(e.target.value ? Number(e.target.value) : undefined); setPageNumber(1) }} className="emp-select" aria-label="Tipo de relación">
          <option value="">Tipo de relación</option>
          {RELATION_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <label className="flex items-center gap-2 text-[12.5px] font-semibold cursor-pointer select-none" style={{ color: 'var(--ink-500)' }}>
          <input type="checkbox" checked={includeInactive} onChange={(e) => { setIncludeInactive(e.target.checked); setPageNumber(1) }} className="emp-check" />
          Ver bajas
        </label>
        {canInvite && (
          <div className="ml-auto flex flex-wrap items-center gap-2.5">
            <EmpBtn kind="ghost" onClick={() => setMasivaOpen(true)}><Upload size={16} /> Carga masiva</EmpBtn>
            <EmpBtn onClick={() => setAltaOpen(true)}><UserPlus size={16} /> Agregar persona</EmpBtn>
          </div>
        )}
      </div>

      {selected.size > 0 ? (
        <div className="emp-bulk-bar ui-section-enter">
          <span><b>{selected.size}</b> seleccionada{selected.size === 1 ? '' : 's'}</span>
          {canInvite && selectedInvitable > 0 && (
            <EmpBtn kind="accent" small disabled={busy !== null} onClick={() => void invite(selectedPersons.filter((p) => !p.hasAccount || p.pendingPassword).map((p) => p.id))}>
              {busy === 'invite' ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Invitar {selectedInvitable}
            </EmpBtn>
          )}
          {canContractServices && catalog.length > 0 && selectedActivated > 0 && (
            <EmpBtn kind="ghost" small disabled={busy !== null || services?.blockedByOverdue} onClick={() => setMasivoServicioOpen(true)} title={services?.blockedByOverdue ? 'Tu empresa tiene un estado de cuenta vencido' : undefined}>
              <Plug size={15} /> Contratar servicio · {selectedActivated}
            </EmpBtn>
          )}
          <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[12.5px] font-bold underline-offset-2 hover:underline cursor-pointer" style={{ color: '#C9BFF7' }}>Quitar selección</button>
        </div>
      ) : canInvite && pendingInvite > 0 ? (
        <div className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: 'var(--ink-500)' }}>
          <EmpBtn kind="accent" small disabled={busy !== null} onClick={() => void invite([])}>
            {busy === 'invite' ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />} Invitar pendientes ({pendingInvite})
          </EmpBtn>
          <span>Al invitar, su cuenta queda creada; el correo lleva la liga para que solo defina su contraseña.</span>
        </div>
      ) : null}

      {notice && (
        <div className="text-[13px] px-4 py-2.5 rounded-xl ui-section-enter" style={{ background: 'var(--emp-green-bg)', color: 'var(--emp-green)' }}>
          {notice}
        </div>
      )}

      {loading ? (
        <div className="emp-card emp-empty flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Cargando personas…</div>
      ) : error ? (
        <div className="emp-card emp-empty">
          <AlertCircle size={28} />
          <div className="mb-3">{error.message}</div>
          <EmpBtn kind="ghost" small onClick={() => void load()}>Reintentar</EmpBtn>
        </div>
      ) : !page || page.items.length === 0 ? (
        <div className="emp-card emp-empty">
          <Users size={32} />
          <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--ink-900)' }}>
            {totalActive === 0 ? 'Aún no hay personas en tu empresa' : 'Nadie coincide con el filtro'}
          </div>
          <p className="m-0 max-w-[420px] mx-auto text-[13px]">
            {totalActive === 0
              ? 'Agrega a tus personas una por una o con una carga masiva. Después les mandas la invitación cuando tú decidas.'
              : 'Cambia la etapa, la relación o el texto de búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="emp-card emp-card-flush">
          <div className="overflow-x-auto">
            <table className="emp-table" style={{ minWidth: 1280 }}>
              <thead>
                <tr>
                  {canSelect && (
                    <th style={{ width: 40 }}>
                      {allSelectableIds.length > 0 && <input type="checkbox" className="emp-check" checked={allChecked} onChange={toggleAll} aria-label="Seleccionar todas" />}
                    </th>
                  )}
                  {columns.map((h) => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {page.items.map((p) => (
                  <PersonRow
                    key={p.id}
                    p={p}
                    selectable={canSelect ? selectable(p) : null}
                    checked={selected.has(p.id)}
                    onToggle={() => toggle(p.id)}
                    onOpen={() => setFileFor(p)}
                    onInvite={canInvite && p.isActive && (!p.hasAccount || p.pendingPassword) ? () => void invite([p.id]) : undefined}
                    onDeactivate={canInvite && canDeactivate && p.isActive ? () => void deactivate(p) : undefined}
                    busy={busy}
                    services={catalog.length > 0 ? (
                      <ServiceChips p={p} catalog={catalog} current={servicesOf(p.id)} onPick={(c) => setDrawer({ person: p, service: c })} />
                    ) : null}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-[12.5px]" style={{ borderTop: '1px solid var(--border)', color: 'var(--ink-500)' }}>
            <span>Mostrando {(page.page - 1) * page.pageSize + 1}–{Math.min(page.page * page.pageSize, page.total)} de {page.total}</span>
            <div className="flex items-center gap-1">
              <button type="button" className="emp-page-btn" disabled={page.page <= 1} onClick={() => setPageNumber(page.page - 1)} aria-label="Página anterior">‹</button>
              {pageWindow(page.page, totalPages).map((n) => (
                <button key={n} type="button" className={`emp-page-btn${n === page.page ? ' is-active' : ''}`} onClick={() => setPageNumber(n)} aria-current={n === page.page ? 'page' : undefined}>{n}</button>
              ))}
              <button type="button" className="emp-page-btn" disabled={page.page >= totalPages} onClick={() => setPageNumber(page.page + 1)} aria-label="Página siguiente">›</button>
            </div>
          </div>
        </div>
      )}

      <PersonaModal open={altaOpen} partnershipId={partnershipId} onClose={() => setAltaOpen(false)} onSaved={() => void load()} />
      <CargaMasivaModal open={masivaOpen} partnershipId={partnershipId} onClose={() => setMasivaOpen(false)} onSaved={() => void load()} />
      <PersonaExpedientePanel person={fileFor} partnershipId={partnershipId} onClose={() => setFileFor(null)} />
      <ServicioDrawer
        open={!!drawer}
        person={drawer?.person ?? null}
        service={drawer?.service ?? null}
        current={drawer ? (servicesOf(drawer.person.id).find((s) => s.planId === drawer.service.planId) ?? null) : null}
        partnershipId={partnershipId}
        canContract={canContractServices}
        blockedByOverdue={services?.blockedByOverdue ?? false}
        onClose={() => setDrawer(null)}
        onChanged={(msg) => { setNotice(msg); void loadServices() }}
      />
      <ServicioMasivoModal
        open={masivoServicioOpen}
        persons={selectedPersons}
        catalog={catalog}
        services={services?.persons ?? {}}
        partnershipId={partnershipId}
        onClose={() => setMasivoServicioOpen(false)}
        onDone={(r, svc) => { setNotice(`${svc.name}: ${r.contracted} contratada${r.contracted === 1 ? '' : 's'}${r.skipped ? ` · ${r.skipped} omitida${r.skipped === 1 ? '' : 's'}` : ''}${r.failed ? ` · ${r.failed} con error` : ''}.`); setSelected(new Set()); void loadServices() }}
      />
    </div>
  )
}

interface PersonRowProps {
  p: CompanyPerson
  /** null = la tabla no tiene columna de selección; false = esta fila no se puede seleccionar. */
  selectable: boolean | null
  checked: boolean
  onToggle: () => void
  onOpen: () => void
  onInvite?: () => void
  onDeactivate?: () => void
  busy: string | null
  services: ReactNode
}

function PersonRow({ p, selectable, checked, onToggle, onOpen, onInvite, onDeactivate, busy, services }: PersonRowProps) {
  const authorized = (bit: number) => ((p.consentScope ?? 0) & bit) === bit
  const pct = registroPct(p.stage)
  const csfAge = daysSince(p.csfDownloadedAt)
  const meta = p.score != null ? scoreMeta(p.score) : null

  return (
    <tr className={`${checked ? 'is-selected' : ''}${p.isActive ? '' : ' is-inactive'}`}>
      {selectable !== null && (
        <td>{selectable && <input type="checkbox" className="emp-check" checked={checked} onChange={onToggle} aria-label={`Seleccionar ${p.fullName}`} />}</td>
      )}
      <td>
        <button type="button" onClick={onOpen} title="Ver expediente" className="emp-cell-name">{p.fullName}</button>
        <div className="emp-cell-sub">{p.email}{p.externalId ? ` · ${p.externalId}` : ''}</div>
      </td>
      <td>
        <span className="emp-mono" style={{ color: 'var(--ink-700)' }}>{maskRfc(p.rfc) ?? p.rfcDeclared ?? '—'}</span>
      </td>
      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{relationLabel(p.relationType)}</td>
      <td className="whitespace-nowrap">
        {p.city || p.state ? (
          <>
            <div style={{ color: 'var(--ink-700)' }}>{p.city ?? p.state}</div>
            {p.city && p.state && <div className="emp-cell-sub">{p.state}</div>}
          </>
        ) : <span style={{ color: 'var(--ink-400)' }}>—</span>}
      </td>
      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>
        {p.lastInviteAt ? fmtDate(p.lastInviteAt) : p.hasAccount ? <span style={{ color: 'var(--ink-400)' }}>Con cuenta</span> : <span style={{ color: 'var(--ink-400)' }}>Sin enviar</span>}
        {p.pendingPassword && <div className="emp-cell-sub">Sin contraseña</div>}
      </td>
      <td className="whitespace-nowrap">
        {p.isActive ? (
          <>
            <div className="flex items-center gap-2">
              <div className="emp-bar-track" style={{ width: 56, height: 8 }}>
                <div className={`emp-bar-fill${pct >= 100 ? ' is-turq' : ''}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-400)' }}>{pct}%</span>
            </div>
            <div className="emp-cell-sub">{stageLabel(p.stage)}</div>
          </>
        ) : <Pill tone="gray">Baja</Pill>}
      </td>
      <td className="whitespace-nowrap">
        {!p.hasAccount ? <Dash /> : !authorized(8) ? <Pill tone="gray">Sin autorización</Pill> : p.score != null ? <Pill tone="green">Concluido</Pill> : <Pill tone="amber">Pendiente</Pill>}
      </td>
      <td className="whitespace-nowrap">
        {!p.hasAccount ? <Dash /> : !authorized(2) ? <Pill tone="gray">Sin autorización</Pill> : p.hasComplianceOpinion ? <Pill tone="green" title={`Obtenida el ${fmtDate(p.complianceOpinionAt)}`}>Obtenida</Pill> : <Pill tone="gray">No disponible</Pill>}
      </td>
      <td className="whitespace-nowrap">
        {!p.hasAccount ? <Dash /> : !authorized(4) ? <Pill tone="gray">Sin autorización</Pill> : !p.hasCsf ? <Pill tone="gray">No disponible</Pill> : csfAge != null && csfAge > CSF_FRESH_DAYS ? <Pill tone="amber" title={`Descargada el ${fmtDate(p.csfDownloadedAt)}`}>Desactualizada</Pill> : <Pill tone="green" title={`Descargada el ${fmtDate(p.csfDownloadedAt)}`}>Vigente</Pill>}
      </td>
      <td className="whitespace-nowrap">
        {!p.hasAccount ? <Dash /> : !authorized(1) ? <Pill tone="gray">Sin autorización</Pill> : p.list69Status ? <Pill tone={list69Tone(p.list69Status)} title={p.list69PublicationDate ? `Publicado ${fmtDate(p.list69PublicationDate)}` : undefined}>69-B · {p.list69Status}</Pill> : <Pill tone="green">Sin coincidencia</Pill>}
      </td>
      <td className="whitespace-nowrap">
        {meta ? <Pill tone={meta.tone as PillTone}>{meta.label}</Pill> : <Dash />}
      </td>
      {services !== null && <td>{services}</td>}
      <td className="whitespace-nowrap text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{fmtDate(p.stageUpdatedAt)}</td>
      <td>
        <div className="flex items-center gap-1.5">
          <IconBtn onClick={onOpen} label={`Expediente de ${p.fullName}`} title="Ver expediente"><FolderOpen size={15} /></IconBtn>
          {onInvite && (
            <IconBtn disabled={busy !== null} onClick={onInvite} label={`Invitar a ${p.fullName}`} title={p.pendingPassword ? 'Reenviar liga para definir contraseña' : p.lastInviteAt ? 'Reenviar invitación' : 'Invitar'}>
              {busy === 'invite' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </IconBtn>
          )}
          {onDeactivate && (
            <IconBtn disabled={busy !== null} onClick={onDeactivate} label={`Dar de baja a ${p.fullName}`} title="Dar de baja">
              {busy === `baja-${p.id}` ? <Loader2 size={15} className="animate-spin" /> : <UserMinus size={15} />}
            </IconBtn>
          )}
        </div>
      </td>
    </tr>
  )
}

function Dash() {
  return <span style={{ color: 'var(--ink-300)' }}>—</span>
}

function ServiceChips({ p, catalog, current, onPick }: { p: CompanyPerson; catalog: CompanyServiceCatalogItem[]; current: PersonService[]; onPick: (c: CompanyServiceCatalogItem) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {catalog.map((c) => {
        const cur = current.find((s) => s.planId === c.planId) ?? null
        const locked = !p.isActive || p.stage !== 9
        const byCompany = cur?.payerType === 2
        const byPerson = cur?.payerType === 1
        const style = byCompany
          ? { background: 'var(--emp-green-bg)', color: 'var(--emp-green)', border: '1px solid transparent' }
          : byPerson
            ? { background: 'var(--emp-purple-bg)', color: 'var(--emp-purple)', border: '1px solid transparent' }
            : { background: 'transparent', color: 'var(--ink-500)', border: '1px dashed var(--ink-300)' }
        const title = byCompany
          ? `${c.name}: lo paga tu empresa${cur?.status === 4 ? ' (baja programada)' : cur?.status === 1 ? ' (alta en proceso)' : ''}`
          : byPerson ? `${c.name}: lo paga la persona` : locked ? 'Disponible cuando la persona esté activada' : `Contratar ${c.name}`
        return (
          <button
            key={c.planId}
            type="button"
            disabled={locked && !cur}
            onClick={() => onPick(c)}
            title={title}
            className="ui-press inline-flex items-center gap-1.5 h-7 pl-1 pr-2.5 rounded-full text-[12px] font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={style}
          >
            <ProviderLogo src={c.logoUrl} providerKey={c.providerKey} label={c.name} size={20} />
            {c.name}
            {byCompany && <span className="font-semibold opacity-80">· {cur?.status === 4 ? 'baja' : cur?.status === 2 ? 'activo' : 'alta'}</span>}
            {byPerson && <span className="font-semibold opacity-80">· por la persona</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Hasta 5 números de página alrededor de la actual. */
function pageWindow(current: number, total: number): number[] {
  const start = Math.max(1, Math.min(current - 2, total - 4))
  const end = Math.min(total, start + 4)
  const out: number[] = []
  for (let n = start; n <= end; n++) out.push(n)
  return out
}
