'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

/**
 * Caché de datos del dashboard (TanStack Query). Vive en el root del dashboard
 * y no en `app/layout`: solo las pantallas del dashboard la usan, y así la caché
 * sobrevive al cambio de pantalla (listado → detalle → listado) sin salir de la SPA.
 *
 * Defaults pensados para no disparar llamadas que hoy no existen: sin reintentos
 * (las server actions ya devuelven el error al primer fallo) y sin refetch al
 * volver a la ventana o reconectar. Cada hook fija su propio `staleTime`.
 */
export function DashboardQueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
