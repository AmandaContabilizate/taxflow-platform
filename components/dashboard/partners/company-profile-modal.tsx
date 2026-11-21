'use client'

import { AlertCircle, Building2, Check, Loader2, Plus, Save, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getDiscountCodeLookups } from '@/features/discountCodes/actions/getDiscountCodes.action'
import { createCompanyAdmin } from '@/features/partners/actions/createCompanyAdmin.action'
import { getCompanyProfile } from '@/features/partners/actions/getCompanyProfile.action'
import { saveCompanyPrices, saveCompanyProfile } from '@/features/partners/actions/saveCompanyProfile.action'
import type { CompanyBillingMode, CompanyPriceInput, CompanyProfile, Partner } from '@/features/partners/types'
import { getRolesList } from '@/features/roles/actions/getRolesList.action'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { Badge, Tabs } from '../ui'

interface Props {
  open: boolean
  partner: Partner | null
  onClose: () => void
}

const TABS = ['Datos de la empresa', 'Precios pactados', 'Administradores']

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

const mxn = (n: number) => n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
const today = () => new Date().toISOString().slice(0, 10)

interface PriceRow {
  subscriptionPlanId: number | ''
  priceMxn: string
  validFrom: string
  validTo: string
}

/**
 * Perfil de empresa de una alianza (spec-perfil-empresa §5.1): lo que la alianza no tiene (datos
 * fiscales, cobro, topes, modo de lotes), sus precios pactados por plan y sus administradores
 * delegados (rol AdminPartnership ligado a la alianza). Claim Backoffice.ManageEmpresas.
 */
