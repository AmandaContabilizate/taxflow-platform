'use client'

import {
  Check as CheckIcon,
  CreditCard,
  Eye,
  FileText,
  Gem,
  ImagePlus,
  Landmark,
  Loader2,
  Lock,
  Plug,
  Search,
  Tag,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { saveProducto } from '@/features/productos/actions/productos.action'
import {
  BILLING_PERIODS,
  BILLING_UNITS,
  PRODUCT_TYPES,
  PROVIDERS,
  type Producto,
  billingPeriodLabel,
} from '@/features/productos/types'
import { getTaxRegimes, type TaxRegime } from '@/features/taxpayers/actions/getTaxRegimes.action'
import { MONO } from '../constants'
import { Modal } from '../modal'
import { ProviderLogo } from './provider-logo'

interface Props {
  open: boolean
  /** null = alta. */
  producto: Producto | null
  onClose: () => void
  onSaved: (saved: Producto) => void
}

/** Color por tipo: el plan es la marca (verde); trámites y servicios toman la familia violeta del sistema. */
const TYPE_META: Record<number, { Icon: LucideIcon; color: string; soft: string; label: string }> = {
  0: { Icon: Gem, color: 'var(--brand-700)', soft: 'var(--brand-100)', label: 'Plan' },
  1: { Icon: FileText, color: 'var(--violet-ink)', soft: 'var(--violet-soft)', label: 'Trámite adicional' },
  2: { Icon: Plug, color: 'var(--coral)', soft: 'var(--coral-soft)', label: 'Servicio' },
}

const inputStyle = {
  background: 'var(--input)',
  border: '1px solid transparent',
  color: 'var(--foreground)',
} as const

const inputCls =
  'w-full h-10 px-3 rounded-xl text-[13.5px] outline-none transition-[box-shadow,border-color] duration-150 focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_var(--brand-100)] disabled:cursor-not-allowed'

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

const LOGO_MAX_SIDE = 256
const LOGO_MAX_CHARS = 400_000
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

/**
 * Lee la imagen y la reduce a 256 px por lado en un canvas (PNG, fondo transparente) para que el data URL
 * pese poco. Los SVG se guardan tal cual si son pequeños.
 */
async function fileToLogoDataUrl(file: File): Promise<string> {
  if (!LOGO_TYPES.includes(file.type)) throw new Error('Usa PNG, JPG, WebP o SVG.')
  if (file.type === 'image/svg+xml') {
    if (file.size > 150_000) throw new Error('El SVG pesa más de 150 KB.')
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
      reader.readAsDataURL(file)
    })
  }
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen.')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const dataUrl = canvas.toDataURL('image/png')
  if (dataUrl.length > LOGO_MAX_CHARS) throw new Error('La imagen sigue pesando demasiado; prueba una más simple.')
  return dataUrl
}

/* ---------- Piezas pequeñas ---------- */

function Section({ title, hint, Icon, accent, soft, delay = 0, children }: {
  title: string
  hint?: string
  Icon: LucideIcon
  accent?: string
  soft?: string
  /** Escalonado de entrada al abrir (ms). */
  delay?: number
  children: React.ReactNode
}) {
  return (
    <section className="ui-section-enter flex flex-col gap-3" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2.5">
        <span
          className="shrink-0 w-7 h-7 rounded-lg inline-flex items-center justify-center transition-colors duration-200"
          style={{ background: soft ?? 'var(--ink-50)', color: accent ?? 'var(--ink-500)' }}
        >
          <Icon size={14} strokeWidth={2.25} />
        </span>
        <div className="min-w-0">
          <h3 className="text-[12.5px] font-extrabold leading-tight" style={{ color: 'var(--ink-900)' }}>{title}</h3>
          {hint && <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-400)' }}>{hint}</p>}
        </div>
      </div>
      <div className="pl-[38px] flex flex-col gap-3">{children}</div>
    </section>
  )
}

