'use client'

import { createContext, useContext, useMemo, type ReactNode } from 'react'

const PermissionsContext = createContext<ReadonlySet<string>>(new Set<string>())

/**
 * Claims del usuario disponibles en cualquier punto del árbol del dashboard.
 * Los permisos ya viajan por props a las pantallas; esto es para los componentes
 * profundos que solo necesitan ocultar un control y no justifican arrastrar el
 * arreglo por media docena de niveles.
 */
export function PermissionsProvider({
  permissions,
  children,
}: {
  permissions: string[]
  children: ReactNode
}) {
  const value = useMemo(() => new Set(permissions), [permissions])
  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
}

export function useHasPermission(permission: string): boolean {
  return useContext(PermissionsContext).has(permission)
}
