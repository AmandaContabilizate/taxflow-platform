'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  taxpayerPurchasesSchema,
  type TaxpayerPurchasesInput,
} from '../schemas/taxpayerPurchases.schema'
import type { DeclarationsError, PagedDeclarations, TaxpayerDeclarationItem } from '../types'

/** Planes a futuro (kind 2) comprados y en proceso. Sin `rfc` trae los de todos. */
export async function getDeclarationsByTaxpayer(
  input: TaxpayerPurchasesInput = {},
): Promise<Result<PagedDeclarations<TaxpayerDeclarationItem>, DeclarationsError>> {
  const parsed = taxpayerPurchasesSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Parámetros inválidos.',
      code: 'INVALID_REQUEST',
    })
  }

  const { rfc, skip, take, kind, taxRegimeId, onlyUpcoming, statusId } = parsed.data

  try {
    const data = await fetchGet<PagedDeclarations<TaxpayerDeclarationItem>>(
      API_ROUTES.DECLARATION.DECLARATIONS_BY_TAXPAYER({ rfc, skip, take, kind, taxRegimeId, onlyUpcoming, statusId }),
      'declaration',
    )
    return ok({ items: data?.items ?? [], total: data?.total ?? 0, skip, take })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationsByTaxpayer] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener las declaraciones.' })
  }
}
