import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rememberMe: z.boolean().optional().default(false),
});

export type SignInSchema = z.infer<typeof signInSchema>;
