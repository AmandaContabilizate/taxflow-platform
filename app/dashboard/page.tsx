import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Dashboard from '@/components/dashboard'
import { getCurrentUser } from '@/features/auth/actions'
import { getUserInfo } from '@/features/auth/actions/getUserInfo.action'
import { getUserPreferences } from '@/features/settings/actions/userPreferences.action'
import { readSessionClaims } from '@/lib/api/auth'
import { PUBLIC_ROUTES } from '@/lib/routes'
import { getActiveSeason, isSeasonalEasterEgg } from '@/lib/seasonal'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const user = await getCurrentUser()
  if (!user) redirect(PUBLIC_ROUTES.LOGOUT)

  // Ventana de temporada (App Settings SEASONAL_THEME*) + easter egg ?h=December.
  const { h } = await searchParams
  const activeSeason = getActiveSeason({ easterEgg: isSeasonalEasterEgg(h) })

  // La preferencia solo importa en temporada real (el egg se muestra aunque esté apagada), así
  // fuera de temporada no hay request extra. Si el GET falla, el cliente cae al espejo de
  // localStorage (y si no hay, a encendida).
  const needsPreference = !!activeSeason.season && !activeSeason.easterEgg
  const [userInfo, preferences] = await Promise.all([
    getUserInfo(),
    needsPreference ? getUserPreferences() : Promise.resolve(null),
  ])
  const cookieStore = await cookies()
  const { role, permissions } = await readSessionClaims()
  const userId = cookieStore.get('userId')?.value ?? null

  const fullName = cookieStore.get('fullName')?.value ?? user.fullName ?? user.email ?? 'Usuario'
  const email = cookieStore.get('email')?.value ?? user.email ?? ''
  const rfc = cookieStore.get('rfc')?.value ?? user.rfc ?? null
  const phoneNumber = userInfo?.phoneMobile ?? null
  // Sesiones anteriores a la cookie (o el puente SSO sin el dato) caen al /validate.
  const emailChangeBlockedBy =
    cookieStore.get('emailChangeBlockedBy')?.value ??
    (user.emailChangeBlocked ? (user.emailChangeBlockedReason || '1') : null)
  // Server-only (sin NEXT_PUBLIC_): se prende/apaga en App Settings sin rebuild.
  const tutorialAutostart = process.env.TUTORIAL_AUTOSTART_ENABLED === 'true'

  return (
    <Dashboard
      fullName={fullName}
      email={email}
      rfc={rfc}
      role={role}
      permissions={permissions}
      userId={userId}
      phoneNumber={phoneNumber}
      emailChangeBlockedBy={emailChangeBlockedBy}
      tutorialAutostart={tutorialAutostart}
      seasonal={{
        ...activeSeason,
        enabled: preferences?.success ? preferences.value.seasonalThemeEnabled : null,
      }}
    />
  )
}
