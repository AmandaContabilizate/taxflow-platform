import { z } from 'zod'

/** Token cifrado url-safe del `?t=`. Solo se valida presencia y forma, no contenido. */
export const paymentTokenSchema = z
  .string()
  .trim()
  .min(1, 'El enlace no es válido.')
  .regex(/^[A-Za-z0-9_-]+$/, 'El enlace no es válido.')
