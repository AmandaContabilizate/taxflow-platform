import { decodeJwt } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookies, setSessionCookies } from "@/features/auth/actions";
import { resolveLoginDestination } from "@/features/auth/lib/resolveLoginDestination";
import { PROTECTED_ROUTES, PUBLIC_ROUTES, resolveRedirectBase } from "@/lib/routes";

/**
 * Destino al que el backend redirige tras el handshake OAuth (Google/
 * Facebook) o el puente SSO de partners (/api/public/validate). Lee los
 * datos de sesión de la query string, detecta si la petición viene de un
 * iframe (embedding de partner) vía el header Sec-Fetch-Dest, y establece
 * la sesión con las cookies apropiadas para ese contexto.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const token = params.get("token");
  const email = params.get("email") ?? undefined;
  const fullName = params.get("name") ?? undefined;
  const rfc = params.get("rfc") ?? undefined;
  const userId = params.get("userId") ?? undefined;
  const expiresAt = params.get("expiresAt") ?? undefined;
  const refreshToken = params.get("temp") ?? undefined;

  if (!token) {
    return NextResponse.redirect(new URL(PUBLIC_ROUTES.LOGIN, resolveRedirectBase(request.url)));
  }

  const isEmbedded = request.headers.get("sec-fetch-dest") === "iframe";

  await clearSessionCookies();
  await setSessionCookies(
    { token, refreshToken, email, fullName, userId, rfc, expiresAt },
    { embedded: isEmbedded },
  );

  const { role } = decodeJwt(token) as { role?: string };
  const destination = resolveLoginDestination({
    role,
    rfc,
    fullName,
    fallback: PROTECTED_ROUTES.DASHBOARD,
  });

  return NextResponse.redirect(new URL(destination, resolveRedirectBase(request.url)));
}
