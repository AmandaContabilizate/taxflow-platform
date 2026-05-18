import { DISPLAY } from '../constants'

type Tone = 'ok' | 'warn' | undefined

interface SummaryStatProps {
  label: string
  value: string
  hint: string
  tone?: Tone
}

export function SummaryStat({ label, value, hint, tone }: SummaryStatProps) {
  const bg = tone === 'ok' ? 'var(--brand-50)' : tone === 'warn' ? 'var(--amber-soft)' : 'var(--card)'
  const border =
    tone === 'ok' ? 'var(--brand-200)' : tone === 'warn' ? 'rgba(245,176,55,0.35)' : 'var(--border)'
  const labelColor =
    tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? '#7B5312' : 'var(--ink-500)'
  const valueColor =
    tone === 'ok' ? 'var(--brand-700)' : tone === 'warn' ? '#7B5312' : 'var(--ink-900)'

  return (
    <div className="rounded-3xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[12px] font-extrabold uppercase tracking-wider" style={{ color: labelColor }}>
        {label}
      </div>
      <div className="text-[26px] font-extrabold tracking-tight mt-2" style={{ ...DISPLAY, color: valueColor }}>
        {value}
      </div>
      <div className="text-[12.5px] mt-1" style={{ color: labelColor }}>
        {hint}
      </div>
    </div>
  )
}
