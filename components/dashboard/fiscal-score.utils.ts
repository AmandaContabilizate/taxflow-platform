/**
 * Estatus cualitativo del score fiscal — ÚNICA fuente de verdad para las tres
 * pantallas que lo muestran (Diagnóstico, Home hero y Vista Fiscal). Antes cada
 * una traía sus propios cortes y el mismo score se leía distinto entre pantallas.
 * Cortes oficiales: 75 / 50 / 25 (los de la pantalla Diagnóstico, la referencia).
 */
export type FiscalStatusPill = 'brand' | 'amber' | 'coral'

export interface FiscalScoreStatus {
  /** Para frases: "tu situación fiscal está {word}". */
  word: string
  /** Etiqueta corta para tarjetas y heros. */
  label: string
  pill: FiscalStatusPill
  pillText: string
  accent: string
  positive: boolean
}

export function fiscalStatus(score: number): FiscalScoreStatus {
  if (score >= 75)
    return { word: 'excelente', label: 'Excelente', pill: 'brand', pillText: 'Todo en orden', accent: '#00AD87', positive: true }
  if (score >= 50)
    return { word: 'buena', label: 'Vas bien', pill: 'brand', pillText: 'Vas bien', accent: '#00AD87', positive: true }
  if (score >= 25)
    return { word: 'regular', label: 'A mejorar', pill: 'amber', pillText: 'Requiere atención', accent: 'var(--violet-ink)', positive: false }
  return { word: 'crítica', label: 'Necesita atención', pill: 'coral', pillText: 'Requiere atención', accent: 'var(--violet-ink)', positive: false }
}

/** Etiqueta cualitativa a partir del score numérico (derivada del estatus canónico). */
export function scoreLabel(score: number): string {
  return fiscalStatus(score).label
}

/** Color del arco según el score (alineado a la semántica del estatus: ≥50 es positivo). */
export function scoreColor(score: number): string {
  const s = fiscalStatus(score)
  if (s.positive) return '#00AD87' // brand-500
  if (s.pill === 'amber') return '#7339FD'
  return 'var(--violet-ink)'
}
