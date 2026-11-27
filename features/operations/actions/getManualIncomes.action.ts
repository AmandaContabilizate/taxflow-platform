'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { ManualIncome } from '@/features/declarations/types'

interface OpsError {
  statusCode: number
  message: string
  code?: string
}

/** Ingresos sin CFDI de la declaración. Con `consulta` va por la ruta espejo de solo lectura. */
export async function getManualIncomes(
  declarationId: number,
  consulta = false,
): Promise<Result<ManualIncome[], OpsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Declaración inválida.' })
  }

  try {
    const data = await fetchGet<ManualIncome[]>(
      API_ROUTES.DECLARATIONS_OPS.MANUAL_INCOMES(declarationId, consulta),
      'declarations_reports',
    )
    return ok(Array.isArray(data) ? data : [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getManualIncomes] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los ingresos sin CFDI.' })
  }
}