export function CompanyProfileModal({ open, partner, onClose }: Props) {
  const [tab, setTab] = useState(0)
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Id del último partner pedido: si el usuario abre otro partner antes de que llegue la respuesta
  // anterior, esa respuesta se descarta (si no, el modal mostraba y GUARDABA el perfil de otra empresa).
  const requestedIdRef = useRef<number | null>(null)

  const load = async (id: number) => {
    requestedIdRef.current = id
    setLoading(true)
    setLoadError(null)
    try {
      const res = await getCompanyProfile(id)
      if (requestedIdRef.current !== id) return
      if (!res.success) {
        setLoadError(res.error.message)
      } else if (res.value.partnershipId !== id) {
        setLoadError('El perfil recibido no corresponde a esta alianza. Cierra y vuelve a abrir.')
      } else {
        setProfile(res.value)
      }
    } catch (e) {
      if (requestedIdRef.current !== id) return
      // Acción de servidor sin respuesta (cliente viejo tras reiniciar el dev server, etc.).
      console.error('[CompanyProfileModal] getCompanyProfile falló:', e)
      setLoadError('No pudimos cargar el perfil. Recarga la página e inténtalo de nuevo.')
    } finally {
      if (requestedIdRef.current === id) setLoading(false)
    }
  }

  useEffect(() => {
    if (!open || !partner) return
    setTab(0)
    setProfile(null)
    void load(partner.id)
  }, [open, partner])

  if (!open || !partner) return null

  return (
    <Modal isOpen onClose={onClose} title={`Perfil de empresa — ${partner.name}`} maxWidth={760}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs items={TABS} active={tab} onChange={setTab} />
          {profile && (
            <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
              <code style={{ ...MONO, fontSize: 12 }}>{profile.partnershipCode}</code>
              {' · '}
              {profile.linkedUsersCount} {profile.linkedUsersCount === 1 ? 'usuario ligado' : 'usuarios ligados'}
              {profile.hasProfile ? '' : ' · aún no opera como empresa'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={18} className="animate-spin" /> Cargando perfil…
          </div>
        ) : loadError || !profile ? (
          <div className="py-8 flex items-center gap-2 text-[13px]" style={{ color: 'var(--violet-ink)' }}>
            <AlertCircle size={15} /> {loadError ?? 'No se pudo cargar el perfil.'}
          </div>
        ) : tab === 0 ? (
          <DatosTab profile={profile} onSaved={() => void load(partner.id)} />
        ) : tab === 1 ? (
          <PreciosTab profile={profile} onSaved={() => void load(partner.id)} />
        ) : (
          <AdminsTab profile={profile} onSaved={() => void load(partner.id)} />
        )}
      </div>
    </Modal>
  )
}

/* ============================= Datos ============================= */
function DatosTab({ profile, onSaved }: { profile: CompanyProfile; onSaved: () => void }) {
  const [rfc, setRfc] = useState(profile.rfc ?? '')
  const [legalName, setLegalName] = useState(profile.legalName ?? '')
  const [billingEmail, setBillingEmail] = useState(profile.billingEmail ?? '')
  const [stripeCustomerId, setStripeCustomerId] = useState(profile.stripeCustomerId ?? '')
  const [billingMode, setBillingMode] = useState<CompanyBillingMode>(profile.billingMode ?? 1)
  const [maxActivations, setMaxActivations] = useState(profile.maxActivationsPerMonth?.toString() ?? '')
  const [budget, setBudget] = useState(profile.monthlyBudgetMxn?.toString() ?? '')
  const [autoApprove, setAutoApprove] = useState(profile.autoApproveBatches)
  const [blockDays, setBlockDays] = useState(String(profile.blockOnOverdueDays ?? 15))
  const [executiveUserId, setExecutiveUserId] = useState(profile.accountExecutiveUserId ?? '')
  const [hasSso, setHasSso] = useState(profile.hasSso)
  const [isActive, setIsActive] = useState(profile.isActive)
  const [executives, setExecutives] = useState<{ userId: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void (async () => {
      const res = await getDiscountCodeLookups()
      if (res.success) setExecutives(res.value.sellers.map((s) => ({ userId: s.userId, name: s.name })))
    })()
  }, [])

  const canSubmit = rfc.trim().length >= 12 && legalName.trim().length >= 3 && billingEmail.includes('@')

  const submit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    let res: Awaited<ReturnType<typeof saveCompanyProfile>>
    try {
      res = await saveCompanyProfile({
      partnershipId: profile.partnershipId,
      rfc: rfc.trim().toUpperCase(),
      legalName: legalName.trim(),
      billingEmail: billingEmail.trim(),
      stripeCustomerId: stripeCustomerId.trim() || null,
      billingMode,
      maxActivationsPerMonth: maxActivations.trim() === '' ? null : Number(maxActivations),
      monthlyBudgetMxn: budget.trim() === '' ? null : Number(budget),
      autoApproveBatches: autoApprove,
      blockOnOverdueDays: Number(blockDays) || 0,
      accountExecutiveUserId: executiveUserId || null,
      hasSso,
      isActive,
      })
    } catch (e) {
      // Acción de servidor sin respuesta (cliente viejo tras recompilar, etc.): no dejar el botón girando.
      console.error('[CompanyProfileModal] saveCompanyProfile falló:', e)
      setSaving(false)
      setError('No pudimos guardar. Recarga la página e inténtalo de nuevo.')
      return
    }
    setSaving(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setSaved(true)
    onSaved()
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Aviso tipo="error">{error}</Aviso>}
      {saved && <Aviso tipo="ok">Perfil guardado.</Aviso>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="RFC de la empresa">
          <input value={rfc} onChange={(e) => setRfc(e.target.value.toUpperCase())} placeholder="XXX010101XXX" maxLength={13} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={{ ...inputStyle, ...MONO }} />
        </Campo>
        <Campo label="Razón social">
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ej. Medikit, S.A. de C.V." className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
        </Campo>
        <Campo label="Correo de facturación">
          <input type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="facturacion@empresa.com" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
        </Campo>
        <Campo label="Modo de cobro">
          <select value={billingMode} onChange={(e) => setBillingMode(Number(e.target.value) as CompanyBillingMode)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer" style={inputStyle}>
            <option value={1}>Stripe (factura con IVA a la empresa)</option>
            <option value={2}>Transferencia (Finanzas marca el pago)</option>
          </select>
        </Campo>
        {billingMode === 1 && (
          <Campo label="Cliente de Stripe (cus_…)" ayuda="Opcional; se crea al emitir el primer estado de cuenta si va vacío.">
            <input value={stripeCustomerId} onChange={(e) => setStripeCustomerId(e.target.value)} placeholder="cus_…" className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={{ ...inputStyle, ...MONO }} />
          </Campo>
        )}
        <Campo label="Ejecutivo de cuenta" ayuda="Recibe los resúmenes de lotes y avisos del estado de cuenta.">
          <select value={executiveUserId} onChange={(e) => setExecutiveUserId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none cursor-pointer" style={inputStyle}>
            <option value="">Sin ejecutivo de cuenta</option>
            {executives.map((ex) => (
              <option key={ex.userId} value={ex.userId}>{ex.name}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Tope de activaciones por mes" ayuda="Vacío = sin tope.">
          <input type="number" min={0} value={maxActivations} onChange={(e) => setMaxActivations(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
        </Campo>
        <Campo label="Presupuesto mensual (MXN)" ayuda="Vacío = sin tope.">
          <input type="number" min={0} step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
        </Campo>
        <Campo label="Días de vencido para bloquear lotes">
          <input type="number" min={0} value={blockDays} onChange={(e) => setBlockDays(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
        </Campo>
      </div>

      <div className="flex flex-col gap-2.5">
        <Check2 checked={hasSso} onChange={setHasSso} label="Las personas entran por inicio de sesión externo (SSO)" ayuda="Como Medikit: no necesitan invitación, aparecen al entrar desde la plataforma de la empresa." />
        <Check2 checked={autoApprove} onChange={setAutoApprove} label="Modo automático de lotes" ayuda="El lote diario se aprueba solo dentro de los topes. Recomendado: apagado hasta tener confianza con la empresa." />
        <Check2 checked={isActive} onChange={setIsActive} label="Empresa activa" />
      </div>

      <div className="flex justify-end pt-1">
        <button type="button" onClick={() => void submit()} disabled={!canSubmit || saving} className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {profile.hasProfile ? 'Guardar cambios' : 'Activar como empresa'}
        </button>
      </div>
    </div>
  )
}

/* ============================= Precios ============================= */
function PreciosTab({ profile, onSaved }: { profile: CompanyProfile; onSaved: () => void }) {
  const [rows, setRows] = useState<PriceRow[]>(() =>
    profile.prices.map((p) => ({
      subscriptionPlanId: p.subscriptionPlanId,
      priceMxn: String(p.priceMxn),
      validFrom: p.validFrom.slice(0, 10),
      validTo: p.validTo?.slice(0, 10) ?? '',
    })),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const planById = useMemo(() => new Map(profile.planOptions.map((p) => [p.id, p])), [profile.planOptions])

  const update = (i: number, patch: Partial<PriceRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const addRow = () => setRows((prev) => [...prev, { subscriptionPlanId: '', priceMxn: '', validFrom: today(), validTo: '' }])

  const valid = rows.every((r) => r.subscriptionPlanId !== '' && r.priceMxn.trim() !== '' && Number(r.priceMxn) >= 0 && r.validFrom !== '')

  const submit = async () => {
    if (!valid || saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const prices: CompanyPriceInput[] = rows.map((r) => ({
      subscriptionPlanId: Number(r.subscriptionPlanId),
      priceMxn: Number(r.priceMxn),
      validFrom: r.validFrom,
      validTo: r.validTo || null,
    }))
    const res = await saveCompanyPrices(profile.partnershipId, prices)
    setSaving(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setSaved(true)
    onSaved()
  }

  if (!profile.hasProfile)
    return <Aviso tipo="info">Primero guarda los datos de la empresa para capturar sus precios.</Aviso>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
        Precio que paga la empresa por cada activación, por plan a futuro. Un plan sin precio pactado cobra el precio de lista.
      </p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {saved && <Aviso tipo="ok">Precios guardados.</Aviso>}

      {rows.length === 0 ? (
        <div className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-500)' }}>Sin precios pactados: aplica precio de lista.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((r, i) => {
            const plan = r.subscriptionPlanId !== '' ? planById.get(Number(r.subscriptionPlanId)) : undefined
            return (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}>
                <Campo label="Plan">
                  <select value={r.subscriptionPlanId} onChange={(e) => update(i, { subscriptionPlanId: e.target.value === '' ? '' : Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none cursor-pointer" style={inputStyle}>
                    <option value="">Selecciona…</option>
                    {profile.planOptions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} · lista {mxn(p.listPrice)}</option>
                    ))}
                  </select>
                </Campo>
                <Campo label="Precio pactado" ayuda={plan ? `Lista: ${mxn(plan.listPrice)}` : undefined}>
                  <input type="number" min={0} step="0.01" value={r.priceMxn} onChange={(e) => update(i, { priceMxn: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inputStyle} />
                </Campo>
                <Campo label="Desde">
                  <input type="date" value={r.validFrom} onChange={(e) => update(i, { validFrom: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inputStyle} />
                </Campo>
                <Campo label="Hasta" ayuda="Vacío = sin fin">
                  <input type="date" value={r.validTo} onChange={(e) => update(i, { validTo: e.target.value })} className="w-full px-3 py-2 rounded-lg text-[13px] outline-none" style={inputStyle} />
                </Campo>
                <button type="button" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))} aria-label="Quitar precio" className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-80 cursor-pointer" style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-1">
        <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
          <Plus size={14} /> Agregar plan
        </button>
        <button type="button" onClick={() => void submit()} disabled={!valid || saving} className="px-5 py-2.5 rounded-full font-bold text-[13.5px] inline-flex items-center gap-2 transition hover:opacity-95 disabled:opacity-50 cursor-pointer" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Guardar precios
        </button>
      </div>
    </div>
  )
}

/* ============================= Administradores ============================= */
function AdminsTab({ profile, onSaved }: { profile: CompanyProfile; onSaved: () => void }) {
  const [adding, setAdding] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [roleId, setRoleId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)

  // Rol AdminPartnership (el administrador empresarial): se busca por nombre técnico.
  useEffect(() => {
    void (async () => {
      const res = await getRolesList()
      if (!res.success) {
        setError('No pudimos leer el catálogo de roles (hace falta el permiso de ver roles).')
        return
      }
      const r = res.value.find((x) => x.name.trim().toLowerCase() === 'adminpartnership')
      setRoleId(r?.id ?? null)
      if (!r) setError('No existe el rol AdminPartnership en el catálogo.')
    })()
  }, [])

  const canSubmit = fullName.trim().length >= 3 && email.includes('@') && !!roleId

  const submit = async () => {
    if (!canSubmit || saving || !roleId) return
    setSaving(true)
    setError(null)
    setOkMsg(null)
    const res = await createCompanyAdmin({ partnershipId: profile.partnershipId, email, fullName, phone, roleId })
    setSaving(false)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setOkMsg(`Listo: ${email.trim()} recibirá un correo con su contraseña.`)
    setFullName('')
    setEmail('')
    setPhone('')
    setAdding(false)
    onSaved()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>
        Administradores delegados de la empresa (rol Administrador empresarial). Entran con su propio usuario, ven solo su empresa y pueden dar de alta a más usuarios de la empresa.
      </p>
      {error && <Aviso tipo="error">{error}</Aviso>}
      {okMsg && <Aviso tipo="ok">{okMsg}</Aviso>}

      {profile.admins.length === 0 ? (
        <div className="py-6 text-center flex flex-col items-center gap-2" style={{ color: 'var(--ink-500)' }}>
          <Users size={22} style={{ color: 'var(--ink-400)' }} />
          <span className="text-[13px]">Esta empresa aún no tiene administradores.</span>
        </div>
      ) : (
        <ul className="flex flex-col">
          {profile.admins.map((a) => (
            <li key={a.userId} className="py-2.5 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold" style={{ background: 'var(--brand-100)', color: 'var(--brand-900)' }}>
                {(a.fullName || a.email).slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--ink-900)' }}>{a.fullName || a.email}</div>
                <div className="text-[12px] truncate" style={{ color: 'var(--ink-500)' }}>{a.email}</div>
              </div>
              <Badge kind={a.isActive ? 'brand' : 'default'}>{a.isActive ? 'Activo' : 'Inactivo'}</Badge>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <div>
          <button type="button" onClick={() => setAdding(true)} disabled={!roleId} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
            <UserPlus size={14} /> Agregar administrador
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: 'var(--ink-50)', border: '1px solid var(--border)' }}>
          <div className="text-[13px] font-bold flex items-center gap-2" style={{ color: 'var(--ink-900)' }}>
            <Building2 size={15} /> Nuevo administrador de {profile.partnershipName}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Nombre completo">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
            </Campo>
            <Campo label="Correo">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
            </Campo>
            <Campo label="Teléfono (opcional)">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none" style={inputStyle} />
            </Campo>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(false)} disabled={saving} className="px-4 py-2 rounded-full text-[13px] font-bold cursor-pointer" style={{ background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
              Cancelar
            </button>
            <button type="button" onClick={() => void submit()} disabled={!canSubmit || saving} className="px-4 py-2 rounded-full text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer disabled:opacity-50" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Crear y enviar credenciales
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================= piezas ============================= */
function Campo({ label, ayuda, children }: { label: string; ayuda?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold mb-1.5" style={{ color: 'var(--ink-700)' }}>{label}</label>
      {children}
      {ayuda && <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-400)' }}>{ayuda}</div>}
    </div>
  )
}

function Check2({ checked, onChange, label, ayuda }: { checked: boolean; onChange: (v: boolean) => void; label: string; ayuda?: string }) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 mt-0.5 cursor-pointer" />
      <span className="text-[13px]" style={{ color: 'var(--ink-700)' }}>
        <b>{label}</b>
        {ayuda && <span className="block text-[12px]" style={{ color: 'var(--ink-400)' }}>{ayuda}</span>}
      </span>
    </label>
  )
}

function Aviso({ tipo, children }: { tipo: 'ok' | 'error' | 'info'; children: React.ReactNode }) {
  const estilo =
    tipo === 'ok'
      ? { background: 'var(--brand-50)', color: 'var(--brand-700)' }
      : tipo === 'error'
        ? { background: 'var(--danger-soft)', color: 'var(--danger-ink)' }
        : { background: 'var(--violet-soft)', color: 'var(--violet-ink)' }
  return (
    <div className="p-3 rounded-xl text-[13px]" style={estilo}>
      {children}
    </div>
  )
}
