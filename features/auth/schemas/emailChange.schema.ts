import { z } from "zod";

const newEmail = z.string().trim().email("Escribe un correo electrónico válido.");

export const emailChangeRequestSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contraseña para confirmar"),
  newEmail,
});

export const emailChangeResendSchema = z.object({ newEmail });

export const emailChangeConfirmSchema = z.object({
  newEmail,
  code: z.string().regex(/^\d{6}$/, "El código es de 6 dígitos."),
});

/** Staff cambia el correo de un cliente: correo nuevo + motivo + contraseña DEL STAFF. */
export const staffEmailChangeSchema = z.object({
  newEmail,
  reason: z.string().trim().min(1, "Escribe el motivo del cambio.").max(500, "Máximo 500 caracteres."),
  staffPassword: z.string().min(1, "Ingresa tu contraseña para confirmar"),
});

export type EmailChangeRequestSchema = z.infer<typeof emailChangeRequestSchema>;
export type EmailChangeConfirmSchema = z.infer<typeof emailChangeConfirmSchema>;
