'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { IvaFavorBalancesError, SatFavorBalancesForDeclaration } from '../types'

/** Saldos a favor que el SAT imprimió en los acuses, disponibles para la declaración. */
export async function getSatFavorBalances(
  declarationId: number,
): Promise<Result<SatFavorBalancesForDeclaration, IvaFavorBalancesError>> {
  if (!declarationId || declarationId <= 0) return err({ statusCode: 400, message: 'Declaración inválida.' })
  try {
    const data = await fetchGet<SatFavorBalancesForDeclaration>(
      API_ROUTES.IVA_FAVOR_BALANCES.SAT(declarationId),
      'iva_favor_balances',
    )
    return ok({ ...data, iva: data?.iva ?? [], isr: data?.isr ?? [], calculated: data?.calculated ?? [] })
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[getSatFavorBalances] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los saldos a favor del SAT.' })
  }
}
