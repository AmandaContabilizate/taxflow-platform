'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { DeclarationsError, ForcePostResult } from '../types'

/**
 * Autoriza la presentación de una declaración en PorPresentar (11): la encola en su cola de
 * posteo aunque no cumpla pago/descargas. Queda registrado que el usuario de la sesión la autorizó.
 * Presentar ante el SAT no se deshace.
 */
export async function forcePostDeclaration(
  declarationId: number,
): Promise<Result<ForcePostResult, DeclarationsError>> {
  if (!Number.isInteger(declarationId) || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Declaración inválida.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchPost<ForcePostResult>(
      API_ROUTES.DECLARATION.FORCE_POST(declarationId),
      undefined,
      'declaration',
    )
    return ok(data ?? { declarationId, task: '', enqueued: false, taskAttemptId: null })
  } catch (e) {
    if (e instanceof ApiError) {
      const message =
        e.status === 401 || e.status === 403
          ? 'No tienes permiso para autorizar presentaciones.'
          : e.status === 404
            ? 'La declaración ya no existe.'
            : e.message || 'No pudimos enviar la declaración.'
      return err({ statusCode: e.status, message, code: e.errorCode })
    }
    console.error('[forcePostDeclaration] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos enviar la declaración.' })
  }
}
