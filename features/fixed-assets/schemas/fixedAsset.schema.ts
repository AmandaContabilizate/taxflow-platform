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

const hoyIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const dosDecimales = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6

/** Venta o pérdida (`FixedAssetDisposalRules` del back). Una pérdida no lleva datos de venta. */
export const disposeFixedAssetSchema = z
  .object({
    kind: z.enum(['Sold', 'Lost'], { errorMap: () => ({ message: 'Elige si se vendió o se perdió.' }) }),
    disposalDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Captura la fecha de la venta o de la pérdida.')
      .refine((d) => d >= '2000-01-01', 'La fecha no puede ser anterior a 2000.')
      .refine((d) => d <= hoyIso(), 'La fecha no puede ser futura.'),
    salePrice: z
      .number({ invalid_type_error: 'Precio de venta: captura un número.' })
      .finite()
      .positive('El precio de venta debe ser mayor a cero.')
      .refine(dosDecimales, 'Precio de venta: máximo dos decimales.')
      .optional(),
    buyerRfc: z.string().trim().toUpperCase().min(12, 'RFC del comprador inválido.').max(13, 'RFC del comprador inválido.').optional(),
    buyerName: z.string().trim().max(300, 'El nombre admite hasta 300 caracteres.').optional(),
    saleInvoiceUuid: z.string().trim().uuid('El UUID de la factura de venta no es válido.').optional(),
    notes: z.string().trim().max(1000, 'Las notas admiten hasta 1000 caracteres.').optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === 'Lost' && (v.salePrice != null || v.buyerRfc || v.buyerName || v.saleInvoiceUuid)) {
      ctx.addIssue({ code: 'custom', path: ['kind'], message: 'Una pérdida no lleva precio, comprador ni factura de venta.' })
    }
  })

/**
 * Activo capturado sin factura (R7): el cliente llega a medio camino y nos da el tipo, el monto
 * mensual que deprecia y el mes en que empezó. `POST /captured` y `PUT /captured/{id}` llevan los
 * mismos campos.
 */
export const capturedFixedAssetSchema = z
  .object({
    rfc: z.string().trim().toUpperCase().min(12, 'RFC inválido.').max(13, 'RFC inválido.'),
    assetTypeCode: z.string().trim().min(1, 'Elige el tipo de activo.'),
    description: descripcion.optional(),
    monthlyAmount: z
      .number({ invalid_type_error: 'Monto mensual: captura un número.', required_error: 'Captura el monto mensual.' })
      .finite('Monto mensual: captura un número.')
      .positive('El monto mensual debe ser mayor a cero.')
      .refine(dosDecimales, 'Monto mensual: máximo dos decimales.'),
    startFiscalYear: z
      .number({ invalid_type_error: 'Captura el año en que empezó.', required_error: 'Captura el año en que empezó.' })
      .int('Año inválido.')
      .min(2000, 'El año no puede ser anterior a 2000.'),
    startMonth: z
      .number({ invalid_type_error: 'Elige el mes en que empezó.', required_error: 'Elige el mes en que empezó.' })
      .int('Mes inválido.')
      .min(1, 'El mes va de 1 a 12.')
      .max(12, 'El mes va de 1 a 12.'),
  })
  .refine(
    (v) => {
      const hoy = new Date()
      return v.startFiscalYear * 12 + v.startMonth <= hoy.getFullYear() * 12 + hoy.getMonth() + 1
    },
    { path: ['startMonth'], message: 'El mes en que empezó no puede ser futuro.' },
  )

export type CreateFixedAssetSchemaInput = z.input<typeof createFixedAssetSchema>
export type CapturedFixedAssetSchemaInput = z.input<typeof capturedFixedAssetSchema>
export type UpdateFixedAssetSchemaInput = z.input<typeof updateFixedAssetSchema>
export type DisposeFixedAssetSchemaInput = z.input<typeof disposeFixedAssetSchema>
