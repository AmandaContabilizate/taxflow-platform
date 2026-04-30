import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Dashboard from '@/components/dashboard'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [
    { data: profile },
    { data: credentials },
    { data: declarations },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('user_credentials')
      .select('*, fiscal_regime:fiscal_regimes(*)')
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('declarations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) {
    redirect('/auth/login')
  }

  const regime = (credentials as any)?.fiscal_regime ?? null
  const credentialsClean = credentials
    ? { ...credentials, fiscal_regime: undefined }
    : null

  return (
    <Dashboard
      profile={profile}
      credentials={credentialsClean as any}
      declarations={declarations ?? []}
      regime={regime}
    />
  )
}
