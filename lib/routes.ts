/**
 * Rutas del frontend.
 * - PUBLIC_ROUTES: accesibles sin sesión
 * - PROTECTED_ROUTES: requieren auth
 * - AUTH_REDIRECT_ROUTES: si el usuario YA está logueado y entra a una de estas
 *   (típicamente /auth/login), se le redirige al dashboard
 */

export const PUBLIC_ROUTES = {
  HOME: "/",
  LOGIN: "/auth/login",
  LOGOUT: "/auth/logout",
  PRIVACY: "/privacy-policy",
  PLANS: "/planes",
  PAYMENT_SUCCESS: "/pago-exitoso",
  SESSION_ENDED: "/session-ended",
  LOGIN_CALLBACK: "/auth/login-callback",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",
  COMPLETE_PROFILE: "/auth/complete-profile",
} as const;

export const PROTECTED_ROUTES = {
  DASHBOARD: "/dashboard",
  ONBOARDING: "/onboarding",
} as const;

// Si el usuario ya tiene sesión, NO debería ver estas páginas → redirige al dashboard.
export const AUTH_REDIRECT_ROUTES: string[] = [PUBLIC_ROUTES.LOGIN];

// Rutas públicas adicionales que no requieren auth pero tampoco redirigen.
export const PUBLIC_NONAUTH_ROUTES: string[] = [
  PUBLIC_ROUTES.HOME,
  PUBLIC_ROUTES.LOGOUT,
  PUBLIC_ROUTES.PRIVACY,
  PUBLIC_ROUTES.PLANS,
  PUBLIC_ROUTES.PAYMENT_SUCCESS,
  PUBLIC_ROUTES.SESSION_ENDED,
  PUBLIC_ROUTES.LOGIN_CALLBACK,
  PUBLIC_ROUTES.FORGOT_PASSWORD,
  PUBLIC_ROUTES.RESET_PASSWORD,
];

export const PUBLIC_NO_AUTH_PATTERNS: RegExp[] = [
  /^\/api\/webhooks(\/.*)?$/, // webhooks de Stripe etc.
];

export function isPublicDynamicRoute(pathname: string): boolean {
  return PUBLIC_NO_AUTH_PATTERNS.some((p) => p.test(pathname));
}

export function shouldRedirectIfAuthenticated(pathname: string): boolean {
  return AUTH_REDIRECT_ROUTES.includes(pathname);
}

export function isPublicRoute(pathname: string): boolean {
  return (
    AUTH_REDIRECT_ROUTES.includes(pathname) ||
    PUBLIC_NONAUTH_ROUTES.includes(pathname) ||
    isPublicDynamicRoute(pathname)
  );
}

/**
 * Origen público real del frontend. request.url puede reflejar el hostname
 * interno del contenedor (Azure App Service) en vez del dominio público —
 * usar API_PUBLIC_FRONTEND_URL cuando esté configurada evita redirects
 * same-origin rotos tras el callback de OAuth.
 */
export function resolveRedirectBase(requestUrl: string): string {
  return process.env.API_PUBLIC_FRONTEND_URL || requestUrl;
}
