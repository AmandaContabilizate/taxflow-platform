'use client'

import { ApiError, type Result, type RequestMethod, type RequestOptions } from './types'

/**
 * Cliente API optimizado para conectarse a backend C#
 * - ~190 líneas con único request() interno (DRY)
 * - Manejo de errores con ApiError class
 * - Helpers ok() / err() para Result
 * - Retry automático
 * - Cancelación de requests con AbortController
 */

class ApiClient {
  private baseUrl: string
  private headers: Record<string, string>
  private timeout: number

  constructor(
    baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    defaultHeaders: Record<string, string> = {},
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.headers = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    }
    this.timeout = 30000 // 30s default
  }

  /**
   * Establece el token de autenticación
   */
  setAuthToken(token: string) {
    if (token) {
      this.headers['Authorization'] = `Bearer ${token}`
    } else {
      delete this.headers['Authorization']
    }
  }

  /**
   * Core request method - único lugar donde ocurren requests HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params = {},
      timeout = this.timeout,
      retry = 0,
    } = options

    // Construir URL con query params
    const url = new URL(`${this.baseUrl}${endpoint}`)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: { ...this.headers, ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // Intentar parsear JSON, fallback a text
      let responseBody: Record<string, unknown> = {}
      const contentType = response.headers.get('content-type')
      try {
        if (contentType?.includes('application/json')) {
          responseBody = await response.json()
        } else {
          const text = await response.text()
          responseBody = { message: text }
        }
      } catch {
        responseBody = { message: 'Invalid response body' }
      }

      // Requests exitosos (2xx)
      if (response.ok) {
        return ok(responseBody as T)
      }

      // Status 401 Unauthorized - limpiar token
      if (response.status === 401) {
        this.setAuthToken('')
      }

      // Retry logic para errores de servidor (5xx)
      if (response.status >= 500 && retry > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return this.request<T>(endpoint, { ...options, retry: retry - 1 })
      }

      // Error
      return err(new ApiError(response.status, responseBody, url.toString()))
    } catch (error) {
      clearTimeout(timeoutId)

      // AbortError por timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        return err(
          new ApiError(408, { message: 'Request timeout' }, url.toString()),
        )
      }

      // Network error
      const message = error instanceof Error ? error.message : 'Network error'
      return err(new ApiError(0, { message }, url.toString()))
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Métodos públicos por verbo HTTP
  // ─────────────────────────────────────────────────────────────────

  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<Result<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body })
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body })
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options: RequestOptions = {},
  ): Promise<Result<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<Result<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers para manejo de errores
  // ─────────────────────────────────────────────────────────────────

  /**
   * Ejecuta callback si Result es exitoso
   */
  async mapOk<T, U>(
    result: Result<T>,
    fn: (data: T) => Promise<U> | U,
  ): Promise<Result<U>> {
    if (result.ok) {
      try {
        const data = await fn(result.data)
        return ok(data)
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new ApiError(500, { message: String(error) }, '')
        return err(apiError)
      }
    }
    return result as Result<U>
  }

  /**
   * Ejecuta callback si Result es error
   */
  async mapErr<T>(
    result: Result<T>,
    fn: (error: ApiError) => void,
  ): Promise<Result<T>> {
    if (!result.ok) {
      fn(result.error)
    }
    return result
  }
}

/**
 * Singleton instance
 */
let instance: ApiClient | null = null

export function getApiClient(): ApiClient {
  if (!instance) {
    instance = new ApiClient()
  }
  return instance
}

export function createApiClient(
  baseUrl?: string,
  headers?: Record<string, string>,
): ApiClient {
  return new ApiClient(baseUrl, headers)
}

/**
 * Helpers para Result
 */
export function ok<T>(data: T): Result<T> {
  return { ok: true, data }
}

export function err<T>(error: ApiError): Result<T> {
  return { ok: false, error }
}

/**
 * Type guard para Result
 */
export function isOk<T>(result: Result<T>): result is { ok: true; data: T } {
  return result.ok
}

export function isErr<T>(result: Result<T>): result is { ok: false; error: ApiError } {
  return !result.ok
}
