'use server'

import { fetchGetPublic } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'

/**
 * ¿Existe el código de referido de cliente (CBX-XXXXXX)? Endpoint anónimo que solo responde `{ valid }`.
 * Es un aviso, no un bloqueo: ante cualquier fallo de red devuelve `null` (desconocido) y el registro sigue.
 */
export async function validateReferralCode(code: string): Promise<boolean | null> {
  try {
    const data = await fetchGetPublic<{ valid: boolean }>(API_ROUTES.REFERRALS.VALIDATE(code.trim()), 'referrals')
    return typeof data?.valid === 'boolean' ? data.valid : null
  } catch {
    return null
  }
}
