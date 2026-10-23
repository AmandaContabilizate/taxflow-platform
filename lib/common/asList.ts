/** El back responde un arreglo; si llegara envuelto (`{ items }`), se desenvuelve. */
export function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const items = (data as { items?: unknown } | null)?.items
  return Array.isArray(items) ? (items as T[]) : []
}
