'use client'

import { Check } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  formatMXN,
  isAvailableForMode,
  priceForMode,
  type ComplementRegularizationPlan,
  type PaymentMode,
  type RegularizationPlan,
} from '@/features/account/types'

const PRESSABLE = 'transition-[border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.99]'

interface RegularizationSectionProps<T extends RegularizationPlan> {
  title: string
  items: T[]
  selected: Set<number>
  onSelectedChange: (update: (prev: Set<number>) => Set<number>) => void
  paymentMode: PaymentMode
  /** Junto al título (p. ej. el badge de diagnóstico del vendedor). */
  headerExtra?: ReactNode
  description?: ReactNode
  /** Sustituye la lista (p. ej. el candado de diagnóstico del vendedor). */
  override?: ReactNode
  emptyText?: string
  /** Líneas secundarias extra por tarjeta. */
  details?: (item: T) => string[]
  gridClassName?: string
}

/**
 * Sección de declaraciones a regularizar (normales o por complementaria), compartida por el carrito
 * del cliente y "Armar venta". La selección es por `declarationId`; solo se marcan las que tienen
 * precio en el modo de pago elegido.
 */
export function RegularizationSection<T extends RegularizationPlan>({
  title,
  items,
  selected,
  onSelectedChange,
  paymentMode,
  headerExtra,
  description,
  override,
  emptyText,
  details,
  gridClassName = 'sm:grid-cols-2',
}: RegularizationSectionProps<T>) {
  const selectable = items.filter((r) => r.plan && isAvailableForMode(r.plan, paymentMode))
  const allSelected = selectable.length > 0 && selectable.every((r) => selected.has(r.declarationId))
  const showList = !override && items.length > 0

  const toggle = (id: number) =>
    onSelectedChange((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    onSelectedChange((prev) => {
      const next = new Set(prev)
      for (const r of selectable) {
        if (allSelected) next.delete(r.declarationId)
        else next.add(r.declarationId)
      }
      return next
    })

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-500)' }}>
            {title}
          </div>
          {headerExtra}
        </div>
        {showList && selectable.length > 1 && (
          <button
            type="button"
            onClick={toggleAll}
            className="text-[12px] font-bold transition-opacity hover:opacity-80"
            style={{ color: 'var(--brand-700)' }}
          >
            {allSelected ? 'Quitar selección' : 'Seleccionar todas'}
          </button>
        )}
      </div>
      {description && (
        <p className="text-[12px] leading-snug -mt-1" style={{ color: 'var(--ink-500)' }}>
          {description}
        </p>
      )}
      {override ||
        (items.length === 0 ? (
          emptyText ? (
            <div className="text-[13px]" style={{ color: 'var(--ink-500)' }}>
              {emptyText}
            </div>
          ) : null
        ) : (
          <div className={`grid gap-2.5 ${gridClassName}`}>
            {items.map((reg) => (
              <RegularizationCard
                key={reg.declarationId}
                reg={reg}
                checked={selected.has(reg.declarationId)}
                paymentMode={paymentMode}
                details={details?.(reg)}
                onToggle={() => toggle(reg.declarationId)}
              />
            ))}
          </div>
        ))}
    </section>
  )
}

function RegularizationCard({
  reg,
  checked,
  paymentMode,
  details,
  onToggle,
}: {
  reg: RegularizationPlan
  checked: boolean
  paymentMode: PaymentMode
  details?: string[]
  onToggle: () => void
}) {
  const enabled = !!reg.plan && isAvailableForMode(reg.plan, paymentMode)
  const periodo = [reg.month, reg.year].filter(Boolean).join(' ')
  const title = reg.taxRegimeName || reg.plan?.name || `Declaración ${reg.declarationId}`
  const otherMode: PaymentMode = paymentMode === 0 ? 1 : 0
  const unavailable =
    reg.plan && !enabled && isAvailableForMode(reg.plan, otherMode)
      ? otherMode === 1
        ? 'Disponible solo en pago único'
        : 'Disponible solo en suscripción'
      : null
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={!enabled}
      onClick={onToggle}
      className={`text-left flex items-start justify-between gap-3 rounded-2xl p-3.5 ${PRESSABLE} disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100`}
      style={{ background: 'var(--card)', border: `1.5px solid ${checked ? 'var(--brand-500)' : 'var(--border)'}` }}
    >
      <div className="min-w-0">
        <div className="font-bold text-[13.5px] leading-snug" style={{ color: 'var(--ink-900)' }}>
          {title}
        </div>
        <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: 'var(--ink-500)' }}>
          {periodo || 'Declaración pendiente'}
          {/* Se cobran siempre, incluso con un plan que regala trámites. */}
          {reg.plan ? ` · ${formatMXN(priceForMode(reg.plan.price, paymentMode))}` : ''}
        </div>
        {details && details.length > 0 && (
          <div className="text-[11.5px] mt-0.5 tabular-nums" style={{ color: 'var(--ink-500)' }}>
            {details.join(' · ')}
          </div>
        )}
        {unavailable && (
          <div className="text-[11px] mt-1" style={{ color: 'var(--ink-500)' }}>
            {unavailable}
          </div>
        )}
      </div>
      <div
        className="w-5 h-5 mt-0.5 rounded-md flex items-center justify-center shrink-0 transition-[background-color,border-color] duration-150"
        style={{
          background: checked ? 'var(--brand-500)' : 'transparent',
          border: `1.5px solid ${checked ? 'var(--brand-500)' : 'var(--border-strong)'}`,
          color: '#fff',
        }}
      >
        {checked && <Check size={13} strokeWidth={3} />}
      </div>
    </button>
  )
}

export const COMPLEMENT_REGULARIZATIONS_TITLE = 'Regularizaciones con presentación previa'
export const COMPLEMENT_REGULARIZATIONS_HELP =
  'Estos meses ya se presentaron ante el SAT pero no se pagaron. Los regularizamos con una declaración complementaria, por eso cuestan menos que una regularización normal.'

function fechaCorta(iso: string): string | null {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/** Datos de la presentación previa que se muestran bajo cada complementaria. */
export function complementDetails(c: ComplementRegularizationPlan): string[] {
  const out: string[] = []
  const fecha = c.presentedDate ? fechaCorta(c.presentedDate) : null
  if (fecha) out.push(`Presentada el ${fecha}`)
  if (c.totalDeclaration && c.totalDeclaration > 0) out.push(`Adeudo ${formatMXN(c.totalDeclaration)}`)
  if (c.nextComplementNumber) out.push(`Complementaria #${c.nextComplementNumber}`)
  return out
}
