'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationComment, DeclarationsError } from '../types'

export async function getDeclarationComments(
  declarationId: number,
): Promise<Result<DeclarationComment[], DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta el id de la declaración.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<DeclarationComment[]>(
      API_ROUTES.DECLARATION.COMMENTS(declarationId),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[getDeclarationComments] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos obtener los comentarios.' })
  }
}
