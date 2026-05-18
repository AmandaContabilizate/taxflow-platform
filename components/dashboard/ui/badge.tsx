import type { CSSProperties, ReactNode } from 'react'

export type BadgeKind = 'default' | 'brand' | 'amber' | 'coral'

const STYLES: Record<BadgeKind, CSSProperties> = {
  default: { background: 'var(--ink-50)', color: 'var(--ink-700)' },
  brand: { background: 'var(--brand-100)', color: 'var(--brand-900)' },
  amber: { background: 'var(--amber-soft)', color: '#7B5312' },
  coral: { background: 'var(--coral-soft)', color: '#9E3A15' },
}

export function Badge({ children, kind = 'default' }: { children: ReactNode; kind?: BadgeKind }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold"
      style={STYLES[kind]}
    >
      {children}
    </span>
  )
}
