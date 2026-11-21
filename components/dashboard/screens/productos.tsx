'use client'

import { AlertCircle, Loader2, Package, Pencil, Plus, Power, Search } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { deactivateProducto, getProductos, saveProducto } from '@/features/productos/actions/productos.action'
import {
  BILLING_UNITS,
  PRODUCT_TYPES,
  type Producto,
  billingPeriodLabel,
  productTypeLabel,
  providerLabel,
} from '@/features/productos/types'
import { MONO } from '../constants'
import { ProductoModal } from '../productos/producto-modal'
import { ProviderLogo } from '../productos/provider-logo'
import { Badge, type BadgeKind, Card } from '../ui'

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid var(--border)',
  color: 'var(--foreground)',
} as const

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function typeKind(t: number): BadgeKind {
  if (t === 2) return 'sky'
  if (t === 1) return 'amber'
  return 'brand'
}

/**
 * Catálogo de productos (GESTIÓN): planes, trámites adicionales y servicios de proveedores.
 * Backoffice.ReadProductos consulta; Backoffice.ManageProductos crea, edita y da de baja.
 */
export function ProductosScreen({ permissions = [] }: { permissions?: string[] }) {
  const canManage = permissions.includes('Backoffice.ManageProductos')
  const [items, setItems] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getProductos()
    if (res.success) setItems(res.value)
    else setError(res.error.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((p) => {
      if (!showInactive && !p.isActive) return false
      if (typeFilter !== null && p.productType !== typeFilter) return false
      if (q && !`${p.name} ${p.key} ${p.providerKey ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, showInactive, typeFilter])

  const counts = useMemo(() => {
    const c: Record<number, number> = { 0: 0, 1: 0, 2: 0 }
    for (const p of items) if (p.isActive) c[p.productType] = (c[p.productType] ?? 0) + 1
    return c
  }, [items])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (p: Producto) => {
    setEditing(p)
    setModalOpen(true)
  }

  const onSaved = (saved: Producto) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id)
      if (idx === -1) return [...prev, saved]
      const next = [...prev]
      next[idx] = saved
      return next
    })
    setNotice(`Producto "${saved.name}" guardado.`)
  }

  const toggleActive = async (p: Producto) => {
    setBusyId(p.id)
    setNotice(null)
    try {
      if (p.isActive) {
        if (!window.confirm(`¿Dar de baja "${p.name}"? Dejará de aparecer para vender; lo ya vendido no cambia.`)) return
        const res = await deactivateProducto(p.id)
        if (!res.success) return setNotice(res.error.message)
        setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, isActive: false, deletedAt: new Date().toISOString() } : x)))
        setNotice(`"${p.name}" dado de baja.`)
      } else {
        const res = await saveProducto({
          id: p.id,
          name: p.name,
          price: p.price,
          billingPeriod: p.billingPeriod,
          shortDescription: p.shortDescription,
          features: p.features,
          isActive: true,
          regimeScope: p.regimeScope,
          taxRegimeIds: p.regimes.map((r) => r.taxRegimeId),
          productType: p.productType,
          futureDeclarations: p.futureDeclarations,
          regularizationDeclarations: p.regularizationDeclarations,
          grantsFreeAddOns: p.grantsFreeAddOns,
          canBeGrantedFree: p.canBeGrantedFree,
          allowsQuantity: p.allowsQuantity,
          stripeSubscriptionPriceId: p.stripeSubscriptionPriceId,
          stripeOneTimePriceId: p.stripeOneTimePriceId,
          providerKey: p.providerKey,
          billingUnit: p.billingUnit,
          logoUrl: p.logoUrl,
          confirmMultiRegimeCoverage: true,
        })
        if (!res.success) return setNotice(res.error.message)
        onSaved(res.value)
        setNotice(`"${p.name}" reactivado.`)
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Resumen por tipo + filtros */}
      <Card>
        <div className="px-4 py-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter(null)}
            className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition cursor-pointer"
            style={typeFilter === null ? { background: 'var(--brand-700)', color: '#fff' } : { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
          >
            Todos · {items.filter((p) => p.isActive).length}
          </button>
          {PRODUCT_TYPES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTypeFilter(t.id)}
              className="rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition cursor-pointer"
              style={typeFilter === t.id ? { background: 'var(--brand-700)', color: '#fff' } : { background: 'var(--ink-50)', color: 'var(--ink-700)', border: '1px solid var(--border)' }}
            >
              {t.id === 0 ? 'Planes' : t.id === 1 ? 'Trámites' : 'Servicios'} · {counts[t.id] ?? 0}
            </button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
          <input
            className="w-full h-10 pl-9 pr-3 rounded-xl text-[13.5px] outline-none"
            style={inputStyle}
            placeholder="Nombre, clave o proveedor"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--ink-700)' }}>
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-4 h-4 cursor-pointer" />
          Ver inactivos
        </label>
        <div className="flex-1" />
        {canManage && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-[13px] transition cursor-pointer"
            style={{ background: 'var(--brand-700)', color: '#fff' }}
          >
            <Plus size={15} /> Nuevo producto
          </button>
        )}
      </div>

      {notice && (
        <div className="rounded-xl px-4 py-2.5 text-[13px] font-semibold" style={{ background: 'var(--brand-100)', color: 'var(--brand-700)' }}>{notice}</div>
      )}

      {loading ? (
        <Card>
          <div className="px-5 py-10 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink-500)' }}>
            <Loader2 size={16} className="animate-spin" /> Cargando catálogo…
          </div>
        </Card>
      ) : error ? (
        <Card>
          <div className="px-5 py-8 flex items-center gap-2 text-[13px]" style={{ color: '#E84D4D' }}>
            <AlertCircle size={16} /> {error}
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="px-5 py-12 flex flex-col items-center text-center gap-2">
            <Package size={28} style={{ color: 'var(--ink-300)' }} />
            <p className="text-[14px] font-bold" style={{ color: 'var(--ink-900)' }}>Sin productos con ese filtro</p>
            <p className="text-[12.5px] max-w-sm" style={{ color: 'var(--ink-500)' }}>
              {typeFilter === 2
                ? 'Aún no hay servicios de proveedores. Crea Timbrame, Venvers o Doc2Sign con "Nuevo producto" → Servicio.'
                : 'Cambia el filtro o crea un producto nuevo.'}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto px-2 py-2">
            <table className="w-full text-left" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Producto', 'Tipo', 'Precio', 'Cobertura', 'Stripe', 'Estado', ''].map((h) => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)', opacity: p.isActive ? 1 : 0.55 }}>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        {(p.logoUrl || p.productType === 2) && (
                          <ProviderLogo src={p.logoUrl} providerKey={p.productType === 2 ? p.providerKey : null} label={p.name} size={32} className="shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-semibold" style={{ color: 'var(--ink-900)' }}>{p.name}</div>
                          <div className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                            <code style={{ ...MONO, fontSize: '11.5px' }}>{p.key}</code>
                            {p.shortDescription ? ` · ${p.shortDescription}` : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <Badge kind={typeKind(p.productType)}>{productTypeLabel(p.productType)}</Badge>
                      {p.productType === 2 && (
                        <div className="text-[11.5px] mt-1" style={{ color: 'var(--ink-500)' }}>
                          {providerLabel(p.providerKey)} · {BILLING_UNITS.find((u) => u.id === p.billingUnit)?.name ?? '—'}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="text-[13.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{money.format(p.price)}</div>
                      <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>{billingPeriodLabel(p.billingPeriod)}</div>
                    </td>
                    <td className="py-3 px-3 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
                      {p.regimeScope === 0 ? (
                        <span>Todos los regímenes</span>
                      ) : (
                        <span title={p.regimes.map((r) => r.name ?? '').join(', ')}>
                          {p.regimes.length} régimen{p.regimes.length === 1 ? '' : 'es'}: {p.regimes.map((r) => r.satCode ?? r.name).join(', ')}
                        </span>
                      )}
                      {p.productType === 0 && (p.futureDeclarations > 0 || p.regularizationDeclarations > 0) && (
                        <div className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                          {p.futureDeclarations} a futuro{p.regularizationDeclarations > 0 ? ` · ${p.regularizationDeclarations} regularización` : ''}
                          {p.grantsFreeAddOns ? ' · libera trámites' : ''}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[12px] whitespace-nowrap" style={{ color: 'var(--ink-500)' }}>
                      {p.stripeSubscriptionPriceId ? <div>Recurrente ✓</div> : null}
                      {p.stripeOneTimePriceId ? <div>Pago único ✓</div> : null}
                      {!p.stripeSubscriptionPriceId && !p.stripeOneTimePriceId ? 'Sin precio en Stripe' : null}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {p.isActive ? <Badge kind="brand">Activo</Badge> : <Badge kind="default">Inactivo</Badge>}
                    </td>
                    <td className="py-3 px-3">
                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => openEdit(p)} title="Editar" aria-label={`Editar ${p.name}`} className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer" style={{ border: '1px solid var(--border)' }}>
                            <Pencil size={14} style={{ color: 'var(--ink-500)' }} />
                          </button>
                          <button type="button" disabled={busyId === p.id} onClick={() => void toggleActive(p)} title={p.isActive ? 'Dar de baja' : 'Reactivar'} aria-label={`${p.isActive ? 'Dar de baja' : 'Reactivar'} ${p.name}`} className="p-1.5 rounded-lg transition hover:bg-[var(--ink-50)] cursor-pointer disabled:opacity-60" style={{ border: '1px solid var(--border)' }}>
                            {busyId === p.id ? <Loader2 size={14} className="animate-spin" /> : <Power size={14} style={{ color: p.isActive ? '#E84D4D' : 'var(--brand-700)' }} />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProductoModal open={modalOpen} producto={editing} onClose={() => setModalOpen(false)} onSaved={onSaved} />
    </div>
  )
}