function Field({ label, hint, htmlFor, children }: { label: string; hint?: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12.5px] font-bold" style={{ color: 'var(--ink-900)' }}>{label}</label>
      {children}
      {hint && <p className="text-[11.5px] leading-snug" style={{ color: 'var(--ink-400)' }}>{hint}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, hint, accent = 'var(--brand-700)' }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  accent?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="ui-press flex items-start gap-3 text-left rounded-xl px-3 py-2.5 w-full cursor-pointer hover:bg-[var(--ink-50)]"
    >
      <span
        className="relative mt-0.5 shrink-0 w-9 h-5 rounded-full transition-colors duration-200"
        style={{ background: checked ? accent : 'var(--input)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)', transitionTimingFunction: 'var(--ease-out-strong)' }}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold" style={{ color: 'var(--ink-900)' }}>{label}</span>
        {hint && <span className="block text-[11.5px] leading-snug" style={{ color: 'var(--ink-400)' }}>{hint}</span>}
      </span>
    </button>
  )
}

/**
 * Control segmentado con indicador que se desliza entre opciones (transform, 220 ms, ease-out fuerte).
 * `accentFor` colorea el indicador y el texto del seleccionado (p. ej. por tipo de producto).
 */
function Segmented<T extends string | number>({ value, onChange, options, ariaLabel, accentFor, iconFor }: {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ id: T; name: string }>
  ariaLabel: string
  accentFor?: (id: T) => { color: string; soft: string }
  iconFor?: (id: T) => LucideIcon | undefined
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const measure = () => {
      const el = track.querySelector<HTMLElement>(`[data-id="${String(value)}"]`)
      if (!el) return
      setIndicator({ x: el.offsetLeft, w: el.offsetWidth })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, [value])

  const accent = accentFor?.(value)

  return (
    <div ref={trackRef} role="radiogroup" aria-label={ariaLabel} className="relative inline-flex p-1 rounded-xl gap-1 max-w-full" style={{ background: 'var(--ink-50)' }}>
      {indicator && (
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-0 rounded-lg"
          style={{
            width: indicator.w,
            transform: `translateX(${indicator.x}px)`,
            background: accent?.soft ?? 'var(--card)',
            boxShadow: '0 1px 2px rgba(34,17,88,0.10)',
            transition: 'transform 220ms var(--ease-out-strong), width 220ms var(--ease-out-strong), background-color 200ms ease',
          }}
        />
      )}
      {options.map((o) => {
        const active = o.id === value
        const Icon = iconFor?.(o.id)
        const a = accentFor?.(o.id)
        return (
          <button
            key={String(o.id)}
            data-id={String(o.id)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className="ui-press relative z-[1] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-bold whitespace-nowrap cursor-pointer"
            style={{ color: active ? (a?.color ?? 'var(--ink-900)') : 'var(--ink-500)', transition: 'color 200ms ease, transform 160ms var(--ease-out-strong)' }}
          >
            {Icon && <Icon size={14} strokeWidth={2.25} />}
            {o.name}
          </button>
        )
      })}
    </div>
  )
}

/** Tarjeta de vista previa: lo que el cliente verá en Trámites / Mi plan, actualizada en vivo. */
function PreviewCard({ type, name, price, period, shortDescription, features, hasStripe, providerKey, logoUrl }: {
  type: number
  name: string
  price: number
  period: string
  shortDescription: string
  features: string[]
  hasStripe: boolean
  providerKey?: string | null
  logoUrl?: string | null
}) {
  const meta = TYPE_META[type] ?? TYPE_META[0]
  const periodText = period === 'once' ? 'pago único' : billingPeriodLabel(period).toLowerCase()
  const showLogo = type === 2 || !!logoUrl
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 flex flex-col gap-2.5"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 10px 30px rgba(34,17,88,0.08)' }}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 transition-colors duration-300" style={{ background: meta.color }} />
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-300" style={{ background: meta.soft, color: meta.color }}>
          <meta.Icon size={11} strokeWidth={2.5} /> {meta.label}
        </span>
        <span className="text-[11px] font-semibold" style={{ color: hasStripe ? 'var(--brand-700)' : 'var(--ink-400)' }}>
          {hasStripe ? 'Se paga con tarjeta' : 'Sin cobro con tarjeta'}
        </span>
      </div>
      <div className="flex items-start gap-3">
        {showLogo && <ProviderLogo key={logoUrl ?? providerKey ?? 'none'} src={logoUrl} providerKey={providerKey} label={name || undefined} size={40} className="shrink-0 ui-section-enter" />}
        <div className="min-w-0">
          <p className="text-[16px] font-extrabold leading-tight" style={{ color: name ? 'var(--ink-900)' : 'var(--ink-300)' }}>{name || 'Nombre del producto'}</p>
          {shortDescription && <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--ink-500)' }}>{shortDescription}</p>}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[24px] font-black tabular-nums leading-none" style={{ color: meta.color }}>{money.format(price || 0)}</span>
        <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-500)' }}>{periodText}</span>
      </div>
      {features.length > 0 && (
        <ul className="flex flex-col gap-1 mt-0.5">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-[12.5px]" style={{ color: 'var(--ink-700)' }}>
              <span className="mt-[3px] shrink-0 w-3.5 h-3.5 rounded-full inline-flex items-center justify-center" style={{ background: meta.soft, color: meta.color }}>
                <CheckIcon size={9} strokeWidth={3.5} />
              </span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- Modal ---------- */

/** Alta y edición de un producto del catálogo. Los campos cambian según el tipo (plan, trámite, servicio). */
export function ProductoModal({ open, producto, onClose, onSaved }: Props) {
  const [key, setKey] = useState('')
  const [name, setName] = useState('')
  const [productType, setProductType] = useState<number>(0)
  const [price, setPrice] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('month')
  const [shortDescription, setShortDescription] = useState('')
  const [featuresText, setFeaturesText] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [regimeScope, setRegimeScope] = useState<number>(0)
  const [regimeIds, setRegimeIds] = useState<number[]>([])
  const [regimeSearch, setRegimeSearch] = useState('')
  const [futureDeclarations, setFutureDeclarations] = useState('0')
  const [regularizationDeclarations, setRegularizationDeclarations] = useState('0')
  const [grantsFreeAddOns, setGrantsFreeAddOns] = useState(false)
  const [canBeGrantedFree, setCanBeGrantedFree] = useState(false)
  const [allowsQuantity, setAllowsQuantity] = useState(false)
  const [stripeSub, setStripeSub] = useState('')
  const [stripeOnce, setStripeOnce] = useState('')
  const [providerKey, setProviderKey] = useState('timbrame')
  const [billingUnit, setBillingUnit] = useState<number>(1)
  const [confirmCoverage, setConfirmCoverage] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoBusy, setLogoBusy] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [regimes, setRegimes] = useState<TaxRegime[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setSaved(false)
    setConfirmCoverage(false)
    setRegimeSearch('')
    setKey(producto?.key ?? '')
    setName(producto?.name ?? '')
    setProductType(producto?.productType ?? 0)
    setPrice(producto ? String(producto.price) : '')
    setBillingPeriod(producto?.billingPeriod === 'one-time' ? 'once' : (producto?.billingPeriod ?? 'month'))
    setShortDescription(producto?.shortDescription ?? '')
    setFeaturesText((producto?.features ?? []).join('\n'))
    setIsActive(producto?.isActive ?? true)
    setRegimeScope(producto?.regimeScope ?? 0)
    setRegimeIds(producto?.regimes.map((r) => r.taxRegimeId) ?? [])
    setFutureDeclarations(String(producto?.futureDeclarations ?? 0))
    setRegularizationDeclarations(String(producto?.regularizationDeclarations ?? 0))
    setGrantsFreeAddOns(producto?.grantsFreeAddOns ?? false)
    setCanBeGrantedFree(producto?.canBeGrantedFree ?? false)
    setAllowsQuantity(producto?.allowsQuantity ?? false)
    setStripeSub(producto?.stripeSubscriptionPriceId ?? '')
    setStripeOnce(producto?.stripeOneTimePriceId ?? '')
    setProviderKey(producto?.providerKey ?? 'timbrame')
    setBillingUnit(producto?.billingUnit ?? 1)
    setLogoUrl(producto?.logoUrl ?? null)
  }, [open, producto])

  const pickLogo = async (file: File | undefined) => {
    if (!file) return
    setLogoBusy(true)
    setError(null)
    try {
      setLogoUrl(await fileToLogoDataUrl(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la imagen.')
    } finally {
      setLogoBusy(false)
      if (logoInputRef.current) logoInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!open || regimes.length > 0) return
    void getTaxRegimes().then((res) => {
      if (res.success) setRegimes(res.value)
    })
  }, [open, regimes.length])

  const isService = productType === 2
  const isPlan = productType === 0
  const meta = TYPE_META[productType] ?? TYPE_META[0]
  const typeHint = useMemo(() => PRODUCT_TYPES.find((t) => t.id === productType)?.hint ?? '', [productType])
  const regimeById = useMemo(() => new Map(regimes.map((r) => [r.id, r])), [regimes])
  const visibleRegimes = useMemo(() => {
    const q = regimeSearch.trim().toLowerCase()
    if (!q) return regimes
    return regimes.filter((r) => `${r.satCode ?? ''} ${r.name}`.toLowerCase().includes(q))
  }, [regimes, regimeSearch])
  const featureList = useMemo(() => featuresText.split('\n').map((f) => f.trim()).filter(Boolean), [featuresText])
  const needsCoverageConfirm = isPlan && regimeScope === 0 && (Number(futureDeclarations) || 0) > 0

  if (!open) return null

  const toggleRegime = (id: number) =>
    setRegimeIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const submit = async () => {
    const parsedPrice = Number(price)
    if (!producto && key.trim().length < 2) return setError('Escribe una clave corta y única, por ejemplo "timbrame-rfc".')
    if (name.trim().length < 3) return setError('Escribe el nombre del producto.')
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return setError('El precio no es válido.')
    if (regimeScope === 1 && regimeIds.length === 0) return setError('Elige al menos un régimen o cambia a "Todos los regímenes".')
    if (isService && billingPeriod === 'once') return setError('Un servicio se cobra de forma recurrente: elige mensual, semestral o anual.')
    const future = Number(futureDeclarations) || 0
    const regular = Number(regularizationDeclarations) || 0
    if (needsCoverageConfirm && !confirmCoverage)
      return setError('Un plan con declaraciones en "Todos los regímenes" cubre todos los regímenes del cliente al precio de uno. Confírmalo si es a propósito.')

    setLoading(true)
    setError(null)
    try {
      const res = await saveProducto({
        id: producto?.id,
        key: producto ? undefined : key.trim(),
        name,
        price: parsedPrice,
        billingPeriod,
        shortDescription: shortDescription.trim() || null,
        features: featureList,
        isActive,
        regimeScope,
        taxRegimeIds: regimeIds,
        productType,
        futureDeclarations: isService ? 0 : future,
        regularizationDeclarations: isService ? 0 : regular,
        grantsFreeAddOns: isPlan && grantsFreeAddOns,
        canBeGrantedFree: !isPlan && canBeGrantedFree,
        allowsQuantity: !isService && allowsQuantity,
        stripeSubscriptionPriceId: stripeSub.trim() || null,
        stripeOneTimePriceId: stripeOnce.trim() || null,
        providerKey: isService ? providerKey : null,
        billingUnit: isService ? billingUnit : null,
        logoUrl,
        confirmMultiRegimeCoverage: confirmCoverage,
      })
      if (!res.success) return setError(res.error.message)
      // El botón confirma "Guardado" antes de cerrar: el cambio de estado se ve, no solo desaparece.
      setSaved(true)
      onSaved(res.value)
      window.setTimeout(onClose, 450)
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <div className="flex items-center gap-3">
      {error ? (
        <p className="ui-section-enter flex-1 min-w-0 text-[12.5px] font-semibold leading-snug" style={{ color: 'var(--danger-ink)' }} role="alert">{error}</p>
      ) : (
        <p className="flex-1 min-w-0 text-[12px]" style={{ color: 'var(--ink-400)' }}>
          {producto ? 'Los cambios aplican a ventas nuevas; lo ya vendido no cambia.' : 'El producto queda disponible en cuanto lo guardes.'}
        </p>
      )}
      <button type="button" onClick={onClose} className="ui-press px-4 h-10 rounded-full text-[13px] font-bold cursor-pointer hover:bg-[var(--ink-50)]" style={{ color: 'var(--ink-700)' }}>
        Cancelar
      </button>
      <button
        type="button"
        disabled={loading || saved}
        onClick={() => void submit()}
        className="ui-press inline-flex items-center gap-2 px-5 h-10 rounded-full text-[13px] font-bold cursor-pointer disabled:cursor-not-allowed"
        style={{ background: saved ? 'var(--brand-900)' : meta.color, color: '#fff', transition: 'background-color 250ms ease, transform 160ms var(--ease-out-strong)' }}
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <CheckIcon size={15} strokeWidth={saved ? 3 : 2.5} />}
        {saved ? 'Guardado' : producto ? 'Guardar cambios' : 'Crear producto'}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={producto ? producto.name : 'Nuevo producto'}
      subtitle={producto ? <span>Editando · <code style={{ ...MONO, fontSize: '12px' }}>{producto.key}</code></span> : 'Planes, trámites adicionales y servicios de proveedores'}
      maxWidth={760}
      footer={footer}
    >
      <div className="flex flex-col gap-7">
        {/* Tipo */}
        <Section title="Tipo de producto" hint={typeHint} Icon={Tag} accent={meta.color} soft={meta.soft} delay={0}>
          <Segmented
            value={productType}
            onChange={setProductType}
            options={PRODUCT_TYPES}
            ariaLabel="Tipo de producto"
            accentFor={(id) => ({ color: TYPE_META[id].color, soft: TYPE_META[id].soft })}
            iconFor={(id) => TYPE_META[id].Icon}
          />
        </Section>

        {/* Identidad y precio */}
        <Section title="Datos básicos" Icon={Landmark} delay={40}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Clave" htmlFor="pm-key" hint={producto ? 'No se cambia: la usan ventas y cupones.' : 'Única y sin espacios, p. ej. timbrame-rfc'}>
              <div className="relative">
                <input
                  id="pm-key"
                  className={`${inputCls} ${producto ? 'pr-9' : ''}`}
                  style={producto ? { ...inputStyle, background: 'transparent', border: '1px dashed var(--border)', color: 'var(--ink-500)', ...MONO, fontSize: '13px' } : inputStyle}
                  value={key}
                  disabled={!!producto}
                  onChange={(e) => setKey(e.target.value)}
                  autoComplete="off"
                />
                {producto && <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} aria-hidden />}
              </div>
            </Field>
            <Field label="Nombre" htmlFor="pm-name" hint="Como lo verá la empresa y el cliente.">
              <input id="pm-name" className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Precio con IVA" htmlFor="pm-price">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] font-bold transition-colors duration-200" style={{ color: price ? meta.color : 'var(--ink-400)' }}>$</span>
                <input id="pm-price" className={`${inputCls} pl-7 pr-14 tabular-nums`} style={inputStyle} type="number" min={0} step="0.01" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] font-bold" style={{ color: 'var(--ink-400)' }}>MXN</span>
              </div>
            </Field>
            <Field label="Periodo de cobro" htmlFor="pm-period">
              <select id="pm-period" className={inputCls} style={inputStyle} value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)}>
                {BILLING_PERIODS.filter((p) => !isService || p.id !== 'once').map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </Section>

        {/* Específico por tipo: se remonta con key para que entre con su animación */}
        {isService && (
          <div key="service">
            <Section title="Proveedor y cobro" hint="Sin API del proveedor, Soporte hace el alta a mano desde Aprovisionamiento." Icon={Plug} accent={meta.color} soft={meta.soft}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Proveedor" htmlFor="pm-provider">
                  <div className="flex items-center gap-2">
                    <ProviderLogo key={logoUrl ?? providerKey} src={logoUrl} providerKey={providerKey} label={name || undefined} size={40} className="shrink-0 ui-section-enter" />
                    <select id="pm-provider" className={inputCls} style={inputStyle} value={providerKey} onChange={(e) => setProviderKey(e.target.value)}>
                      {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </Field>
                <Field label="Unidad de cobro" hint="Por RFC: un cobro por contribuyente. Por usuario: por cuenta (Doc2Sign).">
                  <Segmented value={billingUnit} onChange={setBillingUnit} options={BILLING_UNITS} ariaLabel="Unidad de cobro" accentFor={() => ({ color: meta.color, soft: meta.soft })} />
                </Field>
              </div>
            </Section>
          </div>
        )}
        {isPlan && (
          <div key="plan">
            <Section title="Declaraciones incluidas" Icon={Gem} accent={meta.color} soft={meta.soft}>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="A futuro" htmlFor="pm-future" hint="Meses que cubre el plan.">
                  <input id="pm-future" className={`${inputCls} tabular-nums`} style={inputStyle} type="number" min={0} inputMode="numeric" value={futureDeclarations} onChange={(e) => setFutureDeclarations(e.target.value)} />
                </Field>
                <Field label="De regularización" htmlFor="pm-regular" hint="Periodos atrasados incluidos.">
                  <input id="pm-regular" className={`${inputCls} tabular-nums`} style={inputStyle} type="number" min={0} inputMode="numeric" value={regularizationDeclarations} onChange={(e) => setRegularizationDeclarations(e.target.value)} />
                </Field>
              </div>
              <div className="-mx-3">
                <Toggle accent={meta.color} checked={grantsFreeAddOns} onChange={setGrantsFreeAddOns} label="Libera trámites adicionales gratis" hint="Los trámites marcados 'puede ir gratis' no se cobran si el carrito trae este plan." />
                <Toggle accent={meta.color} checked={allowsQuantity} onChange={setAllowsQuantity} label="Admite cantidad" hint="El cliente puede comprar más de uno en la misma venta." />
              </div>
            </Section>
          </div>
        )}
        {productType === 1 && (
          <div key="addon">
            <Section title="Reglas del trámite" Icon={FileText} accent={meta.color} soft={meta.soft}>
              <div className="-mx-3">
                <Toggle accent={meta.color} checked={canBeGrantedFree} onChange={setCanBeGrantedFree} label="Puede ir gratis con un plan" hint="No se cobra si el carrito trae un plan que libera trámites." />
                <Toggle accent={meta.color} checked={allowsQuantity} onChange={setAllowsQuantity} label="Admite cantidad" hint="Por ejemplo paquetes de tickets." />
              </div>
            </Section>
          </div>
        )}

        {/* Regímenes */}
        <Section title="Regímenes" hint="A quién se le puede vender según su régimen fiscal." Icon={Landmark} delay={80}>
          <Segmented
            value={regimeScope}
            onChange={setRegimeScope}
            options={[{ id: 0, name: 'Todos los regímenes' }, { id: 1, name: 'Solo los que elija' }]}
            ariaLabel="Cobertura de regímenes"
          />
          {regimeScope === 1 && (
            <div className="ui-section-enter flex flex-col gap-2">
              {regimeIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {regimeIds.map((id) => {
                    const r = regimeById.get(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleRegime(id)}
                        className="ui-press ui-section-enter inline-flex items-center gap-1 pl-2.5 pr-1.5 h-7 rounded-full text-[12px] font-bold cursor-pointer"
                        style={{ background: meta.soft, color: meta.color }}
                        aria-label={`Quitar ${r?.name ?? id}`}
                      >
                        {r?.satCode ?? r?.name ?? id}
                        <X size={12} />
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
                <input
                  className={`${inputCls} pl-9`}
                  style={inputStyle}
                  placeholder="Buscar por código SAT o nombre"
                  value={regimeSearch}
                  onChange={(e) => setRegimeSearch(e.target.value)}
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
                {regimes.length === 0 && (
                  <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Cargando regímenes…</p>
                )}
                {visibleRegimes.map((r) => {
                  const on = regimeIds.includes(r.id)
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleRegime(r.id)}
                      className="ui-press flex items-center gap-3 w-full text-left px-3 py-2 cursor-pointer hover:bg-[var(--ink-50)]"
                      style={{ borderBottom: '1px solid var(--border)' }}
                      aria-pressed={on}
                    >
                      <span
                        className="shrink-0 w-4 h-4 rounded-[5px] inline-flex items-center justify-center transition-[background-color,border-color,transform] duration-150"
                        style={on ? { background: meta.color, transform: 'scale(1)' } : { border: '1.5px solid var(--ink-300)' }}
                      >
                        {on && <CheckIcon size={11} color="#fff" strokeWidth={3} />}
                      </span>
                      <code className="shrink-0 text-[12px]" style={{ ...MONO, color: 'var(--ink-500)' }}>{r.satCode ?? '—'}</code>
                      <span className="text-[12.5px] truncate" style={{ color: 'var(--ink-900)' }}>{r.name}</span>
                    </button>
                  )
                })}
                {regimes.length > 0 && visibleRegimes.length === 0 && (
                  <p className="px-3 py-3 text-[12.5px]" style={{ color: 'var(--ink-400)' }}>Ningún régimen coincide.</p>
                )}
              </div>
            </div>
          )}
          {needsCoverageConfirm && (
            <div className="ui-section-enter -mx-3 rounded-xl" style={{ background: 'var(--brand-50)' }}>
              <Toggle checked={confirmCoverage} onChange={setConfirmCoverage} label="Confirmo que es un plan multi-régimen" hint="Con declaraciones y 'todos los regímenes', una venta cubre cada régimen del cliente al precio de uno." />
            </div>
          )}
        </Section>

        {/* Stripe */}
        <Section title="Cobro con tarjeta (Stripe)" hint="Pega el id del precio creado en Stripe. Vacío = solo se vende desde el expediente o el portal de empresa." Icon={CreditCard} delay={120}>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Precio recurrente" htmlFor="pm-stripe-sub" hint="Suscripción mensual, semestral o anual.">
              <input id="pm-stripe-sub" className={inputCls} style={{ ...inputStyle, ...MONO, fontSize: '13px' }} value={stripeSub} onChange={(e) => setStripeSub(e.target.value)} placeholder="price_…" autoComplete="off" spellCheck={false} />
            </Field>
            <Field label="Precio único" htmlFor="pm-stripe-once" hint="Pago en una sola exhibición.">
              <input id="pm-stripe-once" className={inputCls} style={{ ...inputStyle, ...MONO, fontSize: '13px' }} value={stripeOnce} onChange={(e) => setStripeOnce(e.target.value)} placeholder="price_…" autoComplete="off" spellCheck={false} />
            </Field>
          </div>
        </Section>

        {/* Textos + vista previa en vivo */}
        <Section title="Lo que ve la empresa" hint="Así se mostrará al administrador de la empresa al contratar para sus personas (y al cliente en Trámites). La tarjeta cambia mientras escribes." Icon={Eye} delay={160}>
          <div className="grid sm:grid-cols-[1fr_minmax(240px,45%)] gap-4 items-start">
            <div className="flex flex-col gap-4">
              <Field label="Logo" hint={isService ? 'Lo controlamos desde aquí; la empresa solo lo ve. Si no subes uno, se usa el del proveedor.' : 'Opcional. PNG, JPG, WebP o SVG; se reduce a 256 px.'}>
                <div className="flex items-center gap-3">
                  <ProviderLogo key={logoUrl ?? providerKey} src={logoUrl} providerKey={isService ? providerKey : null} label={name || 'Producto'} size={48} className="shrink-0 ui-section-enter" />
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept={LOGO_TYPES.join(',')}
                    className="sr-only"
                    id="pm-logo"
                    onChange={(e) => void pickLogo(e.target.files?.[0])}
                  />
                  <label
                    htmlFor="pm-logo"
                    className="ui-press inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12.5px] font-bold cursor-pointer"
                    style={{ background: meta.soft, color: meta.color }}
                  >
                    {logoBusy ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {logoUrl ? 'Cambiar' : 'Subir logo'}
                  </label>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="ui-press inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-[12.5px] font-bold cursor-pointer hover:bg-[var(--ink-50)]"
                      style={{ color: 'var(--ink-500)' }}
                    >
                      <Trash2 size={14} /> Quitar
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Descripción corta" htmlFor="pm-short" hint="Una línea en la tarjeta.">
                <input id="pm-short" className={inputCls} style={inputStyle} value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Factura desde tu cuenta con Timbrame" />
              </Field>
              <Field label="Qué incluye" htmlFor="pm-features" hint="Una por línea; se muestra como lista.">
                <textarea id="pm-features" className="w-full px-3 py-2 rounded-xl text-[13px] outline-none resize-y transition-[box-shadow,border-color] duration-150 focus:border-[var(--brand-700)] focus:shadow-[0_0_0_3px_var(--brand-100)]" style={{ ...inputStyle, minHeight: 96 }} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} placeholder={'Timbrado ilimitado\nCancelaciones\nSoporte por chat'} />
              </Field>
            </div>
            <PreviewCard
              type={productType}
              name={name.trim()}
              price={Number(price) || 0}
              period={billingPeriod}
              shortDescription={shortDescription.trim()}
              features={featureList}
              hasStripe={!!(stripeSub.trim() || stripeOnce.trim())}
              providerKey={isService ? providerKey : null}
              logoUrl={logoUrl}
            />
          </div>
        </Section>

        <div className="-mx-3 -mb-2 pl-[38px]">
          <Toggle accent={meta.color} checked={isActive} onChange={setIsActive} label="Activo en el catálogo" hint="Inactivo no aparece para vender; lo ya vendido no cambia." />
        </div>
      </div>
    </Modal>
  )
}
