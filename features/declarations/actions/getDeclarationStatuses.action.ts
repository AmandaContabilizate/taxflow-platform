'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationStatusCatalogItem, DeclarationsError } from '../types'

/** Catálogo completo de `Catalogs.StatusDeclaration` (15 filas, sin filtros ni paginación). */
export async function getDeclarationStatuses(): Promise<Result<DeclarationStatusCatalogItem[], DeclarationsError>> {
  try {
    const data = await fetchGet<DeclarationStatusCatalogItem[]>(
      API_ROUTES.CATALOGS.DECLARATION_STATUSES,
      'catalogs_procedures',
    )
    return ok(Array.isArray(data) ? data : [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationStatuses] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener el catálogo de estatus.' })
  }
}
