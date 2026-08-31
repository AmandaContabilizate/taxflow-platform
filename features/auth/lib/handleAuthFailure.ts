import { isInIframe } from "@/lib/auth/isInIframe";
import { PUBLIC_ROUTES } from "@/lib/routes";

let handling = false;

/**
 * Punto único de salida cuando se detecta que la sesión ya no es válida.
 *
 * Navega a `/auth/logout` (Route Handler) en vez de llamar `clearSessionCookies`
 * aquí: este código corre desde un `useEffect`, y las mutaciones de cookie de un
 * Server Action invocado fuera de un form/transition se descartan en Next 16 — la
 * cookie sobrevivía y el usuario quedaba en un limbo (redirigido a login pero con
 * `auth_token` intacta). El Route Handler sí limpia y luego redirige a login.
 *
 * En iframe (puente SSO de un partner) navegar a login no tiene sentido — el
 * frame padre controla la navegación — así que va a /session-ended.
 */
export async function handleAuthFailure(): Promise<void> {
  if (handling) return;
  handling = true;

  window.location.href = isInIframe() ? PUBLIC_ROUTES.SESSION_ENDED : PUBLIC_ROUTES.LOGOUT;
}
