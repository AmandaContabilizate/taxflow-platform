import { z } from "zod";

/** `GET taxpayers/sat-password?rfc=` — el RFC es lo único que viaja. */
export const satPasswordSchema = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/, "RFC inválido."),
});

export type SatPasswordInput = z.input<typeof satPasswordSchema>;
