/** Ya terminó u omitió el tutorial de bienvenida: no vuelve a salir solo. */
export const TUTORIAL_DONE_KEY = 'tutorial-guest-done'

function key(userId: string | null | undefined) {
  return `${TUTORIAL_DONE_KEY}:${userId ?? 'anon'}`
}

export function isTutorialDone(userId: string | null | undefined): boolean {
  try {
    return localStorage.getItem(key(userId)) === '1'
  } catch {
    return false
  }
}

export function markTutorialDone(userId: string | null | undefined) {
  try {
    localStorage.setItem(key(userId), '1')
  } catch {
    // Sin storage (modo privado): a lo sumo vuelve a salir en el siguiente ingreso.
  }
}
