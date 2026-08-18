import type { CSSProperties, ReactNode } from 'react'

type PillKind = 'default' | 'brand' | 'coral' | 'amber' | 'ink'

const STYLES: Record<PillKind, CSSProperties> = {
  default: { background: 'var(--card)', color: 'var(--ink-700)', border: '1px solid var(--border-strong)' },
  brand: { background: 'var(--brand-50)', color: 'var(--brand-700)', border: '1px solid var(--brand-200)' },
  coral: { background: 'var(--coral-soft)', color: 'var(--violet-ink)', border: '1px solid rgba(115,57,253,0.35)' },
  amber: { background: 'var(--amber-soft)', color: 'var(--violet-ink)', border: '1px solid rgba(115,57,253,0.35)' },
  ink: { background: 'var(--ink-900)', color: 'var(--primary-foreground)', border: '1px solid transparent' },
}

export function Pill({ children, kind = 'default' }: { children: ReactNode; kind?: PillKind }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold"
      style={STYLES[kind]}
    >
      {children}
    </span>
  )
}
