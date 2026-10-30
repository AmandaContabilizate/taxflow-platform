'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationComment, DeclarationsError } from '../types'

export async function postDeclarationComment(
  declarationId: number,
  text: string,
): Promise<Result<DeclarationComment, DeclarationsError>> {
  if (!declarationId) {
    return err({ statusCode: 400, message: 'Falta el id de la declaración.', code: 'INVALID_REQUEST' })
  }
  if (!text.trim()) {
    return err({ statusCode: 400, message: 'El comentario no puede estar vacío.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPost<DeclarationComment>(
      API_ROUTES.DECLARATION.COMMENTS(declarationId),
      { text },
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[postDeclarationComment] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos publicar el comentario.' })
  }
}
