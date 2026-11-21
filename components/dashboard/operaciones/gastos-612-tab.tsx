'use client'

import { Check, History, Loader2, PackageMinus, PackagePlus, Pencil, Sparkles, Trash2, Undo2, X } from 'lucide-react'
import { Fragment, type ReactNode, memo, useMemo, useState } from 'react'
import { useDeclarationInvoices } from '@/features/declarations/hooks/useDeclarationQueries'
import type { InvoiceFilterKey } from '@/features/declarations/hooks/declarationQueryKeys'
import { createFixedAsset } from '@/features/fixed-assets/actions/createFixedAsset.action'
import {
  createCapturedFixedAsset,
  updateCapturedFixedAsset,
} from '@/features/fixed-assets/actions/capturedFixedAsset.action'
import { disposeFixedAsset, revertFixedAssetDisposal } from '@/features/fixed-assets/actions/disposeFixedAsset.action'
import { updateFixedAsset } from '@/features/fixed-assets/actions/updateFixedAsset.action'
import { useFixedAssetTypes, useFixedAssets } from '@/features/fixed-assets/hooks/useFixedAssets'
import {
  type CapturedFixedAssetInput,
  type FixedAsset,
  type FixedAssetDecision,
  type FixedAssetDisposalKind,
  type FixedAssetType,
  fixedAssetIsCaptured,
  fixedAssetStatusIs,
} from '@/features/fixed-assets/types'
import type { DeclarationInvoice } from '@/features/operations/types'
import { Pagination } from '../clientes/parts'
import { MONO } from '../constants'
import { Badge, Card } from '../ui'
import { ActivoCapturadoForm } from './activo-capturado-form'
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

/** El back recorta la descripción a 500 caracteres. */
const DESCRIPCION_MAX = 500

/** Facturas de ingreso del proveedor (I) y pagos (P): son las que originan capas. */
const esGasto = (inv: DeclarationInvoice) =>
  (inv.invoiceTypeId === 1 || inv.invoiceTypeId === 4) && !inv.esNomina && !inv.esRetencion

/** `POST /api/FixedAssets` solo acepta facturas I recibidas (un P → FIXED_ASSET_INVOICE_NOT_EXPENSE). */
const esFacturaI = (inv: DeclarationInvoice) => inv.invoiceTypeId === 1

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

/** Borrador de la baja (venta o pérdida) de un activo confirmado. Todo como texto del formulario. */
interface BajaDraft {
  id: number
  kind: FixedAssetDisposalKind
  disposalDate: string
  salePrice: string
  buyerRfc: string
  buyerName: string
  saleInvoiceUuid: string
  notes: string
}

const inputStyle = { background: 'var(--input)', border: '1px solid var(--border)', color: 'var(--foreground)' }
const inputClass = 'px-2.5 py-2 rounded-lg text-[12.5px] w-full'

function BajaField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11.5px] font-semibold" style={{ color: 'var(--ink-700)' }}>
      {label}
      {children}
    </label>
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

function mesDeFecha(iso: string | null | undefined): { year: number; month: number } | null {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? '')
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]) }
}

/** Desde cuándo dejó de depreciarse un activo dado de baja: se deprecia hasta el mes anterior a la baja (R8). */
function textoBaja(disposalDate: string | null | undefined): string | null {
  const p = mesDeFecha(disposalDate)
  if (!p) return null
  const ant = p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }
  return `Dejó de depreciarse desde ${periodoLabel(p.year, p.month)}; la última depreciación fue en ${periodoLabel(ant.year, ant.month)}.`
}

/** IVA acreditado del activo contra su tope (R3: 28,000 auto, 40,000 eléctrico). Nada si el back no lo manda. */
function IvaTope({ asset }: { asset: FixedAsset }) {
  const cap = asset.ivaCreditCap ?? null
  const credited = asset.ivaCredited ?? null
  if (cap == null && credited == null) return null
  const alcanzado = cap != null && credited != null && credited >= cap - 0.005
  return (
    <div className="text-[11.5px] mt-0.5" style={{ color: alcanzado ? 'var(--violet-ink)' : 'var(--ink-500)' }}>
      IVA acreditado {fmtMoney(credited ?? 0)}
      {cap != null ? ` de un tope de ${fmtMoney(cap)}` : ' (sin tope)'}
      {alcanzado ? ' · tope alcanzado: el IVA de nuevos pagos ya no se acredita' : ''}
    </div>
  )
}

