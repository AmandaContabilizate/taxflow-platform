/**
 * Lectura tolerante del JSON de cálculos (`/declarations/{id}/calculations`).
 * El backend cambia casing/acentos entre versiones, así que nada se lee por
 * llave literal: todo pasa por `norm`.
 */

export type Json = Record<string, unknown>

/** Normaliza una llave para comparar sin importar casing/acentos/separadores. */
export const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

/** Índice normalizado de las llaves del objeto, para buscar sin adivinar casing. */
export function indexOf(obj: Json | null | undefined): Map<string, unknown> {
  const map = new Map<string, unknown>()
  if (!obj) return map
  for (const [k, v] of Object.entries(obj)) map.set(norm(k), v)
  return map
}

/** Resuelve una ruta con puntos ("optionIva.porcentage") sin importar casing. */
export function resolvePath(obj: Json | null | undefined, path: string): unknown {
  let current: unknown = obj
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object') return null
    const value = indexOf(current as Json).get(norm(segment))
    if (value === undefined) return null
    current = value
  }
  return current ?? null
}

export function pick(data: Json | null, candidates: string[]): unknown {
  for (const c of candidates) {
    const v = resolvePath(data, c)
    if (v !== undefined && v !== null) return v
  }
  return null
}

/** Los montos pueden venir como number o como string decimal ("438.49"). */
export function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]/g, ''))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

/** Atajo: lee el primer candidato que exista y lo devuelve como número. */
export function num(data: Json | null, candidates: string[]): number | null {
  return toNumber(pick(data, candidates))
}

/** Busca un sub-objeto por varios nombres; si no existe, usa la raíz. */
export function subObject(root: Json | null, candidates: string[]): Json | null {
  if (!root) return null
  const index = indexOf(root)
  for (const c of candidates) {
    const v = index.get(norm(c))
    if (v && typeof v === 'object' && !Array.isArray(v)) return v as Json
  }
  return root
}

export const money = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 })

/** El backend manda las tasas como fracción (0.16, 0.021). */
export const percent = (n: number) => {
  const value = Math.abs(n) <= 1 ? n * 100 : n
  return `${value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
