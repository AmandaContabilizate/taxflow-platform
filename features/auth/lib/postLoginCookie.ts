/**
 * Marca "acaba de iniciar sesión" para la redirección a Diagnóstico (components/dashboard/
 * post-login-redirect.tsx). No es httpOnly: la lee y la borra el dashboard en el cliente, una sola
 * vez por inicio de sesión. Corta a propósito: si nunca llega al dashboard, se va sola.
 */
export const POST_LOGIN_COOKIE = "post_login";
export const POST_LOGIN_MAX_AGE_S = 600;

/** ¿El destino del login es el dashboard (con o sin query)? */
export function isDashboardDestination(path: string): boolean {
  return path === "/dashboard" || path.startsWith("/dashboard?") || path.startsWith("/dashboard/");
}

/** Para el cliente (onboarding termina con router.push, sin pasar por el servidor). */
export function setPostLoginCookieClient() {
  document.cookie = `${POST_LOGIN_COOKIE}=1; max-age=${POST_LOGIN_MAX_AGE_S}; path=/; SameSite=Lax`;
}
