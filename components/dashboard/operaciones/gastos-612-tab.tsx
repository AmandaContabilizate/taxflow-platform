'use client'

import { Check, Loader2, PackagePlus, Sparkles, Trash2, X } from 'lucide-react'
import { type ReactNode, memo, useMemo, useState } from 'react'
import { useDeclarationInvoices } from '@/features/declarations/hooks/useDeclarationQueries'
import type { InvoiceFilterKey } from '@/features/declarations/hooks/declarationQueryKeys'
import { createFixedAsset } from '@/features/fixed-assets/actions/createFixedAsset.action'
import { updateFixedAsset } from '@/features/fixed-assets/actions/updateFixedAsset.action'
import { useFixedAssetTypes, useFixedAssets } from '@/features/fixed-assets/hooks/useFixedAssets'
import {
  type FixedAsset,
  type FixedAssetStatus,
  type FixedAssetType,
  fixedAssetStatusIs,
} from '@/features/fixed-assets/types'
import type { DeclarationInvoice } from '@/features/operations/types'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'
import {
  InlineNotice,
  PanelHeader612,
  SimpleTable,
  cellClass,
  cellMoneyClass,
  cellMoneyStyle,
  fmtFecha,
  fmtMoney,
  fmtPercent,
  periodoLabel,
} from './parts-612'

const TAKE = 100

/** Gastos recibidos: el EP no filtra por "es gasto", así que se piden las recibidas y se acotan aquí. */
const RECIBIDAS: InvoiceFilterKey = {
  isIssued: false,
  invoiceTypeId: null,
  clasificada: null,
  sortBy: 'invoiceDate',
  sortDir: 'asc',
}

const upper = (s: string | null | undefined) => (s ?? '').trim().toUpperCase()

/** Solo facturas de ingreso del proveedor (I) y pagos (P): son las que originan capas. */
const esGasto = (inv: DeclarationInvoice) =>
  (inv.invoiceTypeId === 1 || inv.invoiceTypeId === 4) && !inv.esNomina && !inv.esRetencion

function typeLabel(t: FixedAssetType) {
  const tope = t.deductibleCap ? ` · tope ${fmtMoney(t.deductibleCap)}` : ''
  return `${t.name} · ${fmtPercent(t.annualRate)} anual${tope}`
}

function TypeSelect({
  types,
  value,
  onChange,
  disabled,
}: {
  types: FixedAssetType[]
  value: string
  onChange: (code: string) => void
  disabled?: boolean
}) {
  const known = types.some((t) => t.code === value)
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="px-2.5 py-2 rounded-lg text-[12.5px] max-w-[260px] disabled:opacity-60"
      style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
    >
      {!value && <option value="">Elige el tipo…</option>}
      {value && !known && <option value={value}>{value}</option>}
      {types.map((t) => (
        <option key={t.code} value={t.code}>
          {typeLabel(t)}
        </option>
      ))}
    </select>
  )
}

function SmallBtn({
  children,
  onClick,
  disabled,
  kind = 'ghost',
  title,
}: {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  kind?: 'ghost' | 'brand' | 'danger'
  title?: string
}) {
  const style =
    kind === 'brand'
      ? { background: 'linear-gradient(135deg,#00D3A1 0%,#00AD87 100%)', color: '#fff' }
      : kind === 'danger'
        ? { background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--violet-ink)' }
        : { background: 'var(--card)', border: '1px solid var(--border-strong)', color: 'var(--foreground)' }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold whitespace-nowrap transition hover:opacity-90 disabled:opacity-60"
      style={style}
    >
      {children}
    </button>
  )
}

function UuidShort({ uuid }: { uuid: string | null | undefined }) {
  if (!uuid) return <span style={{ color: 'var(--ink-500)' }}>—</span>
  return (
    <code title={uuid} style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>
      {uuid.slice(0, 8)}…{uuid.slice(-4)}
    </code>
  )
}

/**
 * Pestaña Gastos del 612: sugerencias de activo fijo (IA o regla por clave de producto),
 * alta manual desde cualquier gasto y lista de activos confirmados con sus capas. Nada de esto
 * cambia el cálculo hasta que el contador pulsa Recalcular: por eso cada cambio avisa al detalle.
 */
