'use server'

import { ApiError, fetchPost } from '@/lib/api'
import { API_ROUTES } from '@/lib/api/apiRoutes'
import { type Result, err, ok } from '@/lib/common'
import {
  type RecalculateDeclarationInput,
  recalculateDeclarationSchema,
} from '../schemas/recalculate.schema'
import type { DeclarationsError, RecalculationResult } from '../types'

/**
 * Recalcula la declaración de un contribuyente (botón "Recalcular" del contador).
 *
 * Sin `adjustments` reclasifica desde cero; con ellos aplica primero las
 * correcciones manuales del contador y vuelve a calcular sin pasar por la IA. La
 * respuesta ya trae los totales y la clasificación nuevos, así que la pantalla se
 * repinta sin un segundo round-trip.
 *
 * El cálculo baja y parsea los XML del blob: puede tardar minutos (timeout del
 * clasificador, 180s por default).
 */
export async function recalculateDeclaration(
  input: RecalculateDeclarationInput,
): Promise<Result<RecalculationResult, DeclarationsError>> {
  const parsed = recalculateDeclarationSchema.safeParse(input)
  if (!parsed.success) {
    return err({
      statusCode: 400,
      message: parsed.error.issues[0]?.message ?? 'Datos de recálculo inválidos.',
    })
  }

  // Los campos opcionales de cada ajuste ya vienen omitidos por Zod (no como
  // null), que es justo lo que espera el `exclude_unset` del clasificador.
  try {
    const data = await fetchPost<RecalculationResult>(
      API_ROUTES.DECLARATION.RECALCULATE,
      parsed.data,
      'declaration',
    )
    return ok(data)
  } catch (e) {
    if (e instanceof ApiError) {
      // CLASSIFICATION_ADJUSTMENT_INVALID no está en errorCatalog a propósito: su
      // `detail` trae los UUID/nombre que no se resolvieron y es lo que le sirve
      // al contador para corregir.
      return err({ statusCode: e.status, message: e.message, code: e.errorCode })
    }
    console.error('[recalculateDeclaration] Error:', e)
    return err({ statusCode: 500, message: 'No pudimos recalcular la declaración.' })
  }
}
