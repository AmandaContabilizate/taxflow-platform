'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import { type CreateFixedAssetSchemaInput, createFixedAssetSchema } from '../schemas/fixedAsset.schema'
import type { FixedAsset, FixedAssetsError } from '../types'

/** Alta manual: el contador marca un gasto como activo fijo. Queda Confirmado. */
export async function createFixedAsset(
  input: CreateFixedAssetSchemaInput,
): Promise<Result<FixedAsset, FixedAssetsError>> {
  const parsed = createFixedAssetSchema.safeParse(input)
  if (!parsed.success) {
    return err({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Datos del activo inválidos.' })
  }
  try {
    const data = await fetchPost<FixedAsset>(API_ROUTES.FIXED_ASSETS.CREATE, parsed.data, 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[createFixedAsset] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos marcar el gasto como activo fijo.' })
  }
}
