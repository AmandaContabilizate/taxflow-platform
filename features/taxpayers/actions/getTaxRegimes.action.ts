'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'

export interface TaxRegime {
  id: number
  name: string
  satCode?: string
  forIndividual?: boolean
  forCompany?: boolean
}

interface GetTaxRegimesError {
  statusCode: number
  message: string
  code?: string
}

export async function getTaxRegimes(): Promise<Result<TaxRegime[], GetTaxRegimesError>> {
  try {
    const data = await fetchGet<TaxRegime[]>(API_ROUTES.CATALOGS.TAX_REGIMES, 'catalogs')
    return ok(Array.isArray(data) ? data : [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getTaxRegimes] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los regímenes fiscales.' })
  }
}
