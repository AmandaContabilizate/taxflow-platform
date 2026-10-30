import { z } from "zod";

/** Lista blanca server-side de `GET .../invoices` (E2). */
export const invoiceSortSchema = z.object({
  sortBy: z.enum(["invoiceDate", "total"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type InvoiceSortInput = z.input<typeof invoiceSortSchema>;
