'use client'

import { usePathname } from 'next/navigation'
import { useCallback, useMemo, useSyncExternalStore } from 'react'

/**
 * El dashboard es una SPA dentro de `/dashboard`: la navegación no cambia de
 * ruta de Next. Para que un refresh (o un link compartido) caiga en el mismo
 * lugar, el estado navegable se guarda en el query string y se manipula con la
 * History API nativa — no con `router.push`, que revalidaría el server component
 * de la página en cada click.
 *
 * Parámetros en uso:
 *   s        pantalla activa (clave de `Screen`)
 *   rfc      contribuyente seleccionado en Operaciones
 *   regimen  id interno del régimen (Users.TaxRegimes)
 *   decl     id de la declaración abierta
 *   proximas "1" = solo periodos aún no vencidos (onlyUpcoming), solo en futuras
 *   year / period / status  filtros del listado de declaraciones
 *   estatus  filtro de estatus en Regularizaciones: ausente = "En proceso"
 *            (statusId=15, el default de la pantalla), "todos" = sin filtro
 */

const URL_EVENT = 'dashboard:urlchange'

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(URL_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(URL_EVENT, onChange)
  }
}

const getSnapshot = () => window.location.search
const getServerSnapshot = () => ''

export type UrlPatch = Record<string, string | number | null | undefined>

/**
 * Aplica `patch` sobre `search` (el query string actual) y devuelve la URL
 * resultante bajo `pathname`. Única definición de cómo se serializa el
 * estado: la usan tanto `setParams` (navegación SPA) como el `href` real de
 * los enlaces de la fila (para que el navegador ofrezca "Abrir en pestaña
 * nueva" / clic central / Ctrl+clic). `pathname`/`search` se piden explícitos
 * — nada de leer `window` aquí — para que sea seguro llamarla durante el
 * render (incluido SSR).
 */
export function buildUrl(patch: UrlPatch, pathname: string, search: string): string {
  const next = new URLSearchParams(search)
  for (const [key, value] of Object.entries(patch)) {
    if (value == null || value === '') next.delete(key)
    else next.set(key, String(value))
  }
  const qs = next.toString()
  return `${pathname}${qs ? `?${qs}` : ''}`
}

export function useUrlState() {
  const pathname = usePathname()
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const params = useMemo(() => new URLSearchParams(search), [search])

  /**
   * `replace` para cambios que no merecen entrada en el historial (restaurar la
   * pantalla guardada, ajustar filtros); `push` para navegación real, así el
   * botón "atrás" del navegador funciona.
   */
  const setParams = useCallback((patch: UrlPatch, opts?: { replace?: boolean }) => {
    const url = buildUrl(patch, pathname, window.location.search)
    if (url === `${window.location.pathname}${window.location.search}`) return
    if (opts?.replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    window.dispatchEvent(new Event(URL_EVENT))
  }, [pathname])

  return { params, setParams, pathname }
}

/** Lee un parámetro numérico; devuelve null si falta o no es un número válido. */
export function numParam(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}
