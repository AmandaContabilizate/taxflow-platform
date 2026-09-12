import { PlayCircle } from 'lucide-react'

interface VideoSlotProps {
  title: string
}

/**
 * Los videos todavia no existen. Antes esto era un boton con "Video · 3 min" —
 * duraciones inventadas sobre contenido inexistente y sin onClick.
 */
export function VideoSlot({ title }: VideoSlotProps) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3 w-full text-left"
      style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: 'var(--sh-1)' }}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}
      >
        <PlayCircle size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[14px] leading-tight">{title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: 'var(--ink-400)' }}>
          Próximamente
        </div>
      </div>
    </div>
  )
}
