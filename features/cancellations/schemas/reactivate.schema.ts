import { z } from "zod";

/** Cabe con holgura en `DeclarationLog.Note` (500) y en `ReasonNote` (1000). */
export const REACTIVATE_NOTE_MAX_LENGTH = 400;

/** `POST cancellations/declarations/{id}/reactivate`. La nota es opcional: va a la bitácora. */
export const reactivateDeclarationSchema = z.object({
  declarationId: z.number().int().positive(),
  note: z
    .string()
    .trim()
    .max(REACTIVATE_NOTE_MAX_LENGTH, `La nota no puede exceder ${REACTIVATE_NOTE_MAX_LENGTH} caracteres.`),
});

/**
 * `POST taxpayers/{id}/reactivate`. `reactivateDeclarations` regresa las 19 cuyo log diga
 * `gerencia-cancel-cliente` (no las canceladas una a una).
 */
export const reactivateTaxpayerSchema = z.object({
  taxpayerId: z.number().int().positive(),
  note: z
    .string()
    .trim()
    .max(REACTIVATE_NOTE_MAX_LENGTH, `La nota no puede exceder ${REACTIVATE_NOTE_MAX_LENGTH} caracteres.`),
  reactivateDeclarations: z.boolean().default(true),
  // El back pide la contraseña del gerente, igual que en la baja.
  password: z.string().min(1, "Confirma con tu contraseña."),
});

export type ReactivateDeclarationInput = z.input<typeof reactivateDeclarationSchema>;
export type ReactivateTaxpayerInput = z.input<typeof reactivateTaxpayerSchema>;
