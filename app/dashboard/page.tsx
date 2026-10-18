import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { getCurrentUser } from '@/features/auth/actions'
import { getUserInfo } from '@/features/auth/actions/getUserInfo.action'
import { readSessionClaims } from '@/lib/api/auth'
import { PUBLIC_ROUTES } from '@/lib/routes'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect(PUBLIC_ROUTES.LOGOUT)

  const userInfo = await getUserInfo()
  const cookieStore = await cookies()
  const { role, permissions } = await readSessionClaims()
  const userId = cookieStore.get('userId')?.value ?? null

  const fullName = cookieStore.get('fullName')?.value ?? user.fullName ?? user.email ?? 'Usuario'
  const email = cookieStore.get('email')?.value ?? user.email ?? ''
  const rfc = cookieStore.get('rfc')?.value ?? user.rfc ?? null
  const phoneNumber = userInfo?.phoneMobile ?? null

  return (
    <Dashboard
      fullName={fullName}
      email={email}
      rfc={rfc}
      role={role}
      permissions={permissions}
      userId={userId}
      phoneNumber={phoneNumber}
    />
  )
}
