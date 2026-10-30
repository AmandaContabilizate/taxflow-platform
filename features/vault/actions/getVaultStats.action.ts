'use server'

import { cookies } from 'next/headers'
import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type {
  ComparateDecimal,
  ComparateDecimalResponse,
  VaultCountResponse,
  VaultError,
  VaultStats,
} from '../types'

function normalizeDecimal(
  r: ComparateDecimalResponse | null | undefined,
): ComparateDecimal {
  return {
    value: r?.Value ?? r?.value ?? 0,
    percent: r?.Percent ?? r?.percent ?? 'NA',
  }
}

/**
 * Tarjetas superiores de la bóveda: conteo de CFDI emitidos/recibidos y montos
 * totales de ingresos/egresos del año. Golpea los 4 endpoints en paralelo.
 */
export async function getVaultStats(
  rfc: string,
  year: number = new Date().getFullYear(),
): Promise<Result<VaultStats, VaultError>> {
  const cookieStore = await cookies()
  const email = cookieStore.get('email')?.value ?? ''

  if (!email || !rfc) {
    return err({ statusCode: 400, message: 'Falta email o RFC.' })
  }

  try {
    const [issued, received, income, expenses] = await Promise.all([
      fetchGet<VaultCountResponse>(API_ROUTES.VAULT.ISSUED_COUNT(rfc, email), 'vault'),
      fetchGet<VaultCountResponse>(API_ROUTES.VAULT.RECEIVED_COUNT(rfc, email), 'vault'),
      fetchGet<ComparateDecimalResponse>(API_ROUTES.VAULT.TOTAL_INCOME(rfc, email, year), 'vault'),
      fetchGet<ComparateDecimalResponse>(API_ROUTES.VAULT.TOTAL_EXPENSES(rfc, email, year), 'vault'),
    ])

    return ok({
      issuedCount: issued?.submittedDeclarations ?? 0,
      receivedCount: received?.submittedDeclarations ?? 0,
      totalIncome: normalizeDecimal(income),
      totalExpenses: normalizeDecimal(expenses),
    })
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error('[getVaultStats] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener el resumen de tu bóveda.' })
  }
}
