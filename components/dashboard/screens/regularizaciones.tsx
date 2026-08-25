'use client'

import { PurchasedDeclarations } from '../operaciones/purchased-declarations'

interface CurrentUser {
  userId: string
  fullName: string
}

export function RegularizacionesScreen({ currentUser }: { currentUser: CurrentUser }) {
  return <PurchasedDeclarations mode="regularization" currentUser={currentUser} />
}
