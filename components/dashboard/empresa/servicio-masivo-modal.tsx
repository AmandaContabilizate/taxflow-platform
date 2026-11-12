'use client'

import { Check, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { contractCompanyService } from '@/features/empresa/actions/services.action'
import type { CompanyPerson, CompanyServiceCatalogItem, ContractServicesResult, PersonService } from '@/features/empresa/types'
import { BILLING_UNITS, billingPeriodLabel } from '@/features/productos/types'
import { Modal } from '../modal'
import { ProviderLogo } from '../productos/provider-logo'

interface Props {
  open: boolean
  persons: CompanyPerson[]
  catalog: CompanyServiceCatalogItem[]
  /** Servicios vivos por persona (clave = id). */
  services: Record<string, PersonService[]>
  partnershipId?: number
  onClose: () => void
  onDone: (result: ContractServicesResult, service: CompanyServiceCatalogItem) => void
}

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

/** Contratación en masa (prototipo aprobado): elegir servicio, ver el resumen y confirmar. */
export function ServicioMasivoModal({ open, persons, catalog, services, partnershipId, onClose, onDone }: Props) {
  const [planId, setPlanId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ContractServicesResult | null>(null)

  useEffect(() => {
    if (!open) return
    setPlanId(catalog[0]?.planId ?? null)
    setError(null)
    setResult(null)
  }, [open, catalog])

  const service = useMemo(() => catalog.find((c) => c.planId === planId) ?? null, [catalog, planId])

  const summary = useMemo(() => {
    if (!service) return { add: 0, has: 0, other: 0, notReady: 0, total: 0 }
    let add = 0, has = 0, other = 0, notReady = 0
    for (const p of persons) {
      const cur = (services[String(p.id)] ?? []).find((s) => s.planId === service.planId)
      if (cur?.payerType === 2) has++
      else if (cur?.payerType === 1) other++
      else if (p.stage !== 9) notReady++
      else add++
    }
    return { add, has, other, notReady, total: add * service.price }
  }, [persons, services, service])

  if (!open) return null

  const submit = async () => {
    if (!service) return
    setBusy(true)
    setError(null)
    const ids = persons.filter((p) => p.stage === 9 && !(services[String(p.id)] ?? []).some((s) => s.planId === service.planId)).map((p) => p.id)
    const res = await contractCompanyService(service.planId, ids, partnershipId)
    setBusy(false)
    if (!res.success) return setError(res.error.message)
    setResult(res.value)
    onDone(res.value, service)
  }

  const footer = result ? (
    <div className="flex justify-end">
      <button type="button" onClick={onClose} className="ui-press px-5 h-10 rounded-full text-[13px] font-bold cursor-pointer" style={{ background: 'var(--brand-700)', color: '#fff' }}>Listo</button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <span className="flex-1 text-[12px]" style={{ color: 'var(--ink-400)' }}>{summary.add > 0 ? 'Entra al estado de cuenta de este mes.' : ''}</span>
      <button type="button" onClick={onClose} className="ui-press px-4 h-10 rounded-full text-[13px] font-bold cursor-pointer hover:bg-[var(--ink-50)]" style={{ color: 'var(--ink-700)' }}>Cancelar</button>
      <button type="button" disabled={busy || summary.add === 0} onClick={() => void submit()} className="ui-press inline-flex items-center gap-2 px-5 h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" style={{ background: 'var(--brand-700)', color: '#fff' }}>
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} {summary.add > 0 ? `Contratar ${summary.add}` : 'Nada que contratar'}
      </button>
    </div>
  )

  return (
    <Modal isOpen={open} onClose={onClose} title="Contratar servicio" subtitle={`${persons.length} persona${persons.length === 1 ? '' : 's'} seleccionada${persons.length === 1 ? '' : 's'}`} maxWidth={600} footer={footer}>
      {result ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl px-4 py-3 text-[13.5px] font-bold" style={{ background: 'var(--brand-100)', color: 'var(--brand-900, var(--brand-700))' }}>
            {result.contracted} contratada{result.contracted === 1 ? '' : 's'} · {money.format(result.monthlyTotal)} nuevo al mes
            {result.skipped ? ` · ${result.skipped} omitida${result.skipped === 1 ? '' : 's'}` : ''}{result.failed ? ` · ${result.failed} con error` : ''}
          </div>
          {result.rows.filter((r) => r.status !== 'contratada').length > 0 && (
            <ul className="flex flex-col gap-1 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
              {result.rows.filter((r) => r.status !== 'contratada').map((r) => (
                <li key={`${r.companyPersonId}-${r.status}`} className="flex gap-2">
                  <span className="font-bold shrink-0" style={{ color: r.status === 'error' ? '#B91C1C' : 'var(--ink-500)' }}>{r.status === 'error' ? 'Error' : 'Omitida'}</span>
                  <span>{r.personName || `#${r.companyPersonId}`}{r.message ? ` · ${r.message}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {catalog.length === 0 ? (
            <p className="text-[13px]" style={{ color: 'var(--ink-500)' }}>Aún no hay servicios en el catálogo.</p>
          ) : (
            <div className="grid sm:grid-cols-3 gap-2">
              {catalog.map((c) => {
                const active = c.planId === planId
                return (
                  <button
                    key={c.planId}
                    type="button"
                    onClick={() => setPlanId(c.planId)}
                    className="ui-press flex flex-col items-start gap-2 p-3 rounded-2xl text-left cursor-pointer"
                    style={{ border: `1px solid ${active ? 'var(--coral)' : 'var(--border)'}`, background: active ? 'var(--coral-soft)' : 'var(--card)' }}
                  >
                    <ProviderLogo src={c.logoUrl} providerKey={c.providerKey} label={c.name} size={28} />
                    <span className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{c.name}</span>
                    <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{money.format(c.price)} {billingPeriodLabel(c.billingPeriod).toLowerCase()} · {BILLING_UNITS.find((u) => u.id === c.billingUnit)?.name.toLowerCase()}</span>
                  </button>
                )
              })}
            </div>
          )}

          {service && (
            <div className="rounded-2xl p-3.5 flex flex-col gap-1.5 text-[13.5px]" style={{ border: '1px solid var(--border)' }}>
              <div className="flex justify-between gap-3"><span><b>{service.name}</b> · {money.format(service.price)} al mes</span></div>
              <div className="flex justify-between gap-3"><span>Se contratan hoy</span><b className="tabular-nums">{summary.add}</b></div>
              {summary.has > 0 && <div className="flex justify-between gap-3" style={{ color: 'var(--ink-500)' }}><span>Ya lo tienen por tu empresa</span><b className="tabular-nums">{summary.has}</b></div>}
              {summary.other > 0 && <div className="flex justify-between gap-3" style={{ color: 'var(--violet-ink)' }}><span>Lo pagan por su cuenta (no se duplica)</span><b className="tabular-nums">{summary.other}</b></div>}
              {summary.notReady > 0 && <div className="flex justify-between gap-3" style={{ color: 'var(--violet-ink)' }}><span>Todavía no activadas</span><b className="tabular-nums">{summary.notReady}</b></div>}
              <div className="flex justify-between gap-3 border-t pt-2 mt-1 text-[15px] font-extrabold" style={{ borderColor: 'var(--border)' }}><span>Nuevo al mes</span><b className="tabular-nums">{money.format(summary.total)}</b></div>
            </div>
          )}

          <div className="text-[12.5px] rounded-xl px-3 py-2.5" style={{ background: 'var(--violet-soft)', color: 'var(--violet-ink)' }}>
            Tu empresa paga: la venta se registra en $0 con tu cupón y el servicio entra como renglón en el estado de cuenta del mes.
          </div>
          {error && <div className="text-[12.5px] font-semibold rounded-xl px-3 py-2" style={{ background: '#FCDCDC', color: '#E84D4D' }}>{error}</div>}
        </div>
      )}
    </Modal>
  )
}
