/** Etiqueta cualitativa a partir del score numérico. */
export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excelente'
  if (score >= 75) return 'Muy bueno'
  if (score >= 50) return 'Vas bien'
  if (score >= 25) return 'A mejorar'
  return 'Necesita atención'
}

/** Color del arco según el score. */
export function scoreColor(score: number): string {
  if (score >= 75) return '#00AD87' // brand-500
  if (score >= 50) return '#7339FD' // amber
  return 'var(--violet-ink)' // coral
}
