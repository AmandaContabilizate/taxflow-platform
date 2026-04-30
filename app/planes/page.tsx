import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlanesClient from './planes-client'

export default async function PlanesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: regimes }, { data: credentials }] = await Promise.all([
    supabase.from('fiscal_regimes').select('*').order('name'),
    supabase.from('user_credentials').select('*, fiscal_regime:fiscal_regimes(name)').eq('user_id', user.id).single(),
  ])

  const detectedRegimeName = (credentials as any)?.fiscal_regime?.name ?? null

  return (
    <PlanesClient
      regimes={regimes ?? []}
      detectedRegimeName={detectedRegimeName}
    />
  )
}
