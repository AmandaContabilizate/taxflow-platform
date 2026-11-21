'use client'

import { AlertCircle, Building2, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getCompaniesForInternal } from '@/features/empresa/actions/getCompaniesForInternal.action'
import type { CompanyListItem, EmpresaError } from '@/features/empresa/types'
import { useHasPermission } from '../permissions'
import { Badge, Card, Tabs } from '../ui'
import { EmpresaFacturacionScreen } from './empresa-facturacion'
import { EmpresaPersonasScreen } from './empresa-personas'
import { EmpresaResumenScreen } from './empresa-resumen'

const TABS = ['Resumen', 'Personas', 'Facturación']

/**
 * Vista interna (spec §5.8, paso 10): Gerencia Comercial (GerenciaComercial.VistaEmpresa) y soporte
 * (Backoffice.SoporteEmpresas) eligen una empresa y ven exactamente lo que ve su administrador, en solo lectura.
 * Con GerenciaComercial.GestionarPersonasEmpresa además da de alta personas (una o masivo) y las invita a nombre
 * de la empresa; la baja no, la pide la empresa. Cada expediente abierto queda en la bitácora marcado como "interno".
 */
export function EmpresasVistaScreen() {
  const canManagePersons = useHasPermission('GerenciaComercial.GestionarPersonasEmpresa')
  const [items, setItems] = useState<CompanyListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<EmpresaError | null>(null)
  const [selected, setSelected] = useState<CompanyListItem | null>(null)
  const [tab, setTab] = useState(0)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const res = await getCompaniesForInternal(true)
        if (res.success) setItems(res.value)
        else setError(res.error)
      } catch (e) {
        console.error('[EmpresasVistaScreen] getCompaniesForInternal falló:', e)
        setError({ statusCode: 500, message: 'No pudimos cargar las empresas. Recarga la página e inténtalo de nuevo.' })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return <Card><div className="py-10 flex items-center justify-center gap-2" style={{ color: 'var(--ink-500)' }}><Loader2 size={18} className="animate-spin" /> Cargando empresas…</div></Card>
  }
  if (error) {
    return <Card><div className="py-10 text-center flex flex-col items-center gap-3"><AlertCircle size={22} style={{ color: 'var(--violet-ink)' }} /><div className="text-[13.5px]" style={{ color: 'var(--ink-700)' }}>{error.message}</div></div></Card>
  }

  if (!selected) {
    return (
      <div className="flex flex-col gap-5 max-w-full">
        <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
          Elige una empresa para ver su resumen, sus personas y su facturación tal como los ve su administrador. Solo lectura.
        </div>
        {items.length === 0 ? (
          <Card>
            <div className="py-12 text-center flex flex-col items-center gap-3">
              <Building2 size={26} style={{ color: 'var(--ink-400)' }} />
              <div className="text-[15px] font-bold" style={{ color: 'var(--ink-900)' }}>Ninguna alianza opera como empresa todavía</div>
              <p className="text-[13px] max-w-[420px]" style={{ color: 'var(--ink-500)' }}>Se activan desde Partners, botón de edificio, "Activar como empresa".</p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((c) => (
              <button
                key={c.partnershipId}
                type="button"
                onClick={() => { setSelected(c); setTab(0) }}
                className="text-left rounded-3xl p-5 transition hover:-translate-y-[1px] cursor-pointer"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-ink)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[15px] font-extrabold truncate" style={{ color: 'var(--ink-900)' }}>{c.legalName?.trim() || c.name}</div>
                    <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{c.code}{c.accountExecutiveName ? ` · ${c.accountExecutiveName}` : ''}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge kind={c.isActive ? 'brand' : 'default'}>{c.isActive ? 'Activa' : 'Inactiva'}</Badge>
                    {c.hasSso && <Badge kind="sky">SSO</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Mini label="Personas" value={c.personsCount} />
                  <Mini label="Por activar" value={c.readyToActivate} tone={c.readyToActivate > 0 ? 'warn' : undefined} />
                  <Mini label="Activadas" value={c.activated} tone={c.activated > 0 ? 'ok' : undefined} />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button type="button" onClick={() => setSelected(null)} className="px-3 py-1.5 rounded-full text-[12.5px] font-bold transition cursor-pointer" style={{ background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}>
            ← Empresas
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <Building2 size={16} style={{ color: 'var(--brand-700)' }} />
            <span className="text-[15px] font-extrabold truncate" style={{ color: 'var(--ink-900)' }}>{selected.legalName?.trim() || selected.name}</span>
            <Badge kind="amber">{canManagePersons ? 'Vista interna · altas e invitaciones a nombre de la empresa' : 'Vista interna · solo lectura'}</Badge>
          </div>
        </div>
        <Tabs items={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === 0 && <EmpresaResumenScreen partnershipId={selected.partnershipId} />}
      {tab === 1 && <EmpresaPersonasScreen partnershipId={selected.partnershipId} canInvite={canManagePersons} canDeactivate={false} canContractServices={false} />}
      {tab === 2 && <EmpresaFacturacionScreen partnershipId={selected.partnershipId} />}
    </div>
  )
}

function Mini({ label, value, tone }: { label: string; value: number; tone?: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? 'var(--violet-ink)' : 'var(--ink-900)'
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--ink-50)' }}>
      <div className="text-[10.5px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>{label}</div>
      <div className="text-[18px] font-extrabold" style={{ color }}>{value}</div>
    </div>
  )
}
