import { Suspense } from "react";
import { getExternalAuthUrl } from "@/lib/api/apiUrls";
import { getActiveSeason, isSeasonalEasterEgg } from "@/lib/seasonal";
import { LoginPageClient } from "./login-page-client";

/**
 * Server Component: resuelve las URLs de challenge OAuth server-side (lee
 * API_BASE_IDENTITY/SYSTEM_ORIGIN_ID en request time, no en build time) y
 * las pasa como props al cliente. Así el mismo build sirve para cualquier
 * entorno — cambiar la URL del backend en Application Settings no requiere
 * rebuild, a diferencia de leer estas env vars directo en un client
 * component (donde Next las hornea en el bundle en build time).
 *
 * `force-dynamic` es necesario: sin esto, Next detecta que esta página no
 * depende de cookies/headers y la prerenderiza como estática en build time
 * — lo que horneraría las URLs en el HTML igual que si fueran NEXT_PUBLIC_,
 * anulando todo el punto de este Server Component.
 */
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const googleAuthUrl = getExternalAuthUrl("google");
  const facebookAuthUrl = getExternalAuthUrl("facebook");
  const appleAuthUrl = getExternalAuthUrl("apple");
  // Decoración de temporada (SEASONAL_THEME* por request) + easter egg ?h=December.
  // Sin usuario: la preferencia (enabled) la resuelve el cliente desde localStorage.
  const { h } = await searchParams;
  const seasonal = { ...getActiveSeason({ easterEgg: isSeasonalEasterEgg(h) }), enabled: null };

  return (
    <Suspense fallback={null}>
      <LoginPageClient
        googleAuthUrl={googleAuthUrl}
        facebookAuthUrl={facebookAuthUrl}
        appleAuthUrl={appleAuthUrl}
        seasonal={seasonal}
      />
    </Suspense>
  );
}
