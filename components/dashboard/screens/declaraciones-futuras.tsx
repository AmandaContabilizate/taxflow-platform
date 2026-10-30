'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

/**
 * Todas las declaraciones compradas como "a futuro" (kind=2), sin importar si su
 * periodo ya pasó — el criterio es el kind de la compra, no el calendario (E4).
 */
export function DeclaracionesFuturasScreen({
  currentUser,
  permissions = [],
}: {
  currentUser: CurrentUser
  permissions?: string[]
}) {
  return <PurchasedDeclarations mode="future" currentUser={currentUser} permissions={permissions} />
}
