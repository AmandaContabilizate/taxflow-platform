'use server'

import { ApiError, fetchPost, fetchPut } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import { type CapturedFixedAssetSchemaInput, capturedFixedAssetSchema } from '../schemas/fixedAsset.schema'
import type { FixedAsset, FixedAssetsError } from '../types'

function invalid(issues: { message: string }[]): Result<FixedAsset, FixedAssetsError> {
  return err({ statusCode: 400, message: issues[0]?.message ?? 'Datos del activo inválidos.' })
}

/**
 * Alta de un activo que el cliente ya venía depreciando y no tiene factura en el sistema (R7).
 * Queda Confirmado; el back deriva el monto deducible (mensual × 12 ÷ tasa del tipo).
 */
export async function createCapturedFixedAsset(
  input: CapturedFixedAssetSchemaInput,
): Promise<Result<FixedAsset, FixedAssetsError>> {
  const parsed = capturedFixedAssetSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error.issues)
  try {
    const data = await fetchPost<FixedAsset>(API_ROUTES.FIXED_ASSETS.CAPTURED, parsed.data, 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[createCapturedFixedAsset] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos dar de alta el activo capturado.' })
  }
}

/** Corrección de un activo capturado: mismos campos que el alta. */
export async function updateCapturedFixedAsset(
  id: number,
  input: CapturedFixedAssetSchemaInput,
): Promise<Result<FixedAsset, FixedAssetsError>> {
  if (!id || id <= 0) return err({ statusCode: 400, message: 'Activo inválido.' })
  const parsed = capturedFixedAssetSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error.issues)
  try {
    const data = await fetchPut<FixedAsset>(API_ROUTES.FIXED_ASSETS.CAPTURED_UPDATE(id), parsed.data, 'fixed_assets')
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[updateCapturedFixedAsset] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos guardar la corrección del activo capturado.' })
  }
}
