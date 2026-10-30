import { z } from "zod";

export const deleteAccountPublicSchema = z.object({
  email: z.string().trim().min(1, "Ingresa tu correo").email("Correo inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export type DeleteAccountPublicSchema = z.infer<typeof deleteAccountPublicSchema>;
