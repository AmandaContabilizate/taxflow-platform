'use client'

import { AlertCircle, FileSpreadsheet, Loader2, Plug, Send, UserPlus, Users } from 'lucide-react'
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { getCompanyPersons } from '@/features/empresa/actions/getCompanyPersons.action'
import { getMyCompanySummary } from '@/features/empresa/actions/getMyCompanySummary.action'
import { inviteCompanyPersons } from '@/features/empresa/actions/managePersons.action'
import type { CompanyPerson, EmpresaError } from '@/features/empresa/types'
import { CargaMasivaModal } from '../empresa/carga-masiva-modal'
import { PersonaModal } from '../empresa/persona-modal'
import { EmpBtn, Pill, type PillTone, fmtDate } from '../empresa/ui'
import { Modal } from '../modal'

const CHANNEL_LABEL: Record<number, string> = {
  1: 'Correo electrónico',
  2: 'SMS',
  3: 'WhatsApp',
  4: 'Enlace directo',
}

/** Estatus de la invitación deducido de la persona: enviada → abierta → con contraseña pendiente → aceptada. */
function inviteStatus(p: CompanyPerson): { label: string; tone: PillTone } {
  if (!p.isActive) return { label: 'Baja', tone: 'gray' }
  if (p.hasAccount && !p.pendingPassword) return { label: 'Aceptada', tone: 'green' }
  if (p.pendingPassword) return { label: 'Sin contraseña', tone: 'amber' }
  if (p.stage >= 3) return { label: 'Abierta', tone: 'blue' }
  return { label: 'Enviada', tone: 'purple' }
}

/**
 * Invitaciones (prototipo "Invitaciones"): cuatro formas de incorporar personas y el historial de invitaciones
 * enviadas, con reenvío. Las invitaciones viven en cada persona (canal, fecha, intentos, etapa), no en una
 * tabla aparte, así que el historial es el listado de personas con invitación, de la más reciente a la más vieja.
 */
