interface TabsProps {
  items: string[]
  active: number
  onChange?: (i: number) => void
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="inline-flex gap-1.5 p-1.5 rounded-full" style={{ background: 'rgba(21,17,63,0.05)' }}>
      {items.map((t, i) => (
        <button
          key={t}
          onClick={() => onChange?.(i)}
          className="px-4 py-2 rounded-full text-[13px] font-bold transition"
          style={
            i === active
              ? { background: 'var(--card)', color: 'var(--ink-900)', boxShadow: 'var(--sh-1)' }
              : { background: 'transparent', color: 'var(--ink-500)' }
          }
        >
          {t}
        </button>
      ))}
    </div>
  )
}
