import { redirect } from 'next/navigation'
import OnboardingClient from './onboarding-client'
import { getCurrentUser } from '@/features/auth/actions'
import { PUBLIC_ROUTES } from '@/lib/routes'

/**
 * Onboarding tras migración a backend Bearer.
 *
 * TODO(backend):
 *   credentials ← GET /api/taxpayers/me  (para precargar RFC si ya existe)
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect(PUBLIC_ROUTES.LOGOUT)

  return (
    <OnboardingClient
      existingRfc={user.rfc ?? undefined}
      hasCredentials={false}
    />
  )
}