export const Gastos612Tab = memo(function Gastos612Tab({
  declarationId,
  rfc,
  onRequiereRecalculo,
}: {
  declarationId: number
  rfc: string
  onRequiereRecalculo: (motivo: string) => void
}) {
  const { query: assetsQ, invalidate } = useFixedAssets(declarationId, rfc)
  const typesQ = useFixedAssetTypes()
  const types = useMemo(() => typesQ.data ?? [], [typesQ.data])
  const typeByCode = useMemo(() => new Map(types.map((t) => [t.code, t])), [types])

  const [skip, setSkip] = useState(0)
  const { query: invQ } = useDeclarationInvoices(declarationId, false, RECIBIDAS, skip)
  const page = invQ.data
  const gastos = useMemo(() => (page?.items ?? []).filter(esGasto), [page])

  const assets = useMemo(() => assetsQ.data ?? [], [assetsQ.data])
  const sugeridos = useMemo(() => assets.filter((a) => fixedAssetStatusIs(a, 'Sugerido')), [assets])
  const confirmados = useMemo(() => assets.filter((a) => fixedAssetStatusIs(a, 'Confirmado')), [assets])
  // Un descartado no bloquea volver a marcar la factura.
  const assetByUuid = useMemo(() => {
    const m = new Map<string, FixedAsset>()
    for (const a of assets) if (!fixedAssetStatusIs(a, 'Descartado')) m.set(upper(a.originUuid), a)
    return m
  }, [assets])

  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  // Tipo elegido por sugerencia o activo antes de guardar (id → code).
  const [tipoDraft, setTipoDraft] = useState<Record<number, string>>({})
  // Gasto que se está marcando (UUID) con su borrador.
  const [marcando, setMarcando] = useState<{ uuid: string; tipo: string; descripcion: string } | null>(null)

  const despuesDeGuardar = async (texto: string) => {
    setAviso(texto)
    onRequiereRecalculo(texto)
    await invalidate()
  }

  const actualizar = async (
    asset: FixedAsset,
    cambios: { status?: FixedAssetStatus; assetTypeCode?: string },
    texto: string,
  ) => {
    setBusy(`a-${asset.id}`)
    setError(null)
    const res = await updateFixedAsset(asset.id, cambios)
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setTipoDraft((prev) => {
      const next = { ...prev }
      delete next[asset.id]
      return next
    })
    await despuesDeGuardar(texto)
  }

  const confirmar = (a: FixedAsset) => {
    const tipo = tipoDraft[a.id]
    void actualizar(
      a,
      { status: 'Confirmado', ...(tipo && tipo !== a.assetTypeCode ? { assetTypeCode: tipo } : {}) },
      'Confirmaste un activo fijo.',
    )
  }

  const marcar = async () => {
    if (!marcando) return
    if (!marcando.tipo) {
      setError('Elige el tipo de activo fijo.')
      return
    }
    setBusy(`m-${marcando.uuid}`)
    setError(null)
    const res = await createFixedAsset({
      rfc,
      declarationId,
      invoiceUuid: marcando.uuid,
      assetTypeCode: marcando.tipo,
      description: marcando.descripcion,
    })
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setMarcando(null)
    await despuesDeGuardar('Marcaste un gasto como activo fijo.')
  }

  const assetsLoading = assetsQ.isPending
  const assetsError = assetsQ.isError ? assetsQ.error.message : null
  const typesError = typesQ.isError ? typesQ.error.message : null
  const totalPages = Math.max(1, Math.ceil((page?.total ?? 0) / TAKE))

  return (
    <div className="flex flex-col gap-4">
      {aviso && (
        <InlineNotice kind="success">
          <span className="font-semibold">{aviso}</span> El cálculo no cambia hasta que pulses{' '}
          <strong>Recalcular</strong>.
        </InlineNotice>
      )}
      {error && <InlineNotice kind="error">{error}</InlineNotice>}
      {typesError && <InlineNotice kind="error">Tipos de activo: {typesError}</InlineNotice>}

      {/* Sugerencias */}
      <Card>
        <PanelHeader612
          title="Sugerencias de activo fijo"
          subtitle="Las detecta el cálculo por la clave de producto y, si es candidata, con la IA. Confirma, cambia el tipo o descarta."
        />
        {assetsLoading ? (
          <Cargando texto="Cargando activos fijos…" />
        ) : assetsError ? (
          <div className="p-5">
            <InlineNotice kind="error">{assetsError}</InlineNotice>
          </div>
        ) : sugeridos.length === 0 ? (
          <Vacio texto="No hay sugerencias pendientes." />
        ) : (
          <SimpleTable headers={['Gasto', 'Origen', 'Monto a depreciar', 'Tipo', '']} align={new Set([2])}>
            {sugeridos.map((a) => {
              const ocupado = busy === `a-${a.id}`
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass}>
                    <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                      {a.description || 'Sin descripción'}
                    </div>
                    {a.motivo && (
                      <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                        {a.motivo}
                      </div>
                    )}
                  </td>
                  <td className={cellClass}>
                    <div className="flex flex-col gap-1 items-start">
                      <UuidShort uuid={a.originUuid} />
                      {a.source && (
                        <Badge kind={upper(a.source) === 'IA' ? 'sky' : 'default'}>
                          {upper(a.source) === 'IA' && <Sparkles size={10} />} {a.source}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>{fmtMoney(a.amount)}</td>
                  <td className={cellClass}>
                    <TypeSelect
                      types={types}
                      value={tipoDraft[a.id] ?? a.assetTypeCode ?? ''}
                      onChange={(code) => setTipoDraft((prev) => ({ ...prev, [a.id]: code }))}
                      disabled={ocupado}
                    />
                  </td>
                  <td className={cellClass}>
                    <div className="flex items-center gap-1.5 justify-end">
                      <SmallBtn kind="brand" onClick={() => confirmar(a)} disabled={busy != null}>
                        {ocupado ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Confirmar
                      </SmallBtn>
                      <SmallBtn
                        kind="danger"
                        onClick={() => void actualizar(a, { status: 'Descartado' }, 'Descartaste una sugerencia.')}
                        disabled={busy != null}
                      >
                        <X size={12} /> Descartar
                      </SmallBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </SimpleTable>
        )}
      </Card>

      {/* Activos confirmados */}
      <Card>
        <PanelHeader612
          title="Activos fijos confirmados"
          subtitle="Cada capa es un monto que se deprecia (la factura PUE o cada pago de una PPD); empieza el mes siguiente al pago."
        />
        {assetsLoading ? (
          <Cargando texto="Cargando activos fijos…" />
        ) : assetsError ? null : confirmados.length === 0 ? (
          <Vacio texto="Este contribuyente no tiene activos fijos confirmados." />
        ) : (
          <SimpleTable headers={['Activo', 'Tipo', 'Origen', 'Capas', '']}>
            {confirmados.map((a) => {
              const t = typeByCode.get(a.assetTypeCode)
              const draft = tipoDraft[a.id]
              const ocupado = busy === `a-${a.id}`
              const tasa = a.annualRate ?? t?.annualRate ?? null
              const tope = a.deductibleCap ?? t?.deductibleCap ?? null
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass}>
                    <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                      {a.description || a.assetTypeName || t?.name || 'Activo fijo'}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {fmtPercent(tasa)} anual{tope ? ` · tope ${fmtMoney(tope)}` : ''}
                    </div>
                  </td>
                  <td className={cellClass}>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <TypeSelect
                        types={types}
                        value={draft ?? a.assetTypeCode ?? ''}
                        onChange={(code) => setTipoDraft((prev) => ({ ...prev, [a.id]: code }))}
                        disabled={ocupado}
                      />
                      {draft && draft !== a.assetTypeCode && (
                        <SmallBtn
                          onClick={() => void actualizar(a, { assetTypeCode: draft }, 'Cambiaste el tipo de un activo fijo.')}
                          disabled={busy != null}
                        >
                          {ocupado ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar tipo
                        </SmallBtn>
                      )}
                    </div>
                  </td>
                  <td className={cellClass}>
                    <UuidShort uuid={a.originUuid} />
                  </td>
                  <td className={cellClass}>
                    {(a.layers ?? []).length === 0 ? (
                      <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
                        Sin capas todavía: se crean al recalcular el mes del pago.
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {(a.layers ?? []).map((l, i) => (
                          <div key={l.id ?? `${l.uuid}-${i}`} className="flex items-center gap-2 text-[12px] whitespace-nowrap">
                            <UuidShort uuid={l.uuid} />
                            <span style={cellMoneyStyle}>{fmtMoney(l.amount)}</span>
                            <span style={{ color: 'var(--ink-500)' }}>
                              desde {periodoLabel(l.startFiscalYear, l.startMonth)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={cellClass}>
                    <div className="flex justify-end">
                      <SmallBtn
                        kind="danger"
                        title="Deja de depreciarse; el gasto vuelve a deducirse completo"
                        onClick={() => void actualizar(a, { status: 'Descartado' }, 'Quitaste un activo fijo.')}
                        disabled={busy != null}
                      >
                        <Trash2 size={12} /> Quitar
                      </SmallBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </SimpleTable>
        )}
      </Card>

      {/* Gastos del periodo */}
      <Card>
        <PanelHeader612
          title="Gastos del periodo"
          subtitle="Facturas y pagos recibidos. Marca como activo fijo los que no se deducen de golpe."
        />
        {invQ.isPending ? (
          <Cargando texto="Cargando gastos…" />
        ) : invQ.isError ? (
          <div className="p-5">
            <InlineNotice kind="error">{invQ.error.message}</InlineNotice>
          </div>
        ) : gastos.length === 0 ? (
          <Vacio texto="No hay gastos recibidos en esta página del periodo." />
        ) : (
          <SimpleTable headers={['Fecha', 'Proveedor', 'Concepto', 'Subtotal o pagado', 'IVA', 'Deducible', '']} align={new Set([3, 4])}>
            {gastos.map((inv) => {
              const asset = assetByUuid.get(upper(inv.uuid))
              const enEdicion = marcando?.uuid === inv.uuid
              const ocupado = busy === `m-${inv.uuid}`
              return (
                <tr key={inv.invoiceId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={`${cellClass} whitespace-nowrap`} style={{ color: 'var(--ink-900)' }}>
                    {fmtFecha(inv.invoiceDate)}
                    <div>
                      <UuidShort uuid={inv.uuid} />
                    </div>
                  </td>
                  <td className={cellClass}>
                    <div style={{ color: 'var(--ink-900)' }}>{inv.emitterName}</div>
                    <code style={{ ...MONO, fontSize: '11px', color: 'var(--ink-500)' }}>{inv.emitterRfc}</code>
                  </td>
                  <td className={`${cellClass} max-w-[260px]`} style={{ color: 'var(--ink-700)' }}>
                    {inv.conceptosResumen ?? '—'}
                    {inv.invoiceTypeId === 4 && (
                      <div className="mt-1">
                        <Badge kind="sky">Pago</Badge>
                      </div>
                    )}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>
                    {fmtMoney(Number(inv.paidAmount ?? inv.subTotal) || 0)}
                  </td>
                  <td className={cellMoneyClass} style={cellMoneyStyle}>
                    {inv.ivaAmount == null ? '—' : fmtMoney(Number(inv.ivaAmount) || 0)}
                  </td>
                  <td className={cellClass}>
                    {inv.isDeducible === true ? (
                      <Badge kind="brand">Deducible</Badge>
                    ) : inv.isDeducible === false ? (
                      <Badge kind="coral">No deducible</Badge>
                    ) : (
                      <Badge>Sin clasificar</Badge>
                    )}
                  </td>
                  <td className={cellClass}>
                    {asset ? (
                      <Badge kind={fixedAssetStatusIs(asset, 'Confirmado') ? 'brand' : 'amber'}>
                        Activo fijo · {String(asset.status)}
                      </Badge>
                    ) : enEdicion && marcando ? (
                      <div className="flex flex-col gap-1.5 min-w-[260px]">
                        <TypeSelect
                          types={types}
                          value={marcando.tipo}
                          onChange={(code) => setMarcando({ ...marcando, tipo: code })}
                          disabled={ocupado}
                        />
                        <input
                          value={marcando.descripcion}
                          onChange={(e) => setMarcando({ ...marcando, descripcion: e.target.value })}
                          placeholder="Descripción (p. ej. Laptop Dell)"
                          maxLength={250}
                          className="px-2.5 py-2 rounded-lg text-[12.5px]"
                          style={{ background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }}
                        />
                        <div className="flex items-center gap-1.5">
                          <SmallBtn kind="brand" onClick={() => void marcar()} disabled={busy != null || !marcando.tipo}>
                            {ocupado ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Guardar
                          </SmallBtn>
                          <SmallBtn onClick={() => setMarcando(null)} disabled={ocupado}>
                            Cancelar
                          </SmallBtn>
                        </div>
                      </div>
                    ) : (
                      <SmallBtn
                        onClick={() => {
                          setError(null)
                          setMarcando({ uuid: inv.uuid, tipo: '', descripcion: inv.conceptosResumen ?? '' })
                        }}
                        disabled={busy != null || types.length === 0}
                        title={types.length === 0 ? 'No se pudo cargar el catálogo de tipos' : undefined}
                      >
                        <PackagePlus size={12} /> Marcar como activo fijo
                      </SmallBtn>
                    )}
                  </td>
                </tr>
              )
            })}
          </SimpleTable>
        )}
        {page && page.total > TAKE && (
          <div className="px-5 pb-4">
            <Pagination
              page={Math.floor(skip / TAKE) + 1}
              totalPages={totalPages}
              total={page.total}
              skip={skip}
              take={TAKE}
              itemCount={page.items.length}
              onPrev={() => setSkip((s) => Math.max(0, s - TAKE))}
              onNext={() => setSkip((s) => (s + TAKE < page.total ? s + TAKE : s))}
            />
          </div>
        )}
      </Card>
    </div>
  )
})

function Cargando({ texto }: { texto: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
      <Loader2 size={16} className="animate-spin" /> {texto}
    </div>
  )
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="px-5 py-6 text-[13px]" style={{ color: 'var(--ink-500)' }}>
      {texto}
    </div>
  )
}
