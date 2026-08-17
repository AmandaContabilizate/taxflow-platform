import { z } from 'zod'

/**
 * `ClassificationAdjustmentDto`. Los campos opcionales se omiten (no se manda
 * `null`): el clasificador aplica los ajustes con `exclude_unset`, así que un null
 * explícito borraría el valor que ya tenía el comprobante.
 */
export const classificationAdjustmentSchema = z.object({
  uuid: z.string().trim().min(1, 'El ajuste necesita el UUID del comprobante.'),
  classification: z.string().trim().min(1).optional(),
  isDeductible: z.boolean().optional(),
  isExpense: z.boolean().optional(),
  activityId: z.number().int().positive().optional(),
  reason: z.string().trim().min(1).optional(),
})

/** `RecalculateDeclarationRequestDto`. `regimeCode` es el código SAT, no el Id interno. */
export const recalculateDeclarationSchema = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .min(12, 'RFC inválido.')
    .max(13, 'RFC inválido.'),
  fiscalYear: z.number().int().min(2000).max(2100),
  periodValueId: z.number().int().positive(),
  regimeCode: z.string().trim().min(3, 'Falta el régimen de la declaración.'),
  adjustments: z.array(classificationAdjustmentSchema).default([]),
})

export type RecalculateDeclarationInput = z.input<typeof recalculateDeclarationSchema>

/** Query de `issued|received-invoices-declaration`. */
export const declarationPeriodInvoicesSchema = z.object({
  rfc: z.string().trim().toUpperCase().min(12).max(13),
  year: z.number().int().min(2000).max(2100),
  beginMonth: z.number().int().min(1).max(12),
  endMonth: z.number().int().min(1).max(12),
  /** Id interno de Users.TaxRegimes, no el código SAT. */
  idRegime: z.number().int().positive(),
})

export type DeclarationPeriodInvoicesInput = z.input<typeof declarationPeriodInvoicesSchema>
