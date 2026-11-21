'use server'

import { ApiError, fetchDelete, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import { type DisposeFixedAssetSchemaInput, disposeFixedAssetSchema } from '../schemas/fixedAsset.schema'
import type { FixedAsset, FixedAssetsError } from '../types'

/**
 * Venta o pérdida de un activo Confirmado (o corrección de una baja ya capturada). Desde la
 * fecha de baja el activo deja de depreciarse.
 */
export async function disposeFixedAsset(
  id: number,
  input: DisposeFixedAssetSchemaInput,
): Promise<Result<FixedAsset, FixedAssetsError>> {
  if (!id || id <= 0) return err({ statusCode: 400, message: 'Activo inválido.' })
  const parsed = disposeFixedAssetSchema.safeParse(input)
  if (!parsed.success) {
    return err({ statusCode: 400, message: parsed.error.issues[0]?.message ?? 'Datos de la baja inválidos.' })
  }
  try {
    const data = await fetchPost<FixedAsset>(API_ROUTES.FIXED_ASSETS.DISPOSAL(id), parsed.data, 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[disposeFixedAsset] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos registrar la baja del activo fijo.' })
  }
}

/** Revierte una baja capturada por error: el activo vuelve a Confirmado. */
export async function revertFixedAssetDisposal(id: number): Promise<Result<FixedAsset, FixedAssetsError>> {
  if (!id || id <= 0) return err({ statusCode: 400, message: 'Activo inválido.' })
  try {
    const data = await fetchDelete<FixedAsset>(API_ROUTES.FIXED_ASSETS.DISPOSAL(id), 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[revertFixedAssetDisposal] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos revertir la baja del activo fijo.' })
  }
}
