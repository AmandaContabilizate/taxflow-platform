import type { CSSProperties, ReactNode } from 'react'

type BtnKind = 'primary' | 'brand' | 'ghost'
type BtnSize = 'sm' | 'md' | 'lg'

interface BtnProps {
  children: ReactNode
  kind?: BtnKind
  size?: BtnSize
  onClick?: () => void
  block?: boolean
  type?: 'button' | 'submit'
  disabled?: boolean
  style?: CSSProperties
}

const SIZE_CLASSES: Record<BtnSize, string> = {
  sm: 'px-4 py-2.5 text-[13px] min-h-[38px]',
  md: 'px-5 py-3.5 text-[15px] min-h-[48px]',
  lg: 'px-7 py-4 text-[16px] min-h-[56px]',
}

const KIND_STYLES: Record<BtnKind, CSSProperties> = {
  primary: { background: 'var(--primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--sh-ink)' },
  brand: { background: 'linear-gradient(135deg,#10DA92 0%,#00B073 100%)', color: '#fff', boxShadow: 'var(--sh-brand)' },
  ghost: { background: 'var(--card)', color: 'var(--foreground)', border: '1px solid var(--border-strong)' },
}

export function Btn({
  children,
  kind = 'primary',
  size = 'md',
  onClick,
  block,
  type,
  disabled,
  style,
}: BtnProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition active:scale-[0.98] hover:opacity-95 disabled:opacity-60 ${SIZE_CLASSES[size]} ${block ? 'w-full' : ''}`}
      style={{ ...KIND_STYLES[kind], ...style }}
    >
      {children}
    </button>
  )
}
