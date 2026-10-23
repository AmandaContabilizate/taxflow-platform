'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { toCalc612Error } from '@/lib/api/problemDetail'
import { type Result, err, ok } from '@/lib/common'
import type { FixedAsset, FixedAssetsError } from '../types'
import { asList } from '@/lib/common/asList'

/** Activos del contribuyente (sugeridos, confirmados y descartados) vistos desde una declaración. */
export async function getFixedAssets(
  rfc: string,
  declarationId: number,
): Promise<Result<FixedAsset[], FixedAssetsError>> {
  if (!rfc || !declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Falta el RFC o la declaración.' })
  }
  try {
    const data = await fetchGet<unknown>(API_ROUTES.FIXED_ASSETS.LIST(rfc, declarationId), 'fixed_assets')
    return ok(asList<FixedAsset>(data))
  } catch (e) {
    if (e instanceof ApiError) return err(toCalc612Error(e))
    console.error('[getFixedAssets] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los activos fijos.' })
  }
}
