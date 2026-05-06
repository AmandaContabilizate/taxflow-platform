import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { getCurrentUser } from '@/features/auth/actions'
import type { Declaration, Profile } from '@/lib/types'

/**
 * Dashboard tras migración a backend Bearer (ContaboxPro core2).
 *
 * TODO(backend): los datos abajo eran queries a Supabase. Hay que exponer
 * endpoints en el backend y reemplazar los stubs:
 *
 *   profile      ← GET /api/users/me           (o adaptar /api/auth/validate)
 *   credentials  ← GET /api/taxpayers/me        (rfc, ciec, fiel, regimen_id)
 *   regime       ← GET /api/catalogs/fiscal-regimes/{id}
 *   declarations ← GET /api/declaration?userId=…
 *
 * Mientras tanto, el dashboard se renderiza con datos mínimos derivados del
 * token (email, nombre, rfc) y los demás como null/[].
 */
export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const now = new Date().toISOString()
  const profile: Profile = {
    id: user.userId,
    email: user.email ?? '',
    full_name: user.fullName ?? null,
    role: 'user',
    photo_url: null,
    oauth_provider: null,
    created_at: now,
    updated_at: now,
  }

  // TODO: reemplazar con llamadas al backend.
  const credentials = null
  const declarations: Declaration[] = []
  const regime = null

  return (
    <Dashboard
      profile={profile}
      credentials={credentials}
      declarations={declarations}
      regime={regime}
    />
  )
}
