import { z } from 'zod'

/** Paginado común de los endpoints de compras del contador. */
const paging = {
  skip: z.number().int().min(0).default(0),
  take: z.number().int().min(1).max(200).default(50),
}

/** Nivel 1: contribuyentes con compras. `search` filtra por RFC o razón social. */
export const taxpayerGroupsSchema = z.object({
  search: z.string().trim().min(1).optional(),
  ...paging,
})

/** Nivel 2: declaraciones compradas de un contribuyente. */
export const taxpayerPurchasesSchema = z.object({
  rfc: z.string().trim().toUpperCase().min(12).max(13).optional(),
  ...paging,
})

export type TaxpayerGroupsInput = z.input<typeof taxpayerGroupsSchema>
export type TaxpayerPurchasesInput = z.input<typeof taxpayerPurchasesSchema>
