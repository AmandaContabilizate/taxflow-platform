'use client'

import { Building2, Check, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { getMyCompanies, grantCompanyConsent, revokeCompanyConsent } from '@/features/empresa/actions/myCompanies.action'
import { CONSENT_REQUESTED_SCOPE, CONSENT_SCOPES, type MyCompanyLink, relationLabel } from '@/features/empresa/types'

import { Badge, Card } from '../ui'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Empresas vinculadas a la cuenta del cliente (tarjeta de Mi cuenta). */
export function useMyCompanies() {
  const [links, setLinks] = useState<MyCompanyLink[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const load = useCallback(async () => {
    try {
      const res = await getMyCompanies()
      if (res.success) setLinks(res.value)
      else setError(res.error.message)
    } catch (e) {
      console.error('[useMyCompanies] getMyCompanies falló:', e)
      setError('No pudimos cargar tus empresas.')
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])
  return { links, error, reload: load }
}

/** Sección "Empresas que pueden ver mi información" de Mi cuenta. Vacía = no se pinta nada. */
export function MisEmpresasSection() {
  const { links, error, reload } = useMyCompanies()
  if (error || !links || links.length === 0) return null
  return (
    <div>
      <div className="text-[11px] font-extrabold uppercase tracking-wider mb-2.5 px-1" style={{ color: 'var(--ink-500)' }}>
        Empresas que pueden ver mi información
      </div>
      <div className="flex flex-col gap-3">
        {links.map((l) => (
          <CompanyConsentCard key={l.personId} link={l} onChanged={reload} />
        ))}
      </div>
    </div>
  )
}

function CompanyConsentCard({ link, onChanged }: { link: MyCompanyLink; onChanged: () => Promise<void> }) {
  const requested = link.requestedScope || CONSENT_REQUESTED_SCOPE
  const scopes = CONSENT_SCOPES.filter((s) => (requested & s.bit) === s.bit)
  const [scope, setScope] = useState<number>(link.grantedScope ?? requested)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    setScope(link.grantedScope ?? requested)
    setEditing(false)
  }, [link.grantedScope, link.hasActiveConsent, requested])

  const toggle = (bit: number, required: boolean) => {
    if (required) return
    setScope((prev) => ((prev & bit) === bit ? prev & ~bit : prev | bit))
  }

  const grant = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await grantCompanyConsent(link.personId, scope)
      if (!res.success) return setMsg(res.error.message)
      await onChanged()
      setEditing(false)
    } catch (e) {
      console.error('[CompanyConsentCard] grantCompanyConsent falló:', e)
      setMsg('No pudimos guardar tu autorización. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  const revoke = async () => {
    if (!window.confirm(`¿Retirar la autorización a ${link.companyName}? Dejarán de ver tu información fiscal; si ya te activaron un plan, sigue vigente.`)) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await revokeCompanyConsent(link.personId)
      if (!res.success) return setMsg(res.error.message)
      await onChanged()
    } catch (e) {
      console.error('[CompanyConsentCard] revokeCompanyConsent falló:', e)
      setMsg('No pudimos retirar la autorización. Inténtalo de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[14.5px] truncate" style={{ color: 'var(--ink-900)' }}>{link.companyName}</div>
              <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
                {relationLabel(link.relationType)} · vinculado el {formatDate(link.linkedAt)}
              </div>
            </div>
          </div>
          {link.hasActiveConsent ? (
            <Badge kind="brand">Autorizado hasta {formatDate(link.expiresAt)}</Badge>
          ) : (
            <Badge kind="amber">Sin autorización</Badge>
          )}
        </div>

        {editing ? (
          <>
            <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
              Elige qué puede ver {link.companyName}. Nunca verá tu CIEC ni entrará a tu cuenta, y puedes cambiarlo cuando quieras.
            </div>
            <div className="flex flex-col gap-2">
              {scopes.map((s) => {
                const on = (scope & s.bit) === s.bit
                return (
                  <label key={s.bit} className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${s.required ? '' : 'cursor-pointer'}`} style={{ background: on ? 'var(--brand-50)' : 'var(--ink-50)', border: '1px solid var(--border)' }}>
                    <input type="checkbox" checked={on} disabled={s.required || busy} onChange={() => toggle(s.bit, s.required)} className="w-4 h-4 mt-0.5 cursor-pointer" />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>
                        {s.label}{s.required && <span className="font-normal" style={{ color: 'var(--ink-400)' }}> · obligatorio</span>}
                      </span>
                      <span className="block text-[12px]" style={{ color: 'var(--ink-500)' }}>{s.hint}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            <div className="text-[11.5px]" style={{ color: 'var(--ink-400)' }}>
              Al autorizar aceptas compartir estos datos con {link.companyName} por 12 meses conforme al aviso de privacidad vigente.
            </div>
            {msg && <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>{msg}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" disabled={busy} onClick={() => setEditing(false)} className="px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
                Cancelar
                </button>
              <button type="button" disabled={busy} onClick={() => void grant()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition hover:opacity-95 cursor-pointer disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />} Autorizar
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
              {link.hasActiveConsent
                ? `Al vincularte, ${link.companyName} quedó autorizada para dar seguimiento a tu situación fiscal. Nunca verá tu CIEC ni entrará a tu cuenta, y puedes cambiarlo o retirarlo cuando quieras.`
                : `Retiraste la autorización: ${link.companyName} solo ve en qué paso vas. Puedes volver a autorizarla cuando quieras.`}
            </div>
            {link.hasActiveConsent && (
              <div className="flex flex-wrap gap-1.5">
                {scopes.map((s) => {
                  const on = ((link.grantedScope ?? 0) & s.bit) === s.bit
                  return (
                    <span key={s.bit} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold" style={on ? { background: 'var(--brand-100)', color: 'var(--brand-700)' } : { background: 'var(--ink-50)', color: 'var(--ink-400)', textDecoration: 'line-through' }}>
                      {on && <Check size={12} />} {s.label}
                    </span>
                  )
                })}
              </div>
            )}
            {msg && <div className="text-[13px] px-3 py-2 rounded-lg" style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>{msg}</div>}
            <div className="flex justify-end gap-2">
              {link.hasActiveConsent ? (
                <>
                  <button type="button" disabled={busy} onClick={() => void revoke()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer disabled:opacity-60" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <ShieldOff size={16} />} Retirar
                  </button>
                  <button type="button" disabled={busy} onClick={() => setEditing(true)} className="px-4 py-2.5 rounded-full text-[13.5px] font-bold transition cursor-pointer" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>
                    Cambiar
                  </button>
                </>
              ) : (
                <button type="button" disabled={busy} onClick={() => setEditing(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13.5px] font-bold transition hover:opacity-95 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                  <ShieldCheck size={16} /> Volver a autorizar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </Card>
  )
}
