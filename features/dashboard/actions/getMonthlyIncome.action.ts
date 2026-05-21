'use server'

import { cookies } from 'next/headers'
import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { MonthlyIncome, ReportError } from '../tools/types'

export async function getMonthlyIncome(
  rfc: string,
): Promise<Result<MonthlyIncome, ReportError>> {
  const cookieStore = await cookies()
  const email = cookieStore.get('email')?.value ?? ''

  if (!email || !rfc) {
    return err({ statusCode: 400, message: 'Falta email o RFC.' })
  }

  try {
    const endpoint = `${API_ROUTES.REPORTS.MONTHLY_INCOME}?email=${encodeURIComponent(email)}&rfc=${encodeURIComponent(rfc)}`
    const value = await fetchGet<number>(endpoint, 'dashboard_reports')
    return ok(value ?? 0)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error('[getMonthlyIncome] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los ingresos del mes.' })
  }
}
