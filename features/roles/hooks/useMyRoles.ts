'use client'

import { useQuery } from '@tanstack/react-query'
import { getMyRoles } from '../actions/getMyRoles.action'
import { roleLabel, type MyRole } from '../types'

/** Nombre visible de un rol propio: el español si existe, si no el técnico. */
export function myRoleLabel(r: MyRole): string {
  return roleLabel({ name: r.roleName, displayName: r.displayName })
}

/**
 * Roles del usuario autenticado. Una vez por sesión: cambiar de rol recarga la página completa.
 * `canSwitch` = tiene 2 o más roles (solo entonces se muestra el selector).
 */
export function useMyRoles() {
  const query = useQuery({
    queryKey: ['users', 'me', 'roles'],
    staleTime: Infinity,
    retry: 1,
    queryFn: async () => {
      const res = await getMyRoles()
      if (!res.success) throw new Error(res.error.message)
      return res.value
    },
  })

  const roles = query.data ?? []
  return {
    roles,
    active: roles.find((r) => r.isDefault) ?? null,
    canSwitch: roles.length > 1,
    loading: query.isLoading,
  }
}
