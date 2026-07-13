/**
 * Detecta si la página corriendo actualmente está embebida en un iframe
 * (caso de partners que integran ContaboxPro vía el puente SSO). El acceso a
 * `window.top` puede lanzar por restricciones cross-origin — si lanza, se
 * asume que sí está en un iframe.
 */
export function isInIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
