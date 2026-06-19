import { redirect } from 'next/navigation'
import { getActivePlan } from '@/features/account/actions/getActivePlan.action'
import type { ActivePlan } from '@/features/account/types'
import { getCurrentUser } from '@/features/auth/actions'
import type { FiscalRegime } from '@/lib/types'
import PlanesClient from './planes-client'

// TODO(backend): exponer endpoint catálogo de regímenes en Identity/Catalogs
// y reemplazar este fallback estático.
const DEFAULT_REGIMES: FiscalRegime[] = [
  { id: 'resico', name: 'Régimen Simplificado de Confianza', description: 'RESICO', created_at: '' },
  { id: 'rif', name: 'Régimen de Incorporación Fiscal', description: 'RIF', created_at: '' },
  { id: 'actividad-empresarial', name: 'Actividades Empresariales y Profesionales', description: '', created_at: '' },
  { id: 'sueldos-salarios', name: 'Sueldos y Salarios', description: '', created_at: '' },
  { id: 'arrendamiento', name: 'Arrendamiento', description: '', created_at: '' },
  { id: 'persona-moral-general', name: 'Personas Morales Régimen General', description: '', created_at: '' },
]

export default async function PlanesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/auth/login')
  }

  // TODO(backend): leer credenciales/régimen del usuario desde el backend.
  const detectedRegimeName: string | null = null

  // Plan activo del RFC en sesión (server-side; el RFC del usuario es la
  // fuente canónica disponible aquí).
  let activePlan: ActivePlan | null = null
  if (user.rfc) {
    const res = await getActivePlan(user.rfc)
    if (res.success) activePlan = res.value
  }

  return (
    <PlanesClient
      regimes={DEFAULT_REGIMES}
      detectedRegimeName={detectedRegimeName}
      activePlan={activePlan}
    />
  )
}
