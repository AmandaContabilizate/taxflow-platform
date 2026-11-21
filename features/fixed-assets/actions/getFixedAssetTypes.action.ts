'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { FixedAssetType, FixedAssetsError } from '../types'
import { asList } from '@/lib/common/asList'

export async function getFixedAssetTypes(): Promise<Result<FixedAssetType[], FixedAssetsError>> {
  try {
    const data = await fetchGet<unknown>(API_ROUTES.FIXED_ASSETS.TYPES, 'fixed_assets')
    return ok(asList<FixedAssetType>(data))
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[getFixedAssetTypes] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los tipos de activo fijo.' })
  }
}
