"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { refreshSession } from "@/features/auth/actions";
import { handleAuthFailure } from "@/features/auth/lib/handleAuthFailure";
import { isInIframe } from "@/lib/auth/isInIframe";
import { isPublicRoute } from "@/lib/routes";

/** Cada cuánto se revisa/renueva la sesión mientras la pestaña está abierta. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Guard de cliente complementario al middleware.
 *
 * Implementa la sesión deslizante: en cada cambio de ruta, cada minuto, y al
 * volver el foco a la pestaña, llama a `refreshSession()`. El server action
 * re-emite el token cuando ha consumido el 50 % de su vida y expulsa a login
 * cuando el backend rechaza el refresh (tope absoluto de sesión alcanzado).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicRoute = isPublicRoute(pathname);
  const runningRef = useRef(false);

  useEffect(() => {
    if (publicRoute) return;

    let cancelled = false;

    async function check() {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const result = await refreshSession(isInIframe());
        if (!cancelled && result.status === "expired") {
          await handleAuthFailure();
        }
      } catch {
        // Fallo inesperado del propio action: no expulsar por un tropiezo de red.
      } finally {
        runningRef.current = false;
      }
    }

    check();

    const interval = setInterval(check, CHECK_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
    };
  }, [pathname, publicRoute]);

  return <>{children}</>;
}
