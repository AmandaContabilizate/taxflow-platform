'use client'

import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cancelCompanyService, contractCompanyService } from '@/features/empresa/actions/services.action'
import {
  type CompanyPerson,
  type CompanyServiceCatalogItem,
  type PersonService,
  SERVICE_STATUS_LABELS,
} from '@/features/empresa/types'
import { BILLING_UNITS, billingPeriodLabel } from '@/features/productos/types'
import { MONO } from '../constants'
import { ProviderLogo } from '../productos/provider-logo'

interface Props {
  open: boolean
  person: CompanyPerson | null
  service: CompanyServiceCatalogItem | null
  /** Suscripción viva de esa persona para ese servicio, si la tiene. */
  current: PersonService | null
  partnershipId?: number
  canContract: boolean
  blockedByOverdue: boolean
  onClose: () => void
  /** Avisar al padre que algo cambió (recargar). */
  onChanged: (message: string) => void
}

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const fmt = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—')

/**
 * Panel lateral de un servicio para una persona (prototipo aprobado 2026-11-05): tarjeta del catálogo con el precio
 * pactado, estado si ya lo tiene, y la acción (contratar / dar de baja).
 */
export function ServicioDrawer({ open, person, service, current, partnershipId, canContract, blockedByOverdue, onClose, onChanged }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !person || !service) return null

  const firstName = person.fullName.split(' ')[0]
  const byCompany = current?.payerType === 2
  const byPerson = current?.payerType === 1
  const cancelled = current?.status === 4
  const period = billingPeriodLabel(service.billingPeriod).toLowerCase()
  const unit = BILLING_UNITS.find((u) => u.id === service.billingUnit)?.name.toLowerCase() ?? 'por rfc'

  const contratar = async () => {
    setBusy(true)
    setError(null)
    const res = await contractCompanyService(service.planId, [person.id], partnershipId)
    setBusy(false)
    if (!res.success) return setError(res.error.message)
    const row = res.value.rows[0]
    if (row?.status === 'contratada') {
      onChanged(`${service.name} contratado para ${firstName}. Alta en el proveedor en curso.`)
      onClose()
    } else {
      setError(row?.message ?? 'No se pudo contratar.')
    }
  }

  const baja = async () => {
    if (!current) return
    setBusy(true)
    setError(null)
    const res = await cancelCompanyService(current.subscriptionId, partnershipId)
    setBusy(false)
    if (!res.success) return setError(res.error.message)
    onChanged(`${service.name} dado de baja para ${firstName}. Sigue vigente hasta ${fmt(current.endsAt)}.`)
    onClose()
  }

  return (
    <>
      <div className="ui-modal-overlay fixed inset-0 z-[88] bg-black/45" onClick={onClose} aria-hidden />
      <aside
        className="fixed top-0 right-0 bottom-0 z-[89] w-full max-w-[420px] flex flex-col shadow-2xl"
        style={{ background: 'var(--card)', animation: 'ui-section-in 220ms var(--ease-out-strong) both' }}
        role="dialog"
        aria-labelledby="sd-title"
      >
        <header className="px-5 py-4 flex items-start justify-between gap-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="min-w-0">
            <div className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>Servicio</div>
            <h2 id="sd-title" className="text-[17px] font-extrabold leading-tight" style={{ color: 'var(--ink-900)' }}>{service.name}</h2>
            <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>Para {person.fullName}{person.rfcDeclared ? ` · ${person.rfcDeclared}` : ''}</div>
          </div>
          <button type="button" onClick={onClose} className="ui-press p-1.5 rounded-lg hover:bg-[var(--ink-50)] cursor-pointer" aria-label="Cerrar">
            <X size={18} style={{ color: 'var(--ink-500)' }} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Tarjeta del catálogo */}
          <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col gap-2.5" style={{ border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(34,17,88,0.08)' }}>
            <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: 'var(--coral)' }} />
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}>Servicio</span>
              <span className="text-[11.5px] font-semibold" style={{ color: 'var(--ink-500)' }}>{unit}</span>
            </div>
            <div className="flex items-center gap-3">
              <ProviderLogo src={service.logoUrl} providerKey={service.providerKey} label={service.name} size={40} />
              <div className="min-w-0">
                <div className="text-[16px] font-extrabold leading-tight" style={{ color: 'var(--ink-900)' }}>{service.name}</div>
                {service.shortDescription && <div className="text-[12.5px]" style={{ color: 'var(--ink-500)' }}>{service.shortDescription}</div>}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[24px] font-black tabular-nums leading-none" style={{ color: 'var(--coral)' }}>{money.format(service.price)}</span>
              {service.negotiatedPrice != null && <s className="text-[12.5px]" style={{ color: 'var(--ink-400)' }}>{money.format(service.listPrice)}</s>}
              <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>{period}</span>
            </div>
            {service.negotiatedPrice != null && (
              <div className="text-[11.5px] font-bold rounded-lg px-2.5 py-1 w-fit" style={{ background: 'var(--brand-100)', color: 'var(--brand-900, var(--brand-700))' }}>Precio pactado para tu empresa</div>
            )}
            {service.features && service.features.length > 0 && (
              <ul className="flex flex-col gap-1 mt-1">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                    <span className="mt-[3px] shrink-0 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center" style={{ background: 'var(--coral-soft)', color: 'var(--coral)' }}><Check size={9} strokeWidth={3.5} /></span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {byCompany && current ? (
            <>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
                <dt style={{ color: 'var(--ink-500)' }}>Estado</dt><dd className="font-bold" style={{ color: 'var(--ink-900)' }}>{SERVICE_STATUS_LABELS[current.status] ?? current.status}</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Desde</dt><dd className="font-semibold">{fmt(current.startsAt)}</dd>
                <dt style={{ color: 'var(--ink-500)' }}>{cancelled ? 'Vigente hasta' : 'Siguiente cargo'}</dt><dd className="font-semibold">{fmt(current.endsAt)}</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Al mes</dt><dd className="font-semibold tabular-nums">{money.format(current.priceMxn)}</dd>
              </dl>
              {current.lastError && <div className="text-[12.5px] rounded-xl px-3 py-2" style={{ background: 'var(--danger-soft, #FCDCDC)', color: 'var(--danger-ink, #B91C1C)' }}>{current.lastError}</div>}
              <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
                {cancelled ? 'La baja ya está programada; el servicio sigue hasta el fin del periodo pagado.' : 'Si lo das de baja, sigue vigente hasta el fin del periodo pagado. No hay reembolso del mes en curso.'}
              </div>
            </>
          ) : byPerson ? (
            <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--violet-soft)', color: 'var(--violet-ink)' }}>
              {firstName} ya paga {service.name} por su cuenta. Un servicio tiene un solo pagador; si quieres que lo pague tu empresa, la persona primero cancela el suyo.
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
                <dt style={{ color: 'var(--ink-500)' }}>Se cobra a</dt><dd className="font-bold" style={{ color: 'var(--ink-900)' }}>Tu empresa</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Primer cargo</dt><dd className="font-semibold">Estado de cuenta de este mes</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Alta en proveedor</dt><dd className="font-semibold">1 a 2 días hábiles</dd>
                <dt style={{ color: 'var(--ink-500)' }}>Acceso</dt><dd className="font-semibold">Desde su cuenta</dd>
              </dl>
              <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}>
                {firstName} verá "{service.name} · lo paga tu empresa" en su cuenta y podrá entrar al proveedor. No se le pide nada.
              </div>
              {person.stage !== 9 && (
                <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>Solo se contrata para personas en etapa Activada.</div>
              )}
              {blockedByOverdue && (
                <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--amber-soft)', color: 'var(--violet-ink)' }}>Tu empresa tiene un estado de cuenta vencido; al pagarlo podrás contratar.</div>
              )}
            </>
          )}

          {error && <div className="text-[12.5px] font-semibold rounded-xl px-3 py-2" style={{ background: '#FCDCDC', color: '#E84D4D' }}>{error}</div>}
        </div>

        <footer className="px-5 py-3.5 border-t flex justify-end gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <button type="button" onClick={onClose} className="ui-press px-4 h-10 rounded-full text-[13px] font-bold cursor-pointer hover:bg-[var(--ink-50)]" style={{ color: 'var(--ink-700)' }}>
            {byPerson ? 'Entendido' : 'Cerrar'}
          </button>
          {canContract && byCompany && current && !cancelled && (
            <button type="button" disabled={busy} onClick={() => void baja()} className="ui-press inline-flex items-center gap-2 px-4 h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-60" style={{ background: '#FCDCDC', color: '#B91C1C' }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : null} Dar de baja
            </button>
          )}
          {canContract && !current && person.stage === 9 && !blockedByOverdue && (
            <button type="button" disabled={busy} onClick={() => void contratar()} className="ui-press inline-flex items-center gap-2 px-5 h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-60" style={{ background: 'var(--brand-700)', color: '#fff' }}>
              {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Contratar para {firstName} · {money.format(service.price)}/{period === 'mensual' ? 'mes' : period}
            </button>
          )}
        </footer>
      </aside>
    </>
  )
}
