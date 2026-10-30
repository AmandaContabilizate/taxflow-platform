'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'

export interface TaxpayerData {
  taxRegimes?: Array<{ regimeId: number; idActivities?: number[] }>
}

interface GetTaxpayerError {
  statusCode: number
  message: string
  code?: string
}

export async function getTaxpayerByRfc(rfc: string): Promise<Result<TaxpayerData, GetTaxpayerError>> {
  if (!rfc) {
    return err({ statusCode: 400, message: 'Falta el RFC.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<TaxpayerData>(
      `/Taxpayers${API_ROUTES.TAXPAYERS.GET_BY_RFC(rfc)}`,
      'default',
    )
    return ok(data || {})
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getTaxpayerByRfc] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los regímenes fiscales.' })
  }
}
