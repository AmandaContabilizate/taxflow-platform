export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="w-2 h-2 rounded-full inline-block"
      style={{
        background: ok ? 'var(--brand-500)' : '#7339FD',
        boxShadow: ok ? '0 0 0 3px var(--brand-100)' : '0 0 0 3px var(--amber-soft)',
      }}
    />
  )
}
