import { z } from "zod";

/** `POST declarations/{id}/resend-to-client` (E2). `note` es opcional, máx. 500. */
export const resendDeclarationSchema = z.object({
  declarationId: z.number().int().positive(),
  note: z.string().trim().max(500).optional(),
});

export type ResendDeclarationInput = z.input<typeof resendDeclarationSchema>;
