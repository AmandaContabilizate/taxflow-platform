import type { ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'

export function HelpBox({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{ background: 'var(--helpbox-bg)', border: '1px solid var(--helpbox-border)' }}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--helpbox-accent-bg)', color: 'var(--helpbox-text)' }}
      >
        <Lightbulb size={16} />
      </div>
      <div className="text-[13.5px] leading-relaxed" style={{ color: 'var(--helpbox-text)' }}>
        {children}
      </div>
    </div>
  )
}
