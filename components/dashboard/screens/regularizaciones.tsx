'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

export function RegularizacionesScreen({
  currentUser,
  permissions = [],
}: {
  currentUser: CurrentUser
  permissions?: string[]
}) {
  return <PurchasedDeclarations mode="regularization" currentUser={currentUser} permissions={permissions} />
}
