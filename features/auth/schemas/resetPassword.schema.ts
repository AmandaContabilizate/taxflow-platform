import { z } from "zod";
import { getPasswordErrors } from "../lib/passwordPolicy";

export const resetPasswordSchema = z
  .object({
    email: z.string().email("Email inválido"),
    resetCode: z.string().min(1, "Código requerido"),
    newPassword: z.string().superRefine((password, ctx) => {
      for (const message of getPasswordErrors(password)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
