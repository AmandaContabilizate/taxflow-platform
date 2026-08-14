'use client'

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
 *   year / period / status  filtros del listado de declaraciones
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

export function useUrlState() {
  const search = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const params = useMemo(() => new URLSearchParams(search), [search])

  /**
   * `replace` para cambios que no merecen entrada en el historial (restaurar la
   * pantalla guardada, ajustar filtros); `push` para navegación real, así el
   * botón "atrás" del navegador funciona.
   */
  const setParams = useCallback((patch: UrlPatch, opts?: { replace?: boolean }) => {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === '') next.delete(key)
      else next.set(key, String(value))
    }
    const qs = next.toString()
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`
    if (url === `${window.location.pathname}${window.location.search}`) return
    if (opts?.replace) window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
    window.dispatchEvent(new Event(URL_EVENT))
  }, [])

  return { params, setParams }
}

/** Lee un parámetro numérico; devuelve null si falta o no es un número válido. */
export function numParam(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
}
