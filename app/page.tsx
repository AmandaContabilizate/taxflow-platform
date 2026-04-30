import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    // Check if user has completed onboarding
    const { data: creds } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (creds) {
      redirect('/dashboard')
    } else {
      redirect('/onboarding')
    }
  }

  redirect('/auth/login')
}
