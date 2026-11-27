'use server'

import { ApiError, fetchDelete } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { problemDetailMessage } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, ManualIncomeRemoval } from '../types'

/** Quita un ingreso sin CFDI de la declaración. No recalcula. */
export async function removeManualIncome(
  declarationId: number,
  id: number,
): Promise<Result<ManualIncomeRemoval, DeclarationsError>> {
  if (!declarationId || !id) {
    return err({ statusCode: 400, message: 'Falta la declaración o el ingreso.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchDelete<ManualIncomeRemoval>(API_ROUTES.DECLARATION.MANUAL_INCOME(declarationId, id), 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      const message = e.status === 403 ? 'Tu perfil no puede quitar ingresos de la declaración.' : problemDetailMessage(e)
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[removeManualIncome] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos quitar el ingreso.' })
  }
}
