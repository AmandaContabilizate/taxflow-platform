'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError } from '../types'

/** Marca leídos los comentarios del otro lado del hilo. Solo consulta: el back responde 0 sin escribir. */
export async function markDeclarationCommentsRead(
  declarationId: number,
): Promise<Result<{ updated: number }, DeclarationsError>> {
  try {
    const data = await fetchPost<{ updated: number }>(
      API_ROUTES.DECLARATION.COMMENTS_READ(declarationId),
      {},
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[markDeclarationCommentsRead] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos marcar los comentarios como leídos.' })
  }
}
