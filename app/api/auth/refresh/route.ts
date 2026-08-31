import { decodeJwt } from "jose";
import { NextResponse } from "next/server";
import { setSessionCookies } from "@/features/auth/actions/setSessionCookies.action";
import type { LoginResponse } from "@/features/auth/types";
import { ApiError, API_ROUTES, fetchPost } from "@/lib/api";
import { getAuthToken } from "@/lib/api/auth";

type RefreshStatus = "refreshed" | "valid" | "expired";

const reply = (status: RefreshStatus, debug?: Record<string, unknown>) => {
  console.log("[auth/refresh]", status, debug ?? "");
  return NextResponse.json({ status, ...debug });
};

/**
 * Sesión deslizante. Lo llama `AuthGuard` en cada cambio de ruta, cada minuto y
 * al enfocar la pestaña.
 *
 * Es un Route Handler (no un Server Action) a propósito: las escrituras de cookie
 * de un Server Action invocado desde `useEffect` — fuera de un form/transition —
 * se descartan en Next 16. Aquí `setSessionCookies` sí persiste.
 *
 * REGLA DE ORO: solo se devuelve `expired` cuando el backend (`/refresh` con
 * [Authorize]) rechaza explícitamente con 401/403, o cuando el token ya está
 * MUY vencido. Cualquier otro tropiezo (sin cookie, error de red, 500, token
 * ilegible) devuelve `valid` — nunca debe provocar un logout instantáneo.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const token = await getAuthToken();
    if (!token) return reply("valid", { reason: "sin cookie en el request" });

    let iat: number | undefined;
    let exp: number | undefined;
    try {
      const claims = decodeJwt(token);
      iat = typeof claims.iat === "number" ? claims.iat : undefined;
      exp = typeof claims.exp === "number" ? claims.exp : undefined;
    } catch {
      return reply("valid", { reason: "token ilegible" });
    }
    if (!exp) return reply("valid", { reason: "token sin exp" });

    const now = Math.floor(Date.now() / 1000);
    const issued = iat ?? exp - 15 * 60;
    const halfLife = Math.floor(issued + (exp - issued) * 0.5);
    const dbg = {
      now,
      iat,
      exp,
      halfLife,
      secsLeft: exp - now,
      pct: Math.round(((now - issued) / (exp - issued)) * 100),
    };

    // Token MUY vencido (con 5 min de margen por desfase de reloj Next↔Identity).
    if (now >= exp + 300) return reply("expired", { ...dbg, reason: "token vencido" });

    // Aún no consumió el 50 % de su vida → no tocar.
    if (now < exp && now < halfLife) return reply("valid", dbg);

    const embedded = request.headers.get("x-embedded") === "1";
    try {
      const data = await fetchPost<LoginResponse>(API_ROUTES.AUTH.REFRESH, undefined, "auth");
      if (!data?.token) return reply("valid", { ...dbg, reason: "backend sin token" });

      let rememberMe = false;
      try {
        rememberMe = (decodeJwt(data.token) as Record<string, unknown>).rmb === "1";
      } catch {
        // claim opcional
      }

      await setSessionCookies({ token: data.token, expiresAt: data.expiresAt }, { rememberMe, embedded });
      return reply("refreshed", { ...dbg, newExpiresAt: data.expiresAt });
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        return reply("expired", {
          ...dbg,
          reason: "backend rechazó el refresh",
          backendStatus: e.status,
          backendCode: e.errorCode,
          backendMsg: e.message,
        });
      }
      const err = e instanceof ApiError ? { backendStatus: e.status, backendMsg: e.message } : { err: String(e) };
      // Red / 5xx / TLS: el token viejo sigue vivo, no expulsar.
      return reply("valid", { ...dbg, reason: "fallo transitorio", ...err });
    }
  } catch (e) {
    // Nada aquí debe provocar logout.
    return reply("valid", { reason: "excepción inesperada", err: String(e) });
  }
}
