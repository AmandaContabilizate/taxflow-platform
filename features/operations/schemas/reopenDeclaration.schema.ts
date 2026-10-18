import { z } from "zod";

/** Máximo de `Declarations.DeclarationLog.Note`, que es donde se guarda el motivo. */
export const REOPEN_REASON_MAX_LENGTH = 500;

/**
 * `Catalogs.ComplementaryFilingReason` que el contador elige al reabrir una Presentada:
 * 1 ErrorPropio, 3 ErrorAtribuibleAlContribuyente.
 */
export const REOPEN_COMPLEMENTARY_REASON = {
  OWN_ERROR: 1,
  TAXPAYER_ERROR: 3,
} as const;

/**
 * `POST declarations/{id}/reopen`. El motivo es obligatorio y nunca le llega al cliente.
 * `complementaryReasonId` solo aplica (y es obligatorio) al reabrir una Presentada: el back lo valida.
 */
export const reopenDeclarationSchema = z.object({
  declarationId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(1, "Escribe el motivo de la reapertura.")
    .max(REOPEN_REASON_MAX_LENGTH, `El motivo no puede exceder ${REOPEN_REASON_MAX_LENGTH} caracteres.`),
  complementaryReasonId: z
    .union([
      z.literal(REOPEN_COMPLEMENTARY_REASON.OWN_ERROR),
      z.literal(REOPEN_COMPLEMENTARY_REASON.TAXPAYER_ERROR),
    ])
    .optional(),
});

export type ReopenDeclarationInput = z.input<typeof reopenDeclarationSchema>;
export type ReopenComplementaryReasonId = NonNullable<ReopenDeclarationInput["complementaryReasonId"]>;
