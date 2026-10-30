import { z } from 'zod'
import { REPORT_COMMENT_MAX_LENGTH } from '../types'

/** Token AES url-safe del correo. Solo se valida presencia y forma, no contenido. */
export const reportTokenSchema = z
  .string()
  .trim()
  .min(1, 'El enlace no es válido.')
  .regex(/^[A-Za-z0-9_-]+$/, 'El enlace no es válido.')

/** `DeclarationReportCommentRequestDto.Comment`: requerido, máx. 500 en el backend. */
export const reportCommentSchema = z.object({
  comment: z
    .string()
    .trim()
    .min(5, 'Cuéntanos un poco más de tu duda.')
    .max(
      REPORT_COMMENT_MAX_LENGTH,
      `El comentario no puede exceder ${REPORT_COMMENT_MAX_LENGTH} caracteres.`,
    ),
})

export type ReportCommentInput = z.infer<typeof reportCommentSchema>
