'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import { taxpayerGroupsSchema, type TaxpayerGroupsInput } from '../schemas/taxpayerPurchases.schema'
import type { DeclarationsError, PagedDeclarations, TaxpayerGroup } from '../types'

/** Nivel 1 del tab de declaraciones en proceso: contribuyentes con planes a futuro comprados. */
export async function getDeclarationTaxpayers(
  input: TaxpayerGroupsInput = {},
): Promise<Result<PagedDeclarations<TaxpayerGroup>, DeclarationsError>> {
  const parsed = taxpayerGroupsSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Parámetros inválidos.',
      code: 'INVALID_REQUEST',
    })
  }

  const { search, skip, take, kind, taxRegimeId, onlyUpcoming, statusId } = parsed.data

  try {
    const data = await fetchGet<PagedDeclarations<TaxpayerGroup>>(
      API_ROUTES.DECLARATION.DECLARATION_TAXPAYERS({ search, skip, take, kind, taxRegimeId, onlyUpcoming, statusId }),
      'declaration',
    )
    return ok({ items: data?.items ?? [], total: data?.total ?? 0, skip, take })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationTaxpayers] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los contribuyentes.' })
  }
}
