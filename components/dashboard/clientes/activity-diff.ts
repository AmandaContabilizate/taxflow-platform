/**
 * Resalta la parte que cambia entre descripciones de actividades casi iguales (el catálogo del
 * SAT tiene muchas que solo difieren en una o dos palabras, p. ej. "Servicio de entrega de
 * alimentos preparados a través de Internet…" vs "Servicio de transporte terrestre de pasajeros
 * a través de Internet…").
 *
 * El color no identifica a la actividad (con 50+ no se distinguirían): se reparte entre las filas
 * resaltadas de la lista actual, solo para que se vean distintas entre sí.
 */

export interface DiffSegment {
  text: string
  /** Parte que distingue a esta descripción de su pareja más parecida. */
  diff: boolean
  /** Color CSS (var(--diff-n)) para el segmento diff. */
  color?: string
}

const PALETTE = ['--diff-1', '--diff-2', '--diff-3', '--diff-4', '--diff-5', '--diff-6'].map(
  (v) => `var(${v})`,
)

/** Mínimo de palabras compartidas (inicio + final) para considerar dos descripciones parecidas. */
const MIN_SHARED_WORDS = 3

const normalize = (w: string) =>
  w
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,;:()]/g, '')
    .toLowerCase()

/** Palabras iguales al inicio y al final (sin traslaparse). */
function sharedEdges(a: string[], b: string[]): { prefix: number; suffix: number } {
  const max = Math.min(a.length, b.length)
  let prefix = 0
  while (prefix < max && a[prefix] === b[prefix]) prefix++
  let suffix = 0
  while (
    suffix < max - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  )
    suffix++
  return { prefix, suffix }
}

export function highlightDiffs<K>(rows: { id: K; description: string }[]): Map<K, DiffSegment[]> {
  const words = rows.map((r) => r.description.split(/\s+/).filter(Boolean))
  const norm = words.map((ws) => ws.map(normalize))

  // Por fila: la pareja más parecida (más palabras compartidas en los extremos).
  const best = rows.map((_, i) => {
    let match: { prefix: number; suffix: number } | null = null
    for (let j = 0; j < rows.length; j++) {
      if (i === j) continue
      const edges = sharedEdges(norm[i], norm[j])
      const shared = edges.prefix + edges.suffix
      const shorter = Math.min(norm[i].length, norm[j].length)
      if (shared < MIN_SHARED_WORDS || shared < shorter / 2) continue
      if (!match || shared > match.prefix + match.suffix) match = edges
    }
    return match
  })

  const result = new Map<K, DiffSegment[]>()
  let colorIdx = 0
  rows.forEach((row, i) => {
    const match = best[i]
    const ws = words[i]
    if (!match || match.prefix + match.suffix >= ws.length) {
      // Sin pareja, o contenida por completo en otra (la otra resalta su sobrante).
      result.set(row.id, [{ text: row.description, diff: false }])
      return
    }
    const color = PALETTE[colorIdx++ % PALETTE.length]
    const head = ws.slice(0, match.prefix).join(' ')
    const middle = ws.slice(match.prefix, ws.length - match.suffix).join(' ')
    const tail = ws.slice(ws.length - match.suffix).join(' ')
    const segments: DiffSegment[] = []
    if (head) segments.push({ text: head + ' ', diff: false })
    segments.push({ text: middle, diff: true, color })
    if (tail) segments.push({ text: ' ' + tail, diff: false })
    result.set(row.id, segments)
  })
  return result
}
