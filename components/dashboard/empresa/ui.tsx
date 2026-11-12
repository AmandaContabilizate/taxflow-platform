'use client'

import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Piezas del Perfil Empresa con el lenguaje visual del prototipo (perfil-empresa-contabilizate.html):
 * pills de estado, chips de filtro, botones, KPI, anillo de puntaje, tabs subrayadas y panel lateral.
 * Las clases viven en globals.css (prefijo emp-) para que hover/active/focus sean CSS y no JS.
 */

export type PillTone = 'green' | 'amber' | 'red' | 'blue' | 'purple' | 'gray'

export function Pill({ tone = 'gray', children, title }: { tone?: PillTone; children: ReactNode; title?: string }) {
  return <span className={`emp-pill emp-pill-${tone}`} title={title}>{children}</span>
}

/** Etapa → color: gris mientras no hay cuenta, azul con cuenta, púrpura ya autorizada, verde activada, ámbar en espera. */
export function stageTone(stage: number): PillTone {
  if (stage === 10) return 'amber'
  if (stage >= 9) return 'green'
  if (stage >= 7) return 'purple'
  if (stage >= 4) return 'blue'
  return 'gray'
}

/** Puntaje de cumplimiento → semáforo del resumen: 50+ en orden, 25–49 con observaciones, menos riesgo alto. */
export function scoreMeta(score: number): { tone: PillTone; label: string; color: string } {
  if (score >= 50) return { tone: 'green', label: 'En orden', color: 'var(--emp-green)' }
  if (score >= 25) return { tone: 'amber', label: 'Con observaciones', color: 'var(--emp-amber)' }
  return { tone: 'red', label: 'Riesgo alto', color: 'var(--emp-red)' }
}

export function Chip({ active, onClick, children, count, title }: { active?: boolean; onClick: () => void; children: ReactNode; count?: number; title?: string }) {
  return (
    <button type="button" onClick={onClick} title={title} className={`emp-chip${active ? ' is-active' : ''}`} aria-pressed={active}>
      {children}
      {count !== undefined && <span className="emp-chip-n">· {count}</span>}
    </button>
  )
}

type EmpBtnKind = 'primary' | 'accent' | 'ghost' | 'danger'

export function EmpBtn({ kind = 'primary', small, children, onClick, disabled, title, type = 'button' }: {
  kind?: EmpBtnKind
  small?: boolean
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  title?: string
  type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title} className={`emp-btn emp-btn-${kind}${small ? ' emp-btn-sm' : ''}`}>
      {children}
    </button>
  )
}

export function IconBtn({ children, onClick, disabled, title, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; title?: string; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title ?? label} aria-label={label} className="emp-icon-btn">
      {children}
    </button>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <>
      <p className="emp-section-title">{children}</p>
      {sub && <p className="emp-section-sub">{sub}</p>}
    </>
  )
}

export function FindingRow({ label, value, dot }: { label: ReactNode; value?: ReactNode; dot?: 'red' | 'amber' | 'blue' | 'green' }) {
  return (
    <div className="emp-finding-row">
      <span className="emp-finding-left">
        {dot && <span className={`emp-dot emp-dot-${dot}`} />}
        <span className="truncate">{label}</span>
      </span>
      {value !== undefined && <b>{value}</b>}
    </div>
  )
}

export function KpiCard({ label, value, foot, icon, dark }: { label: string; value: ReactNode; foot?: ReactNode; icon: ReactNode; dark?: boolean }) {
  return (
    <div className={`emp-card${dark ? ' emp-kpi-dark' : ''}`}>
      <div className="emp-kpi-label">
        <span>{label}</span>
        <span className="emp-kpi-icon">{icon}</span>
      </div>
      <div className="emp-kpi-value">{value}</div>
      {foot && <div className="emp-kpi-foot">{foot}</div>}
    </div>
  )
}

/** Anillo de puntaje: se llena una vez al montar (700 ms, ease-out fuerte). Solo transform/stroke, sin layout. */
export function ScoreRing({ value, size = 64 }: { value: number; size?: number }) {
  const v = Math.max(0, Math.min(100, value))
  const stroke = 5
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const [offset, setOffset] = useState(c)
  useEffect(() => {
    const id = requestAnimationFrame(() => setOffset(c - (c * v) / 100))
    return () => cancelAnimationFrame(id)
  }, [c, v])
  const { color } = scoreMeta(v)
  return (
    <div className="emp-ring" style={{ width: size, height: size, color, fontSize: size >= 80 ? 24 : 17 }} role="img" aria-label={`Puntaje ${Math.round(v)} de 100`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="emp-ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle className="emp-ring-fill" cx={size / 2} cy={size / 2} r={r} stroke={color} strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <span>{Math.round(v)}</span>
    </div>
  )
}

export function Avatar({ name, size = 52 }: { name: string; size?: number }) {
  return (
    <div className="emp-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.31) }} aria-hidden>
      {initials(name)}
    </div>
  )
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function EmpTabs({ items, active, onChange }: { items: string[]; active: number; onChange: (i: number) => void }) {
  return (
    <div className="emp-tabs" role="tablist">
      {items.map((t, i) => (
        <button key={t} type="button" role="tab" aria-selected={i === active} onClick={() => onChange(i)} className={`emp-tab${i === active ? ' is-active' : ''}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

/**
 * Panel lateral derecho. Entra en 260 ms con la curva de cajón; sale en 180 ms (la salida siempre más rápida).
 * Se desmonta cuando termina la salida; Escape y el fondo lo cierran.
 */
export function SidePanel({ open, onClose, children, labelledBy }: { open: boolean; onClose: () => void; children: ReactNode; labelledBy?: string }) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      if (timer.current) window.clearTimeout(timer.current)
      setClosing(false)
      setMounted(true)
      return
    }
    if (!mounted) return
    setClosing(true)
    timer.current = window.setTimeout(() => { setMounted(false); setClosing(false) }, 190)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [open, mounted])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted || typeof document === 'undefined') return null
  const cls = closing ? ' is-closing' : ''
  return createPortal(
    <>
      <div className={`emp-overlay${cls}`} onClick={onClose} aria-hidden />
      <aside className={`emp-panel${cls}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </aside>
    </>,
    document.body,
  )
}

export function CloseX({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="emp-close-x" aria-label="Cerrar">
      <X size={16} />
    </button>
  )
}

export function fmtDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—'
  const d = new Date(iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return '—'
  return withTime
    ? d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtMxn(value: number, decimals = 0): string {
  return value.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: decimals })
}

/** Estatus de la lista 69-B del SAT → color: definitivo/firme rojo, presunto ámbar, desvirtuado/sentencia favorable azul. */
export function list69Tone(status: string): PillTone {
  const s = status.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  if (s.includes('definitivo') || s.includes('firme')) return 'red'
  if (s.includes('presunto')) return 'amber'
  if (s.includes('desvirtuado') || s.includes('favorable')) return 'blue'
  return 'gray'
}
