import { z } from 'zod'

export const DECLARATION_TYPES = ['Normal', 'Complementaria'] as const

const hoy = () => {
  const d = new Date()
  const month = d.getMonth() + 1
  const iso = `${d.getFullYear()}-${String(month).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { year: d.getFullYear(), month, iso }
}

const dosDecimales = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6

const monto = (campo: string) =>
  z
    .number({ invalid_type_error: `${campo}: captura un número.` })
    .finite(`${campo}: captura un número.`)
    .refine(dosDecimales, `${campo}: máximo dos decimales.`)

const campos = {
  originFiscalYear: z
    .number({ invalid_type_error: 'Captura el ejercicio de origen.' })
    .int('El ejercicio es un año de cuatro dígitos.')
    .min(2014, 'El ejercicio de origen no puede ser anterior a 2014.')
    .max(2100, 'Ejercicio inválido.'),
  originMonth: z
    .number({ invalid_type_error: 'Elige el mes de origen.' })
    .int()
    .min(1, 'Elige el mes de origen.')
    .max(12, 'Elige el mes de origen.'),
  // El número de operación del acuse del SAT es numérico (p. ej. 261070222607).
  operationNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, 'El folio de operación son solo dígitos (de 6 a 20).'),
  declarationType: z.enum(DECLARATION_TYPES, {
    errorMap: () => ({ message: 'Elige si la declaración fue Normal o Complementaria.' }),
  }),
  presentedDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Captura la fecha de presentación.'),
  originalAmount: monto('Monto original').refine((n) => n > 0, 'El monto original debe ser mayor a cero.'),
  remainingAmount: monto('Remanente').refine((n) => n >= 0, 'El remanente no puede ser negativo.'),
}

type Campos = {
  originFiscalYear?: number
  originMonth?: number
  presentedDate?: string
  originalAmount?: number
  remainingAmount?: number
}

/**
 * Reglas que cruzan campos. Solo se aplican cuando ambos lados vienen (en el PUT pueden
 * faltar): el saldo no puede ser de un mes futuro, la declaración se presenta después de
 * que termina su mes, y lo que queda no puede pasar de lo que se generó.
 */
function cruzadas(v: Campos, ctx: z.RefinementCtx) {
  const h = hoy()
  if (v.originFiscalYear != null && v.originMonth != null) {
    const origen = v.originFiscalYear * 100 + v.originMonth
    if (origen > h.year * 100 + h.month) {
      ctx.addIssue({ code: 'custom', path: ['originMonth'], message: 'El periodo de origen no puede ser futuro.' })
    }
    if (v.presentedDate) {
      const siguiente =
        v.originMonth === 12
          ? `${v.originFiscalYear + 1}-01-01`
          : `${v.originFiscalYear}-${String(v.originMonth + 1).padStart(2, '0')}-01`
      if (v.presentedDate < siguiente) {
        ctx.addIssue({
          code: 'custom',
          path: ['presentedDate'],
          message: 'La declaración se presenta después de que termina el mes de origen.',
        })
      }
    }
  }
  if (v.presentedDate && v.presentedDate > h.iso) {
    ctx.addIssue({ code: 'custom', path: ['presentedDate'], message: 'La fecha de presentación no puede ser futura.' })
  }
  if (v.originalAmount != null && v.remainingAmount != null && v.remainingAmount > v.originalAmount) {
    ctx.addIssue({
      code: 'custom',
      path: ['remainingAmount'],
      message: 'El remanente no puede ser mayor que el monto original.',
    })
  }
}

export const createIvaFavorBalanceSchema = z
  .object({
    rfc: z.string().trim().toUpperCase().min(12, 'RFC inválido.').max(13, 'RFC inválido.'),
    ...campos,
  })
  .superRefine(cruzadas)

export const updateIvaFavorBalanceSchema = z
  .object({
    originFiscalYear: campos.originFiscalYear.optional(),
    originMonth: campos.originMonth.optional(),
    operationNumber: campos.operationNumber.optional(),
    declarationType: campos.declarationType.optional(),
    presentedDate: campos.presentedDate.optional(),
    originalAmount: campos.originalAmount.optional(),
    remainingAmount: campos.remainingAmount.optional(),
  })
  .superRefine(cruzadas)

export type CreateIvaFavorBalanceSchemaInput = z.input<typeof createIvaFavorBalanceSchema>
export type UpdateIvaFavorBalanceSchemaInput = z.input<typeof updateIvaFavorBalanceSchema>
