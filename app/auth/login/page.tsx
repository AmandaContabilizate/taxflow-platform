import { Suspense } from "react";
import { getExternalAuthUrl } from "@/lib/api/apiUrls";
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

export default function LoginPage() {
  const googleAuthUrl = getExternalAuthUrl("google");
  const facebookAuthUrl = getExternalAuthUrl("facebook");
  const appleAuthUrl = getExternalAuthUrl("apple");

  return (
    <Suspense fallback={null}>
      <LoginPageClient
        googleAuthUrl={googleAuthUrl}
        facebookAuthUrl={facebookAuthUrl}
        appleAuthUrl={appleAuthUrl}
      />
    </Suspense>
  );
}
