# Cliente API Optimizado - Guía de Integración

Este proyecto incluye un cliente API moderno y optimizado para conectarse a tu backend C#. Está diseñado con las mejores prácticas de manejo de errores, retry automático, y type-safety.

## Estructura

```
lib/api/
├── types.ts       # Tipos, ApiError class, schemas Zod
├── client.ts      # Cliente API (~238 líneas, único request() interno)
├── index.ts       # Exports públicos
└── examples.ts    # Ejemplos de uso
```

## Características

✅ **DRY (Don't Repeat Yourself)**: Único `request()` interno para todos los verbos HTTP
✅ **ApiError Class**: Error con status, body, url para discriminar errores fácilmente
✅ **Result Type**: Manejo de errores funcional sin try/catch
✅ **Helpers ok()/err()**: Funciones auxiliares para crear Results
✅ **Type Guards**: `isOk()` / `isErr()` para discriminar tipos
✅ **Retry Automático**: Reintentos para errores 5xx
✅ **Cancelación**: AbortController para timeouts
✅ **Auth Token**: Método `setAuthToken()` para persistir token en headers

## Configuración

### 1. Agregar URL del Backend

En `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Si tu backend está en producción:

```bash
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

### 2. Usar el Cliente en Componentes

#### Ejemplo Básico - GET

```typescript
'use client'

import { getApiClient, isOk, isErr } from '@/lib/api'

export async function UserProfile({ userId }: { userId: string }) {
  const api = getApiClient()
  const result = await api.get(`/api/users/${userId}`)
  
  if (isOk(result)) {
    return <div>{result.data.name}</div>
  }
  
  if (isErr(result)) {
    return <div>Error: {result.error.message}</div>
  }
}
```

#### Ejemplo con POST

```typescript
async function createDeclaration(data: DeclarationInput) {
  const api = getApiClient()
  const result = await api.post('/api/declarations', data, {
    retry: 2,
    timeout: 15000,
  })
  
  if (isOk(result)) {
    toast.success('Declaración creada')
    return result.data
  }
  
  toast.error(result.error.message)
  throw result.error
}
```

#### Ejemplo con Autenticación

```typescript
// En login
export async function login(email: string, password: string) {
  const api = getApiClient()
  
  const result = await api.post('/api/auth/login', { email, password })
  
  if (isOk(result)) {
    const { token } = result.data as { token: string }
    api.setAuthToken(token)
    localStorage.setItem('authToken', token) // Persiste si lo necesitas
    return result.data
  }
  
  return result
}

// En startup (layout.tsx o similar)
useEffect(() => {
  const token = localStorage.getItem('authToken')
  if (token) {
    const api = getApiClient()
    api.setAuthToken(token)
  }
}, [])
```

## Endpoints Esperados en C#

El cliente asume estos endpoints base en tu backend:

```
GET    /api/users/{userId}           # Obtener usuario
POST   /api/declarations              # Crear declaración
GET    /api/declarations?userId=...   # Listar declaraciones
PATCH  /api/users/{userId}            # Actualizar usuario
DELETE /api/declarations/{id}         # Eliminar declaración
POST   /api/auth/login                # Login
GET    /api/auth/me                   # Obtener usuario actual
GET    /api/regimes                   # Listar regímenes fiscales
```

Ajusta los endpoints según tu backend C#.

## Discriminación de Errores

```typescript
const result = await api.get('/api/users/123')

if (isErr(result)) {
  const { status, message, body, url } = result.error
  
  switch (status) {
    case 401:
      // Unauthorized - token inválido/expirado
      api.setAuthToken('')
      redirect('/login')
      break
    case 404:
      // Not found
      console.log('Usuario no existe')
      break
    case 500:
      // Server error (ya reintentó automáticamente)
      toast.error('Error del servidor. Intenta más tarde.')
      break
    case 0:
      // Network error
      toast.error('Sin conexión')
      break
  }
}
```

## Avanzado - Mapeo de Resultados

```typescript
const userResult = await api.get('/api/users/123')

// mapOk ejecuta una función si es exitoso
const enrichedResult = await api.mapOk(userResult, async (user) => {
  const declResult = await api.get(`/api/declarations?userId=${user.id}`)
  return isOk(declResult) ? { ...user, declarations: declResult.data } : user
})

// mapErr ejecuta una función si hay error
await api.mapErr(enrichedResult, (error) => {
  console.error(`Failed: ${error.message}`)
  sentry.captureException(error)
})
```

## Integración con Componentes

### En Server Components (RSC)

```typescript
// app/users/[id]/page.tsx
import { createApiClient } from '@/lib/api'

export default async function UserPage({ params }: { params: { id: string } }) {
  const api = createApiClient() // Nueva instancia para RSC
  const result = await api.get(`/api/users/${params.id}`)
  
  if (!result.ok) {
    return <div>Error: {result.error.message}</div>
  }
  
  return <div>{result.data.name}</div>
}
```

### En Client Components

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getApiClient, isOk } from '@/lib/api'

export function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const api = getApiClient()
    
    api.get('/api/users').then(result => {
      if (isOk(result)) {
        setUsers(result.data)
      }
      setLoading(false)
    })
  }, [])
  
  if (loading) return <div>Cargando...</div>
  return <div>{users.map(u => <div key={u.id}>{u.name}</div>)}</div>
}
```

## Próximos Pasos

1. **Configura `NEXT_PUBLIC_API_URL`** en `.env.local`
2. **Reemplaza los endpoints** con los de tu backend C#
3. **Llama `getApiClient()` o `createApiClient()`** en tus componentes
4. **Usa `isOk(result)` / `isErr(result)`** para discriminar resultados

¡Listo! Tu cliente API está optimizado, type-safe, y listo para conectarse a C#.
