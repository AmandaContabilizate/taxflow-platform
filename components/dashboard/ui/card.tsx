import type { CSSProperties, ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  style?: CSSProperties
  className?: string
}

export function Card({ children, style, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-3xl overflow-hidden ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--sh-1)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
