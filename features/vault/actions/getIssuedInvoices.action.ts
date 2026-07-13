'use server'

import { cookies } from 'next/headers'
import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { VaultError, VaultInvoice, VaultInvoicesResponse } from '../types'

/** Listado de CFDI emitidos por el contribuyente (vault/issued-invoices). */
export async function getIssuedInvoices(
  rfc: string,
): Promise<Result<VaultInvoice[], VaultError>> {
  const cookieStore = await cookies()
  const email = cookieStore.get('email')?.value ?? ''

  if (!email || !rfc) {
    return err({ statusCode: 400, message: 'Falta email o RFC.' })
  }

  try {
    const data = await fetchGet<VaultInvoicesResponse>(
      API_ROUTES.VAULT.ISSUED_INVOICES(rfc, email),
      'vault',
    )
    return ok(data?.submittedDeclarations ?? [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error('[getIssuedInvoices] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tus facturas emitidas.' })
  }
}
