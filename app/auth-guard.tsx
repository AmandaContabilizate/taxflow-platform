"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getStatusToken } from "@/features/auth/actions";
import { handleAuthFailure } from "@/features/auth/lib/handleAuthFailure";
import { isPublicRoute } from "@/lib/routes";

/**
 * Guard de cliente complementario al middleware.
 * Revalida la sesión en cada cambio de ruta y redirige a /auth/login si caducó.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (isPublicRoute(pathname)) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await getStatusToken();
        if (!cancelled && !result.success) {
          await handleAuthFailure();
        }
      } catch {
        if (!cancelled) await handleAuthFailure();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return <>{children}</>;
}
