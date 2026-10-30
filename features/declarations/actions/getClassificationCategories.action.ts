'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { ClassificationCategory, DeclarationsError } from '../types'

/**
 * Catálogo de clasificaciones (`classification.clasificacion`). Es la única fuente
 * de verdad que acepta el clasificador: el `name` de aquí es lo que va en
 * `adjustments[].classification` al recalcular.
 *
 * `isExpense` omitido trae gastos e ingresos.
 */
export async function getClassificationCategories(
  isExpense?: boolean,
): Promise<Result<ClassificationCategory[], DeclarationsError>> {
  try {
    const data = await fetchGet<ClassificationCategory[]>(
      API_ROUTES.CATALOGS.CLASSIFICATIONS(isExpense),
      'catalogs_procedures',
    )
    return ok(Array.isArray(data) ? data : [])
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getClassificationCategories] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener el catálogo de clasificaciones.' })
  }
}
