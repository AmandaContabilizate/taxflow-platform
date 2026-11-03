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

export type EmailChangeRequestSchema = z.infer<typeof emailChangeRequestSchema>;
export type EmailChangeConfirmSchema = z.infer<typeof emailChangeConfirmSchema>;
