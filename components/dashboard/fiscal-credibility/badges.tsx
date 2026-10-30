import { AlertCircle, CheckCircle2, Lock } from 'lucide-react'

const BASE = 'inline-flex items-center gap-1 text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md'

export function BlockedBadge() {
  return (
    <span
      className="text-[10px] tracking-widest uppercase font-extrabold px-2 py-1 rounded-md"
      style={{ background: 'var(--ink-50)', color: 'var(--ink-500)' }}
    >
      Bloqueado
    </span>
  )
}

export function ReadyBadge() {
  return (
    <span className={BASE} style={{ background: 'var(--brand-50)', color: 'var(--brand-700)' }}>
      <CheckCircle2 size={12} /> Lista
    </span>
  )
}

export function TestingBadge() {
  return (
    <span className={BASE} style={{ background: 'var(--hero-amber)', color: 'var(--violet-ink)' }}>
      En pruebas
    </span>
  )
}

export function NotFoundBadge() {
  return (
    <span className={BASE} style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
      RFC no encontrado
    </span>
  )
}

export function FlaggedBadge() {
  return (
    <span className={BASE} style={{ background: 'var(--coral-soft)', color: 'var(--violet-ink)' }}>
      <AlertCircle size={12} /> Revisar
    </span>
  )
}

export function ForbiddenBadge() {
  return (
    <span className={BASE} style={{ background: 'var(--danger-soft)', color: '#8B1E1E' }}>
      <Lock size={12} /> Sin acceso
    </span>
  )
}
