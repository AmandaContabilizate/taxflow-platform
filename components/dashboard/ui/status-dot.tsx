export function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="w-2 h-2 rounded-full inline-block"
      style={{
        background: ok ? 'var(--brand-500)' : '#F5B037',
        boxShadow: ok ? '0 0 0 3px var(--brand-100)' : '0 0 0 3px var(--amber-soft)',
      }}
    />
  )
}
