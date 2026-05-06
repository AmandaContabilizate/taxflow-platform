import { z } from 'zod'

/**
 * API Error Class
 * Proporciona información detallada sobre errores de API
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, unknown>,
    public url: string,
  ) {
    super(`API Error ${status}: ${body?.message || 'Unknown error'}`)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * Result Type para manejo de errores funcional
 * Retorna { ok: true, data } o { ok: false, error }
 */
export type Result<T> = 
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

/**
 * Esquemas de validación comunes
 */
export const ResponseSchema = z.object({
  success: z.boolean().optional(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  error: z.string().optional(),
})

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
})

/**
 * Tipos para requests
 */
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface RequestOptions {
  method?: RequestMethod
  headers?: Record<string, string>
  body?: unknown
  params?: Record<string, string | number | boolean>
  timeout?: number
  retry?: number
}

/**
 * Tipos para respuestas
 */
export interface ApiResponse<T = unknown> {
  ok: boolean
  status: number
  data?: T
  error?: string
  message?: string
}
