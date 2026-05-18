import type { ComponentType } from 'react'
import { Construction } from 'lucide-react'
import { DISPLAY } from '../constants'
import { Card } from '../ui'

interface PlaceholderScreenProps {
  title: string
  description?: string
  Icon?: ComponentType<{ size?: number }>
}

export function PlaceholderScreen({ title, description, Icon = Construction }: PlaceholderScreenProps) {
  return (
    <div className="flex flex-col gap-6 max-w-[960px]">
      <Card>
        <div className="flex flex-col items-center text-center py-10 px-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'var(--ink-50)',
              color: 'var(--ink-700)',
              border: '1px solid var(--border)',
            }}
          >
            <Icon size={28} />
          </div>
          <div
            className="text-[20px] font-extrabold mb-1"
            style={{ ...DISPLAY, color: 'var(--ink-900)' }}
          >
            {title}
          </div>
          <p className="text-[13.5px] font-semibold max-w-[420px]" style={{ color: 'var(--ink-500)' }}>
            {description ??
              'Esta pantalla aún no está disponible. Pronto verás aquí toda la información de esta sección.'}
          </p>
          <span
            className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-bold uppercase tracking-wider"
            style={{
              background: 'var(--ink-100)',
              color: 'var(--ink-900)',
              border: '1px solid var(--border)',
            }}
          >
            Próximamente
          </span>
        </div>
      </Card>
    </div>
  )
}
