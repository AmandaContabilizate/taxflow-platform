'use server'

import { ApiError, fetchPut } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type UpdateIvaFavorBalanceSchemaInput,
  updateIvaFavorBalanceSchema,
} from '../schemas/ivaFavorBalance.schema'
import type { IvaFavorBalance, IvaFavorBalancesError } from '../types'

export async function updateIvaFavorBalance(
  id: number,
  input: UpdateIvaFavorBalanceSchemaInput,
): Promise<Result<IvaFavorBalance | null, IvaFavorBalancesError>> {
  if (!id || id <= 0) return err({ statusCode: 400, message: 'Saldo inválido.' })
  const parsed = updateIvaFavorBalanceSchema.safeParse(input)
  if (!parsed.success) {
    return err({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Datos del saldo inválidos.' })
  }
  try {
    const data = await fetchPut<IvaFavorBalance | string>(
      API_ROUTES.IVA_FAVOR_BALANCES.UPDATE(id),
      parsed.data,
      'iva_favor_balances',
    )
    return ok(data && typeof data === 'object' ? data : null)
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    console.error('[updateIvaFavorBalance] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos actualizar el saldo a favor.' })
  }
}
