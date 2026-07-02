import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { getCurrentUser } from '@/features/auth/actions'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')

  const cookieStore = await cookies()
  const role = cookieStore.get('claim_role')?.value ?? null
  const permissions = parsePermissions(cookieStore.get('claim_permission')?.value)
  const userId = cookieStore.get('userId')?.value ?? null

  return (
    <Dashboard
      fullName={user.fullName ?? user.email ?? 'Usuario'}
      email={user.email ?? ''}
      rfc={user.rfc ?? null}
      role={role}
      permissions={permissions}
      userId={userId}
    />
  )
}

function parsePermissions(raw: string | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter((p): p is string => typeof p === 'string')
    if (typeof parsed === 'string') return [parsed]
  } catch {
    return [raw]
  }
  return []
}
