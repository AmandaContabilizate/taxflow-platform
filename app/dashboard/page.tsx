import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { getCurrentUser } from '@/features/auth/actions'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  return (
    <Dashboard
      fullName={user.fullName ?? user.email ?? 'Usuario'}
      email={user.email ?? ''}
      rfc={user.rfc ?? null}
    />
  )
}
