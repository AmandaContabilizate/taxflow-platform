import { z } from 'zod'

/** El back recorta la descripción a 500 caracteres (`FixedAssetTypeLookup.CleanDescription`). */
const DESCRIPCION_MAX = 500
const descripcion = z
  .string()
  .trim()
  .max(DESCRIPCION_MAX, `La descripción admite hasta ${DESCRIPCION_MAX} caracteres.`)

export const createFixedAssetSchema = z.object({
  rfc: z.string().trim().toUpperCase().min(12, 'RFC inválido.').max(13, 'RFC inválido.'),
  declarationId: z.number().int().positive('Declaración inválida.').optional(),
  invoiceUuid: z.string().trim().uuid('El UUID de la factura no es válido.'),
  assetTypeCode: z.string().trim().min(1, 'Elige el tipo de activo.'),
  // Vacía = sin descripción (el back la guarda como null).
  description: descripcion.optional(),
})

export const updateFixedAssetSchema = z
  .object({
    assetTypeCode: z.string().trim().min(1, 'Elige el tipo de activo.').optional(),
    // `Sugerido` solo lo pone el clasificador: el back responde INVALID_INPUT.
    status: z.enum(['Confirmado', 'Descartado']).optional(),
    description: descripcion.optional(),
  })
  .refine((v) => v.assetTypeCode !== undefined || v.status !== undefined || v.description !== undefined, {
    message: 'No hay cambios que guardar.',
  })

export type CreateFixedAssetSchemaInput = z.input<typeof createFixedAssetSchema>
export type UpdateFixedAssetSchemaInput = z.input<typeof updateFixedAssetSchema>
