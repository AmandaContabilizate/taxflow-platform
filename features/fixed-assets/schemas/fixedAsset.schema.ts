import { z } from 'zod'

export const createFixedAssetSchema = z.object({
  rfc: z.string().trim().toUpperCase().min(12, 'RFC inválido.').max(13, 'RFC inválido.'),
  declarationId: z.number().int().positive('Declaración inválida.'),
  invoiceUuid: z.string().trim().min(1, 'Falta el UUID de la factura.'),
  assetTypeCode: z.string().trim().min(1, 'Elige el tipo de activo.'),
  description: z.string().trim().max(250, 'La descripción admite hasta 250 caracteres.'),
})

export const updateFixedAssetSchema = z
  .object({
    assetTypeCode: z.string().trim().min(1, 'Elige el tipo de activo.').optional(),
    status: z.enum(['Sugerido', 'Confirmado', 'Descartado']).optional(),
    description: z.string().trim().max(250, 'La descripción admite hasta 250 caracteres.').optional(),
  })
  .refine((v) => v.assetTypeCode !== undefined || v.status !== undefined || v.description !== undefined, {
    message: 'No hay cambios que guardar.',
  })

export type CreateFixedAssetSchemaInput = z.input<typeof createFixedAssetSchema>
export type UpdateFixedAssetSchemaInput = z.input<typeof updateFixedAssetSchema>
