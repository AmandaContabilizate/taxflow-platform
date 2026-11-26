import { PROTECTED_ROUTES } from "@/lib/routes";

/**
 * Pantallas de llegada que acepta el SSO de aliados (`/api/public/validate?…&screen=plan`). El backend ya filtra
 * con la misma lista blanca (Common/Helpers/SsoLandingScreens.cs); aquí se vuelve a validar porque el valor viaja
 * en la query de /auth/login-callback. Solo ids de pantalla del dashboard, nunca URLs (sin redirección abierta).
 */
const SSO_LANDING_SCREENS = new Set(["plan"]);

/** Destino `/dashboard?s=<id>` si la pantalla está permitida; null en cualquier otro caso. */
export function resolveSsoLanding(screen: string | null | undefined): string | null {
  const id = screen?.trim().toLowerCase();
  if (!id || !SSO_LANDING_SCREENS.has(id)) return null;
  return `${PROTECTED_ROUTES.DASHBOARD}?s=${id}`;
}
