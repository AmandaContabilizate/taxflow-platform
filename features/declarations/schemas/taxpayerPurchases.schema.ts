import { z } from 'zod'

/** Paginado común de los endpoints de compras del contador. */
const paging = {
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(200).default(50),
}

/** 1 = solo regularizaciones, 2 = solo a futuro, ausente = ambas (E5.1). */
const kind = z.union([z.literal(1), z.literal(2)]).optional()

/** Nivel 1: contribuyentes con compras. `search` filtra por RFC o razón social. */
export const taxpayerGroupsSchema = z.object({
  search: z.string().trim().min(1).optional(),
  kind,
  ...paging,
})

/** Nivel 2: declaraciones compradas de un contribuyente. */
export const taxpayerPurchasesSchema = z.object({
  rfc: z.string().trim().toUpperCase().min(12).max(13).optional(),
  kind,
  ...paging,
})

export type TaxpayerGroupsInput = z.input<typeof taxpayerGroupsSchema>
export type TaxpayerPurchasesInput = z.input<typeof taxpayerPurchasesSchema>
