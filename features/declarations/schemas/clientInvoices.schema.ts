import { z } from 'zod'

/** Query de `declaration/client-invoices`. */
export const clientDeclarationInvoicesSchema = z.object({
  declarationId: z.number().int().positive('Declaración inválida.'),
})

export type ClientDeclarationInvoicesInput = z.input<typeof clientDeclarationInvoicesSchema>
