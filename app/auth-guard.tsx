"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { handleAuthFailure } from "@/features/auth/lib/handleAuthFailure";
import { isInIframe } from "@/lib/auth/isInIframe";
import { isPublicRoute } from "@/lib/routes";

/** Cada cuánto se revisa/renueva la sesión mientras la pestaña está abierta. */
const CHECK_INTERVAL_MS = 60_000;

/**
 * Guard de cliente complementario al middleware.
 *
 * Implementa la sesión deslizante: en cada cambio de ruta, cada minuto, y al
 * volver el foco a la pestaña, llama a `POST /api/auth/refresh`. Ese Route
 * Handler re-emite el token cuando ha consumido el 50 % de su vida y responde
 * `expired` cuando el backend rechaza el refresh (tope absoluto alcanzado).
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
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "x-embedded": isInIframe() ? "1" : "0" },
          cache: "no-store",
          credentials: "include",
        });
        // SOLO se expulsa si el endpoint respondió OK y dijo explícitamente
        // "expired". Un 500 / HTML / parseo fallido NO deben cerrar sesión.
        if (!res.ok) return;
        let data: { status?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          return;
        }
        if (!cancelled && data?.status === "expired") {
          await handleAuthFailure();
        }
      } catch {
        // Fallo de red: no expulsar por un tropiezo puntual.
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
