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
  PRIVACY: "/privacy-policy",
  PLANS: "/planes",
  PAYMENT_SUCCESS: "/pago-exitoso",
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
  PUBLIC_ROUTES.PRIVACY,
  PUBLIC_ROUTES.PLANS,
  PUBLIC_ROUTES.PAYMENT_SUCCESS,
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
