import { z } from "zod";

/** Máximo de `Declarations.DeclarationLog.Note`, que es donde se guarda el motivo. */
export const REOPEN_REASON_MAX_LENGTH = 500;

/** `POST declarations/{id}/reopen`. El motivo es obligatorio y nunca le llega al cliente. */
export const reopenDeclarationSchema = z.object({
  declarationId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(1, "Escribe el motivo de la reapertura.")
    .max(REOPEN_REASON_MAX_LENGTH, `El motivo no puede exceder ${REOPEN_REASON_MAX_LENGTH} caracteres.`),
});

export type ReopenDeclarationInput = z.input<typeof reopenDeclarationSchema>;
