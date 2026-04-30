import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './onboarding-client'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: regimes }, { data: credentials }] = await Promise.all([
    supabase.from('fiscal_regimes').select('*').order('name'),
    supabase.from('user_credentials').select('*').eq('user_id', user.id).single(),
  ])

  return (
    <OnboardingClient
      regimes={regimes ?? []}
      existingRfc={credentials?.rfc ?? undefined}
      hasCredentials={!!credentials}
    />
  )
}
