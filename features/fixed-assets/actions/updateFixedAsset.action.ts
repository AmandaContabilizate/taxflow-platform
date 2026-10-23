'use server'

import { ApiError, fetchPut } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import { type UpdateFixedAssetSchemaInput, updateFixedAssetSchema } from '../schemas/fixedAsset.schema'
import type { FixedAsset, FixedAssetsError } from '../types'

/** Confirmar, descartar, cambiar el tipo o la descripción. Solo viaja lo que cambia. */
export async function updateFixedAsset(
  id: number,
  input: UpdateFixedAssetSchemaInput,
): Promise<Result<FixedAsset, FixedAssetsError>> {
  if (!id || id <= 0) return err({ statusCode: 400, message: 'Activo inválido.' })
  const parsed = updateFixedAssetSchema.safeParse(input)
  if (!parsed.success) {
    return err({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Datos del activo inválidos.' })
  }
  try {
    const data = await fetchPut<FixedAsset>(API_ROUTES.FIXED_ASSETS.UPDATE(id), parsed.data, 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[updateFixedAsset] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos guardar el cambio del activo fijo.' })
  }
}
