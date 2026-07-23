'use server'

import { cookies } from 'next/headers'
import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { VaultError, VaultInvoice, VaultInvoicesResponse } from '../types'
import type { InvoiceFilters } from './getIssuedInvoices.action'

/** Listado de CFDI recibidos por el contribuyente (vault/received-invoices). */
export async function getReceivedInvoices(
  rfc: string,
  filters?: InvoiceFilters,
): Promise<Result<VaultInvoice[], VaultError>> {
  const cookieStore = await cookies()
  const email = cookieStore.get('email')?.value ?? ''

  if (!email || !rfc) {
    return err({ statusCode: 400, message: 'Falta email o RFC.' })
  }

  try {
    let endpoint = API_ROUTES.VAULT.RECEIVED_INVOICES(rfc, email)

    if (filters) {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.from) params.append('from', filters.from)
      if (filters.to) params.append('to', filters.to)
      if (filters.rfcSearch) params.append('rfcSearch', filters.rfcSearch)
      if (filters.cfdiUse) params.append('cfdiUse', filters.cfdiUse)
      if (filters.minTotal !== undefined) params.append('minTotal', filters.minTotal.toString())
      if (filters.maxTotal !== undefined) params.append('maxTotal', filters.maxTotal.toString())
      if (filters.statusCfdi) params.append('statusCfdi', filters.statusCfdi.toString())
      if (filters.typeCfdi?.length) {
        filters.typeCfdi.forEach(t => params.append('typeCfdi', t))
      }

      if (params.toString()) {
        endpoint += `&${params.toString()}`
      }
    }

    const data = await fetchGet<VaultInvoicesResponse>(endpoint, 'vault')
    return ok(data?.submittedDeclarations ?? [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message })
    }
    console.error('[getReceivedInvoices] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener tus facturas recibidas.' })
  }
}