export function EmpresaInvitacionesScreen({ partnershipId, canInvite }: { partnershipId?: number; canInvite: boolean }) {
  const [items, setItems] = useState<CompanyPerson[]>([])
  const [total, setTotal] = useState(0)
  const [pending, setPending] = useState<CompanyPerson[]>([])
  const [hasSso, setHasSso] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)
  const [altaOpen, setAltaOpen] = useState(false)
  const [masivaOpen, setMasivaOpen] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const [manualSelected, setManualSelected] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [invited, cargadas, summary] = await Promise.all([
        getCompanyPersons({ invitedOnly: true, pageSize: 200, partnershipId }),
        getCompanyPersons({ stage: 1, pageSize: 200, partnershipId }),
        getMyCompanySummary(partnershipId),
      ])
      if (!invited.success) return setError(invited.error)
      setItems(invited.value.items)
      setTotal(invited.value.total)
      setPending(cargadas.success ? cargadas.value.items : [])
      setHasSso(summary.success ? summary.value.resumen.hasSso : null)
    } catch (e) {
      console.error('[EmpresaInvitacionesScreen] load falló:', e)
      setError({ statusCode: 500, message: 'No pudimos cargar las invitaciones. Recarga la página e inténtalo de nuevo.' })
    } finally {
      setLoading(false)
    }
  }, [partnershipId])

  useEffect(() => {
    void load()
  }, [load])

  const invite = async (ids: number[], tag: string) => {
    setBusy(tag)
    setNotice(null)
    try {
      const res = await inviteCompanyPersons(ids, partnershipId)
      if (!res.success) return setNotice({ text: res.error.message, ok: false })
      const r = res.value
      setNotice({ ok: true, text: `Invitaciones enviadas: ${r.sent}${r.accountsCreated ? ` · cuentas creadas: ${r.accountsCreated}` : ''}${r.skipped ? ` · omitidas: ${r.skipped}` : ''}${r.failed ? ` · con error: ${r.failed}` : ''}` })
      setManualOpen(false)
      setManualSelected(new Set())
      await load()
    } catch (e) {
      console.error('[EmpresaInvitacionesScreen] inviteCompanyPersons falló:', e)
      setNotice({ text: 'No pudimos enviar las invitaciones.', ok: false })
    } finally {
      setBusy(null)
    }
  }

  const resendable = useMemo(() => items.filter((p) => p.isActive && (!p.hasAccount || p.pendingPassword)), [items])
  const manualCandidates = useMemo(() => [...pending, ...resendable.filter((p) => !pending.some((q) => q.id === p.id))], [pending, resendable])

  return (
    <div className="flex flex-col gap-4 max-w-full">
      {canInvite && (
        <div className="flex justify-end">
          <EmpBtn onClick={() => setAltaOpen(true)}><UserPlus size={16} /> Nueva invitación</EmpBtn>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <ActionCard icon={<UserPlus size={17} />} title="Invitación individual" sub="Registra a una persona con sus datos de contacto y envíale la liga." disabled={!canInvite} onClick={() => setAltaOpen(true)} />
        <ActionCard icon={<Users size={17} />} title="Invitación masiva manual" sub={pending.length > 0 ? `${pending.length} persona${pending.length === 1 ? '' : 's'} cargada${pending.length === 1 ? '' : 's'} sin invitar.` : 'Selecciona varias personas ya cargadas.'} disabled={!canInvite || manualCandidates.length === 0} onClick={() => setManualOpen(true)} />
        <ActionCard icon={<FileSpreadsheet size={17} />} title="Carga mediante layout" sub="Sube un archivo Excel o CSV con tus personas." disabled={!canInvite} onClick={() => setMasivaOpen(true)} />
        <ActionCard
          icon={<Plug size={17} />}
          title="Sincronización por API"
          sub={hasSso === null ? 'Entrada por SSO desde tu plataforma.' : hasSso ? 'Activa: tus usuarios entran desde tu plataforma y aparecen aquí solos.' : 'No activa. Pide a tu ejecutivo de cuenta habilitar el SSO de tu empresa.'}
          badge={hasSso === null ? undefined : hasSso ? <Pill tone="green">Activa</Pill> : <Pill tone="gray">No activa</Pill>}
        />
      </div>

      {notice && (
        <div className="text-[13px] px-4 py-2.5 rounded-xl ui-section-enter" style={notice.ok ? { background: 'var(--emp-green-bg)', color: 'var(--emp-green)' } : { background: 'var(--emp-red-bg)', color: 'var(--emp-red)' }}>
          {notice.text}
        </div>
      )}

      <div className="emp-card emp-card-flush">
        <div className="px-5 pt-5 pb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="emp-section-title">Historial de invitaciones</p>
            <p className="emp-section-sub" style={{ margin: 0 }}>{total} invitaci{total === 1 ? 'ón registrada' : 'ones registradas'}</p>
          </div>
          {canInvite && pending.length > 0 && (
            <EmpBtn kind="accent" small disabled={busy !== null} onClick={() => void invite([], 'pending')}>
              {busy === 'pending' ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Invitar pendientes ({pending.length})
            </EmpBtn>
          )}
        </div>
        {loading ? (
          <div className="emp-empty flex items-center justify-center gap-2"><Loader2 size={18} className="animate-spin" /> Cargando invitaciones…</div>
        ) : error ? (
          <div className="emp-empty"><AlertCircle size={28} /><div className="mb-3">{error.message}</div><EmpBtn kind="ghost" small onClick={() => void load()}>Reintentar</EmpBtn></div>
        ) : items.length === 0 ? (
          <div className="emp-empty">
            <Send size={32} />
            <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--ink-900)' }}>Todavía no has enviado invitaciones</div>
            <p className="m-0 max-w-[420px] mx-auto text-[13px]">Registra personas con cualquiera de las opciones de arriba y envíales la liga para que creen su cuenta.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="emp-table">
              <thead>
                <tr>
                  <th>Destinatario</th><th>Canal</th><th>Fecha de envío</th><th>Estatus</th><th>Intentos</th><th>Última interacción</th><th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const st = inviteStatus(p)
                  const canResend = canInvite && p.isActive && (!p.hasAccount || p.pendingPassword)
                  return (
                    <tr key={p.id} className={p.isActive ? '' : 'is-inactive'}>
                      <td>
                        <div className="font-bold" style={{ color: 'var(--ink-900)' }}>{p.fullName}</div>
                        <div className="emp-cell-sub">{p.email}</div>
                      </td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{p.lastInviteChannel ? (CHANNEL_LABEL[p.lastInviteChannel] ?? '—') : '—'}</td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fmtDate(p.lastInviteAt)}</td>
                      <td><Pill tone={st.tone}>{st.label}</Pill></td>
                      <td style={{ color: 'var(--ink-700)' }}>{p.inviteAttempts}</td>
                      <td className="whitespace-nowrap" style={{ color: 'var(--ink-700)' }}>{fmtDate(p.stageUpdatedAt)}</td>
                      <td>
                        {canResend ? (
                          <EmpBtn kind="ghost" small disabled={busy !== null} onClick={() => void invite([p.id], `one-${p.id}`)}>
                            {busy === `one-${p.id}` ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Reenviar
                          </EmpBtn>
                        ) : <span className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PersonaModal open={altaOpen} partnershipId={partnershipId} onClose={() => setAltaOpen(false)} onSaved={() => { setNotice({ ok: true, text: 'Persona registrada. Envíale la liga con "Invitar pendientes" o desde la invitación masiva.' }); void load() }} />
      <CargaMasivaModal open={masivaOpen} partnershipId={partnershipId} onClose={() => setMasivaOpen(false)} onSaved={() => void load()} />

      <Modal
        isOpen={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Invitación masiva manual"
        subtitle="Elige a quién enviarle la liga. A quien ya la recibió se le reenvía."
        maxWidth={620}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{manualSelected.size} seleccionada{manualSelected.size === 1 ? '' : 's'}</span>
            <div className="flex gap-2">
              <EmpBtn kind="ghost" small onClick={() => setManualOpen(false)}>Cancelar</EmpBtn>
              <EmpBtn small disabled={busy !== null || manualSelected.size === 0} onClick={() => void invite([...manualSelected], 'manual')}>
                {busy === 'manual' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Invitar {manualSelected.size || ''}
              </EmpBtn>
            </div>
          </div>
        }
      >
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-2 text-[12.5px] font-bold px-2 py-1.5 cursor-pointer select-none" style={{ color: 'var(--ink-500)' }}>
            <input type="checkbox" className="emp-check" checked={manualCandidates.length > 0 && manualCandidates.every((p) => manualSelected.has(p.id))} onChange={(e) => setManualSelected(e.target.checked ? new Set(manualCandidates.map((p) => p.id)) : new Set())} />
            Todas ({manualCandidates.length})
          </label>
          {manualCandidates.map((p) => {
            const on = manualSelected.has(p.id)
            return (
              <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer" style={{ background: on ? 'var(--emp-blue-bg)' : 'var(--emp-surface-2)', border: '1px solid var(--border)' }}>
                <input type="checkbox" className="emp-check" checked={on} onChange={() => setManualSelected((prev) => { const next = new Set(prev); if (next.has(p.id)) next.delete(p.id); else next.add(p.id); return next })} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold truncate" style={{ color: 'var(--ink-900)' }}>{p.fullName}</span>
                  <span className="block text-[12px] truncate" style={{ color: 'var(--ink-400)' }}>{p.email}</span>
                </span>
                <Pill tone={p.lastInviteAt ? 'amber' : 'gray'}>{p.lastInviteAt ? `Enviada ${fmtDate(p.lastInviteAt)}` : 'Sin enviar'}</Pill>
              </label>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}

function ActionCard({ icon, title, sub, onClick, disabled, badge }: { icon: ReactNode; title: string; sub: string; onClick?: () => void; disabled?: boolean; badge?: ReactNode }) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="emp-kpi-icon" style={{ width: 34, height: 34 }}>{icon}</span>
        {badge}
      </div>
      <div className="text-[15px] font-extrabold mt-3" style={{ color: 'var(--ink-900)' }}>{title}</div>
      <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{sub}</div>
    </>
  )
  if (!onClick) return <div className="emp-card">{inner}</div>
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="emp-card ui-press text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition hover:-translate-y-[1px]">
      {inner}
    </button>
  )
}
