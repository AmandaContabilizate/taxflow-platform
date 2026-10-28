import { z } from "zod";
import { CANCELLATION_REASON_OTHER } from "../types";

/** El back arma `Note` = "<motivo>: <nota>" en `DeclarationLog.Note` (500); 400 deja espacio al prefijo. */
export const CANCEL_NOTE_MAX_LENGTH = 400;
/** Tope del lote: mismo límite del back (`declarationIds` 1..100). */
export const CANCEL_MAX_DECLARATIONS = 100;

/** `POST cancellations/declarations`. La nota es obligatoria solo con el motivo 99 Otro. */
export const cancelDeclarationsSchema = z
  .object({
    declarationIds: z
      .array(z.number().int().positive())
      .min(1, "Selecciona al menos una declaración.")
      .max(CANCEL_MAX_DECLARATIONS, `Máximo ${CANCEL_MAX_DECLARATIONS} declaraciones por lote.`),
    reasonId: z.number().int().positive("Elige el motivo de la cancelación."),
    note: z
      .string()
      .trim()
      .max(CANCEL_NOTE_MAX_LENGTH, `La nota no puede exceder ${CANCEL_NOTE_MAX_LENGTH} caracteres.`),
  })
  .refine((v) => v.reasonId !== CANCELLATION_REASON_OTHER || v.note.length > 0, {
    message: "Con el motivo “Otro” la nota es obligatoria.",
    path: ["note"],
  });

export type CancelDeclarationsInput = z.input<typeof cancelDeclarationsSchema>;
