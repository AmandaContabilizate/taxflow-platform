/** Marca de los nodos del tutorial (overlay y tooltip). */
export const TUTORIAL_UI_ATTR = 'data-tutorial-ui'

/**
 * Para los Dialog de Radix abiertos durante un paso del tutorial: un clic o foco en el tooltip
 * cuenta como "afuera" y cerraría el modal. Úsese en onPointerDownOutside/onInteractOutside/
 * onFocusOutside: `if (isTutorialUiEvent(e)) e.preventDefault()`.
 */
export function isTutorialUiEvent(e: { target: EventTarget | null }): boolean {
  return e.target instanceof Element && !!e.target.closest(`[${TUTORIAL_UI_ATTR}]`)
}

export function tourSelector(id: string): string {
  return `[data-tour="${id}"]`
}

/** Primer elemento visible (con caja) para el ancla; el sidebar móvil y el de escritorio pueden duplicarla. */
export function findTourTarget(id: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(tourSelector(id))
  for (const n of nodes) {
    const r = n.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return n
  }
  return null
}

/** Lo que el usuario cliquearía: el propio ancla si es interactiva, si no su primer botón/liga. */
export function clickableOf(el: HTMLElement): HTMLElement {
  if (el.matches('button, a, [role="button"], input, label')) return el
  return el.querySelector<HTMLElement>('button:not([disabled]), a, [role="button"]') ?? el
}
