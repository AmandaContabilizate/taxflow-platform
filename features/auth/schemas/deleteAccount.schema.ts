import { z } from "zod";

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Ingresa tu contraseña para confirmar"),
});

export type DeleteAccountSchema = z.infer<typeof deleteAccountSchema>;
