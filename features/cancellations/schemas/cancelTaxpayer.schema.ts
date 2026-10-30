import { z } from "zod";

/** `Users.TaxpayerDeactivation.ReasonNote` nvarchar(1000). */
export const DEACTIVATION_NOTE_MAX_LENGTH = 1000;
/** `Users.TaxpayerDeactivation.RequestReference` nvarchar(255). */
export const DEACTIVATION_REFERENCE_MAX_LENGTH = 255;

const RFC_PATTERN = /^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/;

/**
 * `POST taxpayers/{id}/deactivate` por gerencia comercial: siempre Soft, con el RFC reescrito,
 * motivo del catálogo (7 CommercialCancellation), folio/ticket y contraseña del gerente.
 * `confirmRfc` debe coincidir con el RFC del contribuyente (el back responde RFC_CONFIRMATION_MISMATCH).
 */
export const cancelTaxpayerSchema = z.object({
  taxpayerId: z.number().int().positive(),
  rfc: z.string().trim().toUpperCase(),
  confirmRfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(RFC_PATTERN, "Escribe el RFC completo (12 o 13 caracteres)."),
  reasonId: z.number().int().positive("Elige el motivo de la baja."),
  reasonNote: z
    .string()
    .trim()
    .max(DEACTIVATION_NOTE_MAX_LENGTH, `La nota no puede exceder ${DEACTIVATION_NOTE_MAX_LENGTH} caracteres.`),
  requestReference: z
    .string()
    .trim()
    .min(1, "Captura el folio o ticket de la solicitud.")
    .max(DEACTIVATION_REFERENCE_MAX_LENGTH, `El folio no puede exceder ${DEACTIVATION_REFERENCE_MAX_LENGTH} caracteres.`),
  password: z.string().min(1, "Confirma con tu contraseña."),
  cancelOpenDeclarations: z.boolean().default(true),
  cancelSubscription: z.boolean().default(true),
}).refine((v) => v.confirmRfc === v.rfc, {
  message: "El RFC escrito no coincide con el del contribuyente.",
  path: ["confirmRfc"],
});

export type CancelTaxpayerInput = z.input<typeof cancelTaxpayerSchema>;
