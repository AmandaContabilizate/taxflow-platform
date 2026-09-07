'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

export function OperacionesScreen({
  currentUser,
  permissions = [],
}: {
  currentUser: CurrentUser
  permissions?: string[]
}) {
  return <PurchasedDeclarations mode="all" currentUser={currentUser} permissions={permissions} />
}
