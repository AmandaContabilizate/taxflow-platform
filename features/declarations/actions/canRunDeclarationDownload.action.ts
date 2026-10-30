'use server'

import { ApiError, fetchGet } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import type { CanRunDeclarationDownload, DeclarationsError } from '../types'

/**
 * ¿El contador puede re-encolar ahora la descarga de archivos SAT de esta declaración?
 * Solo lectura — llamar antes de pintar el botón (el POST revalida igual).
 */
export async function canRunDeclarationDownload(
  declarationId: number,
): Promise<Result<CanRunDeclarationDownload, DeclarationsError>> {
  if (!declarationId || declarationId <= 0) {
    return err({ statusCode: 400, message: 'Declaración inválida.', code: 'INVALID_REQUEST' })
  }

  try {
    const data = await fetchGet<CanRunDeclarationDownload>(
      API_ROUTES.DECLARATION.DOWNLOAD_FILES_CAN_RUN(declarationId),
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[canRunDeclarationDownload] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos consultar el estado de la descarga.' })
  }
}
