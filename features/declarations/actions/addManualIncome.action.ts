'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, ManualIncome, ManualIncomeInput } from '../types'

/** Captura un ingreso sin CFDI en la declaración. No recalcula. */
export async function addManualIncome(
  declarationId: number,
  input: ManualIncomeInput,
): Promise<Result<ManualIncome, DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta la declaración.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPost<ManualIncome>(API_ROUTES.DECLARATION.MANUAL_INCOMES(declarationId), input, 'declaration')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      const message = e.status === 403 ? 'Tu perfil no puede capturar ingresos en la declaración.' : e.message
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[addManualIncome] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos guardar el ingreso.' })
  }
}
