'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type CreateIvaFavorBalanceSchemaInput,
  createIvaFavorBalanceSchema,
} from '../schemas/ivaFavorBalance.schema'
import type { IvaFavorBalance, IvaFavorBalancesError } from '../types'

/** Captura manual de un saldo de un mes que el sistema no tiene. */
export async function createIvaFavorBalance(
  input: CreateIvaFavorBalanceSchemaInput,
): Promise<Result<IvaFavorBalance, IvaFavorBalancesError>> {
  const parsed = createIvaFavorBalanceSchema.safeParse(input)
  if (!parsed.success) {
    return err({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Datos del saldo inválidos.' })
  }
  try {
    const data = await fetchPost<IvaFavorBalance>(API_ROUTES.IVA_FAVOR_BALANCES.CREATE, parsed.data, 'iva_favor_balances')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    console.error('[createIvaFavorBalance] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos guardar el saldo a favor.' })
  }
}
