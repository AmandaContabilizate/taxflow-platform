import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookies } from "@/features/auth/actions";
import { PUBLIC_ROUTES, resolveRedirectBase } from "@/lib/routes";

/**
 * Limpia la sesión y redirige a login. Existe como Route Handler (no server
 * action llamado directo desde un page.tsx) porque Next.js prohíbe mutar
 * cookies durante el render de un Server Component — solo está permitido
 * en un Route Handler o en un Server Action invocado desde el cliente.
 * Usado por las páginas protegidas cuando getCurrentUser() falla, para que
 * la cookie auth_token inválida no siga presente y provoque un loop con
 * middleware.ts (que solo chequea presencia de cookie, no validez).
 */
export async function GET(request: NextRequest) {
  await clearSessionCookies();
  return NextResponse.redirect(new URL(PUBLIC_ROUTES.LOGIN, resolveRedirectBase(request.url)));
}
