'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import { asList } from '@/lib/common/asList'
import type { IvaFavorBalance, IvaFavorBalancesError } from '../types'

/** Historial de saldos a favor de IVA del contribuyente, con sus aplicaciones. */
export async function getIvaFavorBalances(rfc: string): Promise<Result<IvaFavorBalance[], IvaFavorBalancesError>> {
  if (!rfc) return err({ statusCode: 400, message: 'Falta el RFC.' })
  try {
    const data = await fetchGet<unknown>(API_ROUTES.IVA_FAVOR_BALANCES.LIST(rfc), 'iva_favor_balances')
    return ok(asList<IvaFavorBalance>(data))
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[getIvaFavorBalances] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los saldos a favor de IVA.' })
  }
}
