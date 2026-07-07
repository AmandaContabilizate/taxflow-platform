import { clearSessionCookies } from "../actions";
import { isInIframe } from "@/lib/auth/isInIframe";
import { PUBLIC_ROUTES } from "@/lib/routes";

let handling = false;

/**
 * Punto único de salida cuando se detecta que la sesión ya no es válida
 * (401 de validate, o cualquier server action que devuelva un Result de
 * error por auth). Si la app corre embebida en un iframe (puente SSO de un
 * partner), navegar a /sign-in no tiene sentido — el frame padre es quien
 * controla la navegación — así que se muestra una pantalla terminal en
 * /session-ended en su lugar.
 */
export async function handleAuthFailure(): Promise<void> {
  if (handling) return;
  handling = true;

  await clearSessionCookies();
  window.location.href = isInIframe() ? PUBLIC_ROUTES.SESSION_ENDED : PUBLIC_ROUTES.LOGIN;
}
