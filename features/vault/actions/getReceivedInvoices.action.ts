'use server'

import { cookies } from 'next/headers'
import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { VaultError, VaultInvoice, VaultInvoicesResponse } from '../types'

/** Listado de CFDI recibidos por el contribuyente (vault/received-invoices). */
export async function getReceivedInvoices(
  rfc: string,
): Promise<Result<VaultInvoice[], VaultError>> {
  const cookieStore = await cookies()
  const email = cookieStore.get('email')?.value ?? ''

  if (!email || !rfc) {
    return err({ statusCode: 400, message: 'Falta email o RFC.' })
  }

  try {
    const data = await fetchGet<VaultInvoicesResponse>(
      API_ROUTES.VAULT.RECEIVED_INVOICES(rfc, email),
      'vault',
    )
    return ok(data?.submittedDeclarations ?? [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error('[getReceivedInvoices] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tus facturas recibidas.' })
  }
}
