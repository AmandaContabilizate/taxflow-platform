import { z } from "zod";
import { getPasswordErrors } from "../lib/passwordPolicy";

export const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().superRefine((password, ctx) => {
    for (const message of getPasswordErrors(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    }
  }),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;
