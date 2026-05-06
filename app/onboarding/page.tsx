import { redirect } from 'next/navigation'
import OnboardingClient from './onboarding-client'
import { getCurrentUser } from '@/features/auth/actions'
import type { FiscalRegime } from '@/lib/types'

/**
 * Onboarding tras migración a backend Bearer.
 *
 * TODO(backend):
 *   regimes     ← GET /api/catalogs/fiscal-regimes
 *   credentials ← GET /api/taxpayers/me  (para precargar RFC si ya existe)
 */
export default async function OnboardingPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  // TODO: reemplazar por fetchGet a /api/catalogs/fiscal-regimes (apiType "catalogs").
  const regimes: FiscalRegime[] = []

  return (
    <OnboardingClient
      regimes={regimes}
      existingRfc={user.rfc ?? undefined}
      hasCredentials={false}
    />
  )
}
