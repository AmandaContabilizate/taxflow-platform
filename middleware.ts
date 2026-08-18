import { NextResponse, type NextRequest } from "next/server";
import {
  PROTECTED_ROUTES,
  PUBLIC_ROUTES,
  isPublicRoute,
  resolveRedirectBase,
  shouldRedirectIfAuthenticated,
} from "@/lib/routes";

/**
 * Middleware Bearer (kit ContaboxPro core2).
 *
 * - Si NO hay cookie `auth_token` y la ruta es protegida → redirige a /auth/login.
 * - Si HAY token y entra a /auth/login → redirige al dashboard.
 *
 * Solo verifica PRESENCIA de la cookie (rápido, edge).
 * La validación real del token la hace `getCurrentUser` en server actions.
 */
export function middleware(request: NextRequest) {
  const { pathname: rawPathname } = request.nextUrl;

  // Los deep links de la app movil llegan como /app/<ruta> (ver next.config.mjs:
  // rewrites). El middleware corre ANTES del rewrite, asi que hay que quitar el
  // prefijo antes de evaluar si la ruta es publica — si no, /app/auth/reset-password
  // no matchea PUBLIC_ROUTES y termina redirigido al login.
  const pathname = rawPathname.replace(/^\/app(?=\/|$)/, "") || "/";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/webhooks") || // Stripe webhooks (sin auth)
    pathname.startsWith("/.well-known") || // Universal Links / App Links de la app movil
    pathname.startsWith("/favicon") ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(request.cookies.get("auth_token"));

  if (isAuthenticated && shouldRedirectIfAuthenticated(pathname)) {
    return NextResponse.redirect(new URL(PROTECTED_ROUTES.DASHBOARD, resolveRedirectBase(request.url)));
  }

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    const url = new URL(PUBLIC_ROUTES.LOGIN, resolveRedirectBase(request.url));
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