/** Resumen de la captura: monto mensual, desde cuándo y deducible estimado. */
function CapturaResumen({ asset }: { asset: FixedAsset }) {
  const c = asset.capture
  if (!c) {
    return (
      <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
        Capturado sin factura
      </span>
    )
  }
  const deducible = asset.annualRate > 0 ? (c.monthlyAmount * 12) / asset.annualRate : null
  return (
    <div className="flex flex-col gap-0.5 text-[12px] whitespace-nowrap">
      <span>
        <span style={cellMoneyStyle}>{fmtMoney(c.monthlyAmount)}</span>
        <span style={{ color: 'var(--ink-500)' }}> al mes desde {periodoLabel(c.startFiscalYear, c.startMonth)}</span>
      </span>
      {deducible != null && <span style={{ color: 'var(--ink-500)' }}>Deducible estimado {fmtMoney(deducible)}</span>}
    </div>
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

  // `GET /api/FixedAssets` trae todos los activos del contribuyente en todos los estados;
  // `declarationId` solo valida que la declaración sea del RFC. Lo "de esta declaración" se
  // filtra aquí con `suggestedInDeclarationId`.
  const assets = useMemo(() => assetsQ.data ?? [], [assetsQ.data])
  const sugeridosTodos = useMemo(() => assets.filter((a) => fixedAssetStatusIs(a, 'Sugerido')), [assets])
  const sugeridosAqui = useMemo(
    () => sugeridosTodos.filter((a) => a.suggestedInDeclarationId === declarationId),
    [sugeridosTodos, declarationId],
  )
  const [verOtrasSugerencias, setVerOtrasSugerencias] = useState(false)
  const sugeridos = verOtrasSugerencias ? sugeridosTodos : sugeridosAqui
  const otrasSugerencias = sugeridosTodos.length - sugeridosAqui.length
  const confirmados = useMemo(() => assets.filter((a) => fixedAssetStatusIs(a, 'Confirmado')), [assets])
  // Un UUID tiene a lo más un activo por contribuyente, en cualquier estado: un Descartado se
  // vuelve a marcar con PUT (el POST respondería FIXED_ASSET_ALREADY_EXISTS).
  const assetByUuid = useMemo(() => {
    const m = new Map<string, FixedAsset>()
    for (const a of assets) if (a.originUuid) m.set(upper(a.originUuid), a)
    return m
  }, [assets])
  // Pagos (P) que ya son capa de un activo.
  const assetByLayerUuid = useMemo(() => {
    const m = new Map<string, FixedAsset>()
    for (const a of assets) for (const l of a.layers ?? []) m.set(upper(l.uuid), a)
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
    cambios: { status?: FixedAssetDecision; assetTypeCode?: string; description?: string },
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
    const descripcion = marcando.descripcion.trim()
    const descartado = assetByUuid.get(upper(marcando.uuid))
    const res =
      descartado && fixedAssetStatusIs(descartado, 'Descartado')
        ? await updateFixedAsset(descartado.id, {
            status: 'Confirmado',
            ...(marcando.tipo !== descartado.assetTypeCode ? { assetTypeCode: marcando.tipo } : {}),
            ...(descripcion ? { description: descripcion } : {}),
          })
        : await createFixedAsset({
            rfc,
            declarationId,
            invoiceUuid: marcando.uuid,
            assetTypeCode: marcando.tipo,
            ...(descripcion ? { description: descripcion } : {}),
          })
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setMarcando(null)
    await despuesDeGuardar('Marcaste un gasto como activo fijo.')
  }

  // Activo que ya se deprecia y no tiene factura (R7): 'nuevo' = alta; un id = corrección.
  const [capturando, setCapturando] = useState<'nuevo' | number | null>(null)

  const guardarCapturado = async (input: CapturedFixedAssetInput) => {
    const id = capturando
    if (id == null) return
    setBusy(id === 'nuevo' ? 'c-nuevo' : `c-${id}`)
    setError(null)
    const res = id === 'nuevo' ? await createCapturedFixedAsset(input) : await updateCapturedFixedAsset(id, input)
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setCapturando(null)
    await despuesDeGuardar(
      id === 'nuevo' ? 'Agregaste un activo que ya se depreciaba (sin factura).' : 'Corregiste un activo capturado.',
    )
  }

  // Venta o pérdida: el activo deja de depreciarse desde la fecha de baja.
  const [baja, setBaja] = useState<BajaDraft | null>(null)
  const setBajaCampo = (campo: keyof Omit<BajaDraft, 'id'>) => (valor: string) =>
    setBaja((prev) => (prev ? { ...prev, [campo]: valor } : prev))

  const abrirBaja = (a: FixedAsset) =>
    setBaja({
      id: a.id,
      kind: 'Sold',
      disposalDate: '',
      salePrice: '',
      buyerRfc: '',
      buyerName: '',
      saleInvoiceUuid: '',
      notes: '',
    })

  const guardarBaja = async () => {
    if (!baja) return
    const venta = baja.kind === 'Sold'
    const precio = baja.salePrice.trim() ? Number(baja.salePrice.replace(/,/g, '')) : undefined
    setBusy(`b-${baja.id}`)
    setError(null)
    const res = await disposeFixedAsset(baja.id, {
      kind: baja.kind,
      disposalDate: baja.disposalDate,
      ...(venta && precio !== undefined ? { salePrice: precio } : {}),
      ...(venta && baja.buyerRfc.trim() ? { buyerRfc: baja.buyerRfc } : {}),
      ...(venta && baja.buyerName.trim() ? { buyerName: baja.buyerName } : {}),
      ...(venta && baja.saleInvoiceUuid.trim() ? { saleInvoiceUuid: baja.saleInvoiceUuid } : {}),
      ...(baja.notes.trim() ? { notes: baja.notes } : {}),
    })
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    setBaja(null)
    await despuesDeGuardar(venta ? 'Registraste la venta de un activo fijo.' : 'Registraste la pérdida de un activo fijo.')
  }

  const revertirBaja = async (a: FixedAsset) => {
    setBusy(`a-${a.id}`)
    setError(null)
    const res = await revertFixedAssetDisposal(a.id)
    setBusy(null)
    if (!res.success) {
      setError(res.error.message)
      return
    }
    await despuesDeGuardar('Revertiste la baja de un activo fijo: vuelve a depreciarse.')
  }

  const dadosDeBaja = useMemo(
    () => assets.filter((a) => fixedAssetStatusIs(a, 'Vendido') || fixedAssetStatusIs(a, 'Perdido')),
    [assets],
  )

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
          right={
            otrasSugerencias > 0 && (
              <SmallBtn onClick={() => setVerOtrasSugerencias((v) => !v)}>
                {verOtrasSugerencias
                  ? 'Solo las de esta declaración'
                  : `Ver ${otrasSugerencias} de otros meses`}
              </SmallBtn>
            )
          }
        />
        {assetsLoading ? (
          <Cargando texto="Cargando activos fijos…" />
        ) : assetsError ? (
          <div className="p-5">
            <InlineNotice kind="error">{assetsError}</InlineNotice>
          </div>
        ) : sugeridos.length === 0 ? (
          <Vacio
            texto={
              otrasSugerencias > 0
                ? 'Esta declaración no tiene sugerencias pendientes; hay pendientes de otros meses.'
                : 'No hay sugerencias pendientes.'
            }
          />
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
                      <Badge kind={a.source === 'IA' ? 'sky' : 'default'}>
                        {a.source === 'IA' && <Sparkles size={10} />} {a.source}
                      </Badge>
                      {a.suggestedInDeclarationId !== declarationId && (
                        <span className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                          {a.suggestedInDeclarationId != null
                            ? `Sugerido en la declaración #${a.suggestedInDeclarationId}`
                            : 'De otra declaración'}
                        </span>
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
          subtitle="La capa es la factura I sin IVA: se deprecia desde el mes siguiente a su fecha, aunque sea PPD; los pagos (P) solo acreditan IVA. Los capturados sin factura se deprecian con su monto mensual desde el mes en que empezaron."
          right={
            <SmallBtn
              onClick={() => {
                setError(null)
                setCapturando('nuevo')
              }}
              disabled={busy != null || capturando != null || types.length === 0}
              title={
                types.length === 0
                  ? 'No se pudo cargar el catálogo de tipos'
                  : 'Cliente que llega a medio camino: tipo, monto mensual y mes en que empezó'
              }
            >
              <History size={12} /> Agregar activo que ya se deprecia (sin factura)
            </SmallBtn>
          }
        />
        {capturando === 'nuevo' && (
          <div className="px-5 py-4" style={{ background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
            <ActivoCapturadoForm
              rfc={rfc}
              types={types}
              busy={busy === 'c-nuevo'}
              onSubmit={(input) => void guardarCapturado(input)}
              onCancel={() => setCapturando(null)}
            />
          </div>
        )}
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
              const enBaja = baja?.id === a.id ? baja : null
              const capturado = fixedAssetIsCaptured(a)
              const corrigiendo = capturando === a.id
              return (
                <Fragment key={a.id}>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass}>
                    <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                      {a.description || a.assetTypeName || t?.name || 'Activo fijo'}
                    </div>
                    <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>
                      {fmtPercent(tasa)} anual{tope ? ` · tope ${fmtMoney(tope)}` : ''}
                    </div>
                    <IvaTope asset={a} />
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
                    {capturado ? <Badge kind="sky">Capturado</Badge> : <UuidShort uuid={a.originUuid} />}
                  </td>
                  <td className={cellClass}>
                    {capturado ? (
                      <CapturaResumen asset={a} />
                    ) : (a.layers ?? []).length === 0 ? (
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
                    <div className="flex justify-end gap-1.5">
                      {capturado && (
                        <SmallBtn
                          title="Corregir tipo, descripción, monto mensual o mes en que empezó"
                          onClick={() => {
                            setError(null)
                            setCapturando(a.id)
                          }}
                          disabled={busy != null || capturando != null}
                        >
                          <Pencil size={12} /> Corregir
                        </SmallBtn>
                      )}
                      <SmallBtn
                        title="Se vendió o se perdió: deja de depreciarse desde el mes de la baja"
                        onClick={() => abrirBaja(a)}
                        disabled={busy != null || baja != null}
                      >
                        <PackageMinus size={12} /> Dar de baja
                      </SmallBtn>
                      <SmallBtn
                        kind="danger"
                        title="No era activo fijo: deja de depreciarse y el gasto vuelve a deducirse completo"
                        onClick={() => void actualizar(a, { status: 'Descartado' }, 'Quitaste un activo fijo.')}
                        disabled={busy != null}
                      >
                        <Trash2 size={12} /> Quitar
                      </SmallBtn>
                    </div>
                  </td>
                </tr>
                {corrigiendo && (
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <td colSpan={5} className="px-3 py-3">
                      <ActivoCapturadoForm
                        rfc={rfc}
                        types={types}
                        asset={a}
                        busy={busy === `c-${a.id}`}
                        onSubmit={(input) => void guardarCapturado(input)}
                        onCancel={() => setCapturando(null)}
                      />
                    </td>
                  </tr>
                )}
                {enBaja && (
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <td colSpan={5} className="px-3 py-3">
                      <div className="flex flex-col gap-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <BajaField label="Motivo">
                            <select
                              value={enBaja.kind}
                              onChange={(e) => setBajaCampo('kind')(e.target.value)}
                              className={inputClass}
                              style={inputStyle}
                            >
                              <option value="Sold">Venta</option>
                              <option value="Lost">Pérdida (robo, siniestro, desuso)</option>
                            </select>
                          </BajaField>
                          <BajaField label={enBaja.kind === 'Sold' ? 'Fecha de la venta' : 'Fecha de la pérdida'}>
                            <input
                              type="date"
                              value={enBaja.disposalDate}
                              onChange={(e) => setBajaCampo('disposalDate')(e.target.value)}
                              className={inputClass}
                              style={inputStyle}
                            />
                          </BajaField>
                          {enBaja.kind === 'Sold' && (
                            <>
                              <BajaField label="Precio de venta (sin IVA)">
                                <input
                                  inputMode="decimal"
                                  value={enBaja.salePrice}
                                  onChange={(e) => setBajaCampo('salePrice')(e.target.value)}
                                  placeholder="0.00"
                                  className={inputClass}
                                  style={inputStyle}
                                />
                              </BajaField>
                              <BajaField label="RFC del comprador">
                                <input
                                  value={enBaja.buyerRfc}
                                  onChange={(e) => setBajaCampo('buyerRfc')(e.target.value)}
                                  maxLength={13}
                                  className={inputClass}
                                  style={inputStyle}
                                />
                              </BajaField>
                              <BajaField label="Nombre del comprador">
                                <input
                                  value={enBaja.buyerName}
                                  onChange={(e) => setBajaCampo('buyerName')(e.target.value)}
                                  maxLength={300}
                                  className={inputClass}
                                  style={inputStyle}
                                />
                              </BajaField>
                              <BajaField label="UUID de la factura de venta">
                                <input
                                  value={enBaja.saleInvoiceUuid}
                                  onChange={(e) => setBajaCampo('saleInvoiceUuid')(e.target.value)}
                                  className={inputClass}
                                  style={{ ...inputStyle, ...MONO }}
                                />
                              </BajaField>
                            </>
                          )}
                          <BajaField label="Notas">
                            <input
                              value={enBaja.notes}
                              onChange={(e) => setBajaCampo('notes')(e.target.value)}
                              maxLength={1000}
                              className={inputClass}
                              style={inputStyle}
                            />
                          </BajaField>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end">
                          <SmallBtn onClick={() => setBaja(null)} disabled={busy != null}>
                            <X size={12} /> Cancelar
                          </SmallBtn>
                          <SmallBtn kind="brand" onClick={() => void guardarBaja()} disabled={busy != null}>
                            {busy === `b-${a.id}` ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}{' '}
                            Registrar baja
                          </SmallBtn>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
              )
            })}
          </SimpleTable>
        )}
      </Card>

      {/* Activos dados de baja */}
      {dadosDeBaja.length > 0 && (
        <Card>
          <PanelHeader612
            title="Activos fijos dados de baja"
            subtitle="Vendidos o perdidos: se deprecian hasta el mes anterior a la baja y siguen en el cálculo del ejercicio para no perder lo acumulado. Revertir los regresa a Confirmado."
          />
          <SimpleTable headers={['Activo', 'Baja', 'Detalle', '']}>
            {dadosDeBaja.map((a) => {
              const d = a.disposal
              return (
                <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className={cellClass}>
                    <div className="font-semibold" style={{ color: 'var(--ink-900)' }}>
                      {a.description || a.assetTypeName || 'Activo fijo'}
                    </div>
                    {fixedAssetIsCaptured(a) ? <Badge kind="sky">Capturado</Badge> : <UuidShort uuid={a.originUuid} />}
                    <IvaTope asset={a} />
                  </td>
                  <td className={cellClass}>
                    <div className="flex flex-col gap-1 items-start">
                      <Badge kind={fixedAssetStatusIs(a, 'Vendido') ? 'brand' : 'amber'}>{a.status}</Badge>
                      <span className="text-[12px]" style={{ color: 'var(--ink-700)' }}>{fmtFecha(d?.disposalDate)}</span>
                      {textoBaja(d?.disposalDate) && (
                        <span className="text-[11.5px] max-w-[260px]" style={{ color: 'var(--violet-ink)' }}>
                          {textoBaja(d?.disposalDate)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={cellClass}>
                    {fixedAssetStatusIs(a, 'Vendido') ? (
                      <div className="flex flex-col gap-0.5 text-[12px]">
                        <span style={cellMoneyStyle}>{d?.salePrice != null ? fmtMoney(d.salePrice) : 'Sin precio'}</span>
                        <span style={{ color: 'var(--ink-500)' }}>
                          {[d?.buyerName, d?.buyerRfc].filter(Boolean).join(' · ') || 'Sin comprador'}
                        </span>
                        {d?.saleInvoiceUuid && <UuidShort uuid={d.saleInvoiceUuid} />}
                      </div>
                    ) : (
                      <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>{d?.notes || '—'}</span>
                    )}
                  </td>
                  <td className={cellClass}>
                    <div className="flex justify-end">
                      <SmallBtn
                        title="Se capturó por error: vuelve a Confirmado y se sigue depreciando"
                        onClick={() => void revertirBaja(a)}
                        disabled={busy != null}
                      >
                        {busy === `a-${a.id}` ? <Loader2 size={12} className="animate-spin" /> : <Undo2 size={12} />} Revertir
                      </SmallBtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </SimpleTable>
        </Card>
      )}

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
              const descartado = asset != null && fixedAssetStatusIs(asset, 'Descartado')
              const capaDe = assetByLayerUuid.get(upper(inv.uuid))
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
                    {asset && !descartado ? (
                      <Badge kind={fixedAssetStatusIs(asset, 'Confirmado') ? 'brand' : 'amber'}>
                        Activo fijo · {asset.status}
                      </Badge>
                    ) : !esFacturaI(inv) ? (
                      capaDe ? (
                        <Badge kind={fixedAssetStatusIs(capaDe, 'Confirmado') ? 'brand' : 'default'}>
                          Capa de activo fijo
                        </Badge>
                      ) : (
                        <span className="text-[11.5px]" style={{ color: 'var(--ink-500)' }}>
                          Un pago no se marca: marca su factura (I)
                        </span>
                      )
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
                          maxLength={DESCRIPCION_MAX}
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
                          setMarcando({
                            uuid: inv.uuid,
                            tipo: descartado ? asset.assetTypeCode : '',
                            descripcion: (descartado ? asset.description : null) ?? inv.conceptosResumen ?? '',
                          })
                        }}
                        disabled={busy != null || types.length === 0}
                        title={
                          types.length === 0
                            ? 'No se pudo cargar el catálogo de tipos'
                            : descartado
                              ? 'Se descartó antes; vuelve a quedar Confirmado'
                              : undefined
                        }
                      >
                        <PackagePlus size={12} /> {descartado ? 'Volver a marcar como activo fijo' : 'Marcar como activo fijo'}
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
