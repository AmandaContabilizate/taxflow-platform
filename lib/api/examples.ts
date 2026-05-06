/**
 * Ejemplos de uso del cliente API
 * Reemplaza los endpoints con los de tu backend C#
 */

import { getApiClient, isOk, isErr } from '@/lib/api'

// ─────────────────────────────────────────────────────────────────
// 1. USO BÁSICO - GET
// ─────────────────────────────────────────────────────────────────

export async function fetchUserProfile(userId: string) {
  const api = getApiClient()
  
  // GET /api/users/{userId}
  const result = await api.get(`/api/users/${userId}`)
  
  if (isOk(result)) {
    console.log('User:', result.data)
    return result.data
  }
  
  if (isErr(result)) {
    console.error(`Error [${result.error.status}]:`, result.error.message)
    console.error('URL:', result.error.url)
    console.error('Body:', result.error.body)
  }
}

// ─────────────────────────────────────────────────────────────────
// 2. POST CON BODY
// ─────────────────────────────────────────────────────────────────

export async function createDeclaration(data: {
  rfcId: string
  year: number
  content: unknown
}) {
  const api = getApiClient()
  
  const result = await api.post('/api/declarations', data)
  
  if (isOk(result)) {
    return result.data
  }
  
  throw result.error
}

// ─────────────────────────────────────────────────────────────────
// 3. CON PARÁMETROS DE QUERY
// ─────────────────────────────────────────────────────────────────

export async function searchRegimes(searchTerm: string) {
  const api = getApiClient()
  
  const result = await api.get('/api/regimes', {
    params: {
      search: searchTerm,
      limit: 10,
    },
  })
  
  return result
}

// ─────────────────────────────────────────────────────────────────
// 4. CON TOKEN DE AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────────

export async function setUserToken(token: string) {
  const api = getApiClient()
  api.setAuthToken(token)
}

export async function getAuthenticatedUser() {
  const api = getApiClient()
  const result = await api.get('/api/auth/me')
  
  if (isErr(result) && result.error.status === 401) {
    console.log('Token expired or invalid')
    api.setAuthToken('') // Clear token
  }
  
  return result
}

// ─────────────────────────────────────────────────────────────────
// 5. CON RETRY AUTOMÁTICO
// ─────────────────────────────────────────────────────────────────

export async function resilientRequest(endpoint: string) {
  const api = getApiClient()
  
  // Intentará 3 veces en caso de errores 5xx
  const result = await api.get(endpoint, {
    retry: 3,
    timeout: 10000, // 10 segundos
  })
  
  return result
}

// ─────────────────────────────────────────────────────────────────
// 6. MAPEO DE RESULTADOS
// ─────────────────────────────────────────────────────────────────

export async function getUserWithDeclarations(userId: string) {
  const api = getApiClient()
  
  const result = await api.get(`/api/users/${userId}`)
  
  // mapOk ejecuta una función si el resultado es exitoso
  const resultWithDeclarations = await api.mapOk(result, async (user) => {
    const declResult = await api.get(`/api/declarations?userId=${userId}`)
    return isOk(declResult) ? { ...user, declarations: declResult.data } : user
  })
  
  // mapErr ejecuta una función si hay error
  await api.mapErr(resultWithDeclarations, (error) => {
    console.error(`Request failed: ${error.message}`)
  })
  
  return resultWithDeclarations
}

// ─────────────────────────────────────────────────────────────────
// 7. ACTUALIZACIÓN (PUT/PATCH)
// ─────────────────────────────────────────────────────────────────

export async function updateUserProfile(userId: string, updates: Record<string, unknown>) {
  const api = getApiClient()
  
  return api.patch(`/api/users/${userId}`, updates)
}

// ─────────────────────────────────────────────────────────────────
// 8. ELIMINACIÓN
// ─────────────────────────────────────────────────────────────────

export async function deleteDeclaration(declarationId: string) {
  const api = getApiClient()
  
  return api.delete(`/api/declarations/${declarationId}`)
}
