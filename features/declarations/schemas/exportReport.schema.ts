import { z } from 'zod'

/** Filtros de `GET declaration/export-report`: espejo de los del modal, todos opcionales. */
export const exportReportSchema = z.object({
  kind: z.union([z.literal(1), z.literal(2)]).optional(),
  search: z.string().trim().min(1).optional(),
  taxRegimeId: z.number().int().positive().optional(),
  statusId: z.number().int().positive().optional(),
  fiscalYear: z.number().int().positive().optional(),
  month: z.number().int().min(1).max(12).optional(),
  ciecState: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  accountantUserId: z.string().trim().min(1).optional(),
})

export type ExportReportInput = z.input<typeof exportReportSchema>
